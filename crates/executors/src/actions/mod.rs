use std::path::PathBuf;

use async_trait::async_trait;
use axum::response::sse::Event;
use command_group::AsyncGroupChild;
use enum_dispatch::enum_dispatch;
use futures::{
    TryStreamExt,
    stream::{BoxStream, select},
};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio_stream::wrappers::LinesStream;

use crate::{
    actions::{
        script::ScriptRequest, standard::StandardCodingAgentRequest,
        standard_follow_up::StandardFollowUpCodingAgentRequest,
    },
    executors::ExecutorError,
};
pub mod script;
pub mod standard;
pub mod standard_follow_up;

pub type EventStream = BoxStream<'static, Result<Event, std::io::Error>>;

#[enum_dispatch]
pub enum ExecutorActions {
    StandardCodingAgentRequest,
    StandardFollowUpCodingAgentRequest,
    ScriptRequest,
}

#[async_trait]
#[enum_dispatch(ExecutorActions)]
pub trait ExecutorAction {
    async fn spawn(&self, current_dir: &PathBuf) -> Result<AsyncGroupChild, ExecutorError>;
    /// Defaults to streaming by lines
    /// Can be overriden if we ever encounter an executor that doesn't break by lines
    async fn spawn_and_stream(
        &self,
        current_dir: &PathBuf,
    ) -> Result<(AsyncGroupChild, EventStream), ExecutorError> {
        let mut child = self.spawn(current_dir).await?;

        let out = child.inner().stdout.take().expect("no stdout");
        let err = child.inner().stderr.take().expect("no stderr");

        let out = LinesStream::new(BufReader::new(out).lines())
            .map_ok(|s| Event::default().event("stdout").data(s));
        let err = LinesStream::new(BufReader::new(err).lines())
            .map_ok(|s| Event::default().event("stderr").data(s));

        let merged = select(out, err);
        Ok((child, Box::pin(merged)))
    }
}
