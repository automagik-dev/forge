use services::services::container::ContainerService;

#[derive(Clone)]
pub struct LocalContainerService {}

impl ContainerService for LocalContainerService {
    fn new() -> Self {
        LocalContainerService {}
    }
}
