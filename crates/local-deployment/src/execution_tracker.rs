use std::{collections::HashMap, sync::Arc, time::Duration};

use axum::response::sse::Event;
use command_group::AsyncGroupChild;
use futures::{StreamExt, TryStreamExt, stream::select};
use tokio::{sync::RwLock, task::JoinHandle};
use tokio_stream::wrappers::BroadcastStream;
use tokio_util::io::ReaderStream;
use uuid::Uuid;

use crate::event_store::EventStore;

#[derive(Clone)]
pub struct ExecutionTracker {
    pub running_executions: Arc<RwLock<HashMap<Uuid, (AsyncGroupChild, Arc<EventStore>)>>>,
}

impl ExecutionTracker {
    pub fn new() -> Self {
        Self {
            running_executions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_execution(&self, id: Uuid, exec: (AsyncGroupChild, Arc<EventStore>)) {
        let mut map = self.running_executions.write().await;
        map.insert(id, exec);
    }

    pub async fn remove_execution(&self, id: &Uuid) -> Option<(AsyncGroupChild, Arc<EventStore>)> {
        let mut map = self.running_executions.write().await;
        map.remove(id)
    }

    pub async fn get_event_store(&self, id: &Uuid) -> Option<Arc<EventStore>> {
        let map = self.running_executions.read().await;
        map.get(id).map(|(_, store)| store.clone())
    }

    /// Spawn a background task that polls the child process for completion and
    /// cleans up the execution entry when it exits.
    pub fn spawn_exit_monitor(&self, exec_id: Uuid, store: Arc<EventStore>) -> JoinHandle<()> {
        let svc = self.clone();
        tokio::spawn(async move {
            loop {
                // Keep the lock only while calling try_wait (needs &mut)
                let status_opt = {
                    let mut map = svc.running_executions.write().await;
                    match map.get_mut(&exec_id) {
                        Some((child, _)) => match child.try_wait() {
                            Ok(Some(status)) => Some(Ok(status)),
                            Ok(None) => None,
                            Err(e) => Some(Err(e)),
                        },
                        None => break, // already removed elsewhere
                    }
                };

                match status_opt {
                    Some(Ok(status)) => {
                        let code = status.code().unwrap_or_default();
                        store.push_exit(code);
                        let _ = svc.remove_execution(&exec_id).await;

                        // Optional: persist completion here if desired
                        // e.g. ExecutionProcess::mark_finished(...).await?;

                        break;
                    }
                    Some(Err(e)) => {
                        store.push_stderr(format!("wait error: {e}"));
                        let _ = svc.remove_execution(&exec_id).await;
                        break;
                    }
                    None => tokio::time::sleep(Duration::from_millis(250)).await,
                }
            }
        })
    }

    pub async fn history_plus_stream(
        &self,
        id: &Uuid,
    ) -> Option<futures::stream::BoxStream<'static, Result<Event, std::io::Error>>> {
        let store = {
            let map = self.running_executions.read().await;
            map.get(id).map(|(_, s)| s.clone())?
        };

        let (history, rx) = store.subscribe_with_history();

        let history_stream =
            futures::stream::iter(history.into_iter().map(Ok::<_, std::io::Error>));

        let live = BroadcastStream::new(rx).filter_map(|res| async move {
            match res {
                Ok(ev) => Some(Ok::<_, std::io::Error>(ev)),
                Err(_) => None, // drop lagged frames
            }
        });

        Some(Box::pin(history_stream.chain(live)))
    }

    pub async fn start_and_track(&self, id: Uuid, mut child: AsyncGroupChild) {
        let store = Arc::new(EventStore::new());

        // Take pipes once, *before* we stash the child.
        let out = child.inner().stdout.take().expect("no stdout");
        let err = child.inner().stderr.take().expect("no stderr");

        // Stream raw chunks; budget with chunk.len()
        let out = ReaderStream::new(out).map_ok(|chunk| {
            let text = String::from_utf8_lossy(&chunk).to_string();
            let ev = Event::default().event("stdout").data(text);
            (ev, chunk.len())
        });

        let err = ReaderStream::new(err).map_ok(|chunk| {
            let text = String::from_utf8_lossy(&chunk).to_string();
            let ev = Event::default().event("stderr").data(text);
            (ev, chunk.len())
        });

        // Merge and forward into byte‑budgeted history
        let merged = select(out, err);
        store.clone().spawn_forwarder(merged);

        // Register and monitor exit
        self.add_execution(id, (child, store.clone())).await;
        self.spawn_exit_monitor(id, store.clone());
    }
}
