use std::{
    collections::VecDeque,
    sync::{Arc, Mutex},
};

use axum::response::sse::Event;
use tokio::sync::broadcast;

const HISTORY_SIZE: usize = 10000;

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
        self.history.lock().unwrap().clone().into()
    }

    pub fn push(&self, event: Event) {
        {
            let mut hist = self.history.lock().unwrap();
            if hist.len() == HISTORY_SIZE {
                hist.pop_front();
            }
            hist.push_back(event.clone());
        }
        let _ = self.sender.send(event); // ignore if no receivers
    }
}
