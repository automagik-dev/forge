use services::services::container::{ContainerError, ContainerRef, ContainerService};

#[derive(Clone)]
pub struct LocalContainerService {}

impl ContainerService for LocalContainerService {
    fn new() -> Self {
        LocalContainerService {}
    }

    fn create(&self) -> Result<ContainerRef, ContainerError> {
        Ok("Ref".to_string())
    }
}
