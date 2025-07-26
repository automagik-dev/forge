use anyhow::Error as AnyhowError;
use thiserror::Error;

pub type ContainerRef = String;

#[derive(Debug, Error)]
pub enum ContainerError {
    #[error(transparent)]
    Other(#[from] AnyhowError), // Catches any unclassified errors
}

pub trait ContainerService {
    fn new() -> Self;

    fn create(&self) -> Result<ContainerRef, ContainerError>;
}
