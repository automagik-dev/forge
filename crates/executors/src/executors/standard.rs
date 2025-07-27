use strum_macros::Display;

use crate::executors::amp::AmpExecutor;

#[derive(Display)]
pub enum StandardCodingAgentExecutor {
    AmpExecutor(AmpExecutor),
}
