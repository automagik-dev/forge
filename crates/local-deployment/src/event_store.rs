use std::{
    collections::VecDeque,
    fmt::Display,
    sync::{Arc, Mutex},
};

use axum::response::sse::Event;
use futures::{Stream, StreamExt};
use tokio::{sync::broadcast, task::JoinHandle}; // for .next()

const HISTORY_SIZE: usize = 10_000;

pub struct EventStore {
    history: Mutex<VecDeque<Event>>,  // stores recent history
    sender: broadcast::Sender<Event>, // for streaming live events
}

impl EventStore {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(100);
        Self {
            history: Mutex::new(VecDeque::with_capacity(HISTORY_SIZE)),
            sender,
        }
    }

    pub fn get_receiver(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }

    pub fn get_history(&self) -> Vec<Event> {
        self.history.lock().unwrap().iter().cloned().collect()
    }

    pub fn push_event(&self, event: Event) {
        {
            let mut hist = self.history.lock().unwrap();
            if hist.len() == HISTORY_SIZE {
                hist.pop_front();
            }
            hist.push_back(event.clone());
        }
        let _ = self.sender.send(event); // ignore if no receivers
    }

    pub fn push_stdout<S: AsRef<str>>(&self, line: S) {
        self.push_event(Event::default().event("stdout").data(line.as_ref()));
    }

    pub fn push_stderr<E: Display>(&self, err: E) {
        self.push_event(Event::default().event("stderr").data(err.to_string()));
    }

    pub fn push_exit(&self, code: i32) {
        self.push_event(Event::default().event("exit").data(code.to_string()));
    }

    pub fn push_stream_closed(&self) {
        self.push_event(Event::default().event("stream").data("closed"));
    }

    /// If you often send small JSON payloads:
    pub fn push_json<T: serde::Serialize>(&self, name: &str, value: &T) {
        let data = serde_json::to_string(value).unwrap_or_else(|_| "{}".into());
        self.push_event(Event::default().event(name).data(data));
    }

    /// Useful when a consumer connects and wants backfill + live.
    pub fn subscribe_with_history(&self) -> (Vec<Event>, broadcast::Receiver<Event>) {
        (self.get_history(), self.get_receiver())
    }

    /// Spawns a task that forwards a stream of `Event`s into this store.
    /// Reports errors as `stderr` and emits a final `stream: closed`.
    pub fn spawn_forwarder<S, E>(self: Arc<Self>, stream: S) -> JoinHandle<()>
    where
        S: Stream<Item = Result<Event, E>> + Send + 'static,
        E: Display + Send + 'static,
    {
        tokio::spawn(async move {
            tokio::pin!(stream); // <— pins `stream` on the stack

            while let Some(next) = stream.next().await {
                match next {
                    Ok(ev) => self.push_event(ev),
                    Err(e) => self.push_stderr(format!("stream error: {e}")),
                }
            }
            self.push_stream_closed();
        })
    }
}
