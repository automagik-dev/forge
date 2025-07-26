pub mod local;

// #[cfg(feature = "cloud")]
// type DeploymentImpl = vibe_kanban_cloud::deployment::CloudDeployment;
#[cfg(not(feature = "cloud"))]
pub use local::LocalDeployment as DeploymentImpl;
