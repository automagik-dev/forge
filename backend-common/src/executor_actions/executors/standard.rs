use crate::executor_actions::executors::amp::AmpExecutor;

pub enum StandardCodingAgentExecutor {
    AmpExecutor(AmpExecutor),
}
