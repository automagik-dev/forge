use std::path::PathBuf;

use crate::executor_actions::{
    actions::{
        ExecutorActions, standard::StandardCodingAgentRequest,
        standard_follow_up::StandardFollowUpCodingAgentRequest,
    },
    executors::{amp::AmpExecutor, standard::StandardCodingAgentExecutor},
};

fn testing() {
    let _action = ExecutorActions::StandardCodingAgentRequest(StandardCodingAgentRequest {
        prompt: "Some prompt here".to_string(),
        working_dir: PathBuf::new(),
        executor: StandardCodingAgentExecutor::AmpExecutor(AmpExecutor),
    });

    let _follow_up_action =
        ExecutorActions::StandardFollowUpCodingAgentRequest(StandardFollowUpCodingAgentRequest {
            prompt: "Some follow up prompt here".to_string(),
            working_dir: PathBuf::new(),
            session_id: "123".to_string(),
            executor: StandardCodingAgentExecutor::AmpExecutor(AmpExecutor),
        });
}
