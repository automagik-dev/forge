use std::{
    collections::VecDeque,
    fmt::Display,
    sync::{Arc, RwLock},
};

use axum::response::sse::Event;
use futures::{Stream, StreamExt};
use tokio::{sync::broadcast, task::JoinHandle};
use tokio_stream::wrappers::BroadcastStream;
use uuid::Uuid;

/// Keep ~10 KiB of recent SSE payloads.
const HISTORY_BYTES: usize = 10 * 1024;

/// Stored event with its approximate byte footprint.
#[derive(Clone)]
struct StoredEvent {
    event: Event,
    bytes: usize,
}

struct Inner {
    history: VecDeque<StoredEvent>,
    total_bytes: usize,
}

pub struct EventStore {
    inner: RwLock<Inner>,
    sender: broadcast::Sender<Event>,
}

impl EventStore {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(100);
        Self {
            inner: RwLock::new(Inner {
                history: VecDeque::with_capacity(32),
                total_bytes: 0,
            }),
            sender,
        }
    }

    pub fn get_receiver(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }

    pub fn get_history(&self) -> Vec<Event> {
        let inner = self.inner.read().unwrap();
        inner.history.iter().map(|s| s.event.clone()).collect()
    }

    /// Push an already-built event with an explicit size (in bytes).
    /// `bytes` should approximate the payload budget, e.g. `name.len() + data.len() + overhead`.
    pub fn push_event_sized(&self, event: Event, bytes: usize) {
        // Broadcast full event to live listeners
        let _ = self.sender.send(event.clone());

        // Store for history (tracked by size budget)
        let mut inner = self.inner.write().unwrap();
        Self::evict_until_fits(&mut inner, bytes);

        inner.history.push_back(StoredEvent { event, bytes });
        inner.total_bytes = inner.total_bytes.saturating_add(bytes);
    }

    /// Convenience: create & store an event from (name, data).
    /// Uses exact bytes of name + data plus a tiny framing overhead.
    pub fn push_named<S: AsRef<str>>(&self, name: &str, data: S) {
        let data = data.as_ref();
        let bytes = name.len() + data.as_bytes().len() + 8; // tiny framing overhead
        let ev = Event::default().event(name).data(data.to_owned());
        self.push_event_sized(ev, bytes);
    }

    pub fn push_stdout<S: AsRef<str>>(&self, s: S) {
        self.push_named("stdout", s);
    }

    pub fn push_stderr<E: Display>(&self, err: E) {
        let s = err.to_string();
        self.push_named("stderr", &s);
    }

    pub fn push_exit(&self, code: i32) {
        self.push_named("exit", code.to_string());
    }

    pub fn push_stream_closed(&self) {
        self.push_named("stream", "closed");
    }

    pub fn push_json<T: serde::Serialize>(&self, name: &str, value: &T) {
        let data = serde_json::to_string(value).unwrap_or_else(|_| "{}".into());
        self.push_named(name, data);
    }

    pub fn subscribe_with_history(&self) -> (Vec<Event>, broadcast::Receiver<Event>) {
        (self.get_history(), self.get_receiver())
    }

    /// Forward a stream of sized events `(Event, approx_bytes)` into this store.
    pub fn spawn_forwarder<S, E>(self: Arc<Self>, stream: S) -> JoinHandle<()>
    where
        S: Stream<Item = Result<(Event, usize), E>> + Send + 'static,
        E: Display + Send + 'static,
    {
        tokio::spawn(async move {
            tokio::pin!(stream);

            while let Some(next) = stream.next().await {
                match next {
                    Ok((ev, bytes)) => self.push_event_sized(ev, bytes),
                    Err(e) => self.push_stderr(format!("stream error: {e}")),
                }
            }
            self.push_stream_closed();
        })
    }

    /// Evict from the front until `incoming_bytes` would fit.
    fn evict_until_fits(inner: &mut Inner, incoming_bytes: usize) {
        while inner.total_bytes.saturating_add(incoming_bytes) > HISTORY_BYTES {
            if let Some(front) = inner.history.pop_front() {
                inner.total_bytes = inner.total_bytes.saturating_sub(front.bytes);
            } else {
                break;
            }
        }
    }

    pub async fn history_plus_stream(
        &self,
    ) -> Option<futures::stream::BoxStream<'static, Result<Event, std::io::Error>>> {
        let (history, rx) = self.subscribe_with_history();

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
}
