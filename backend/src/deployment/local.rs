use async_trait::async_trait;
use backend_common::{app_state::AppState, deployment::Deployment};

#[derive(Clone)]
pub struct LocalDeployment {
    app_state: AppState,
}

#[async_trait]
impl Deployment for LocalDeployment {
    fn new(app_state: AppState) -> Self {
        Self { app_state }
    }

    fn app_state(&self) -> &AppState {
        &self.app_state
    }

    // fn command_executor(&self) -> impl CommandExecutor {
    //     LocalCommandExecutor::new()
    // }

    fn shared_types() -> Vec<String> {
        vec![]
    }
}
