pub mod client;
pub mod service;
pub mod types;

pub use service::OmniService;
pub use types::{OmniConfig, OmniInstance, RecipientType, SendTextRequest, SendTextResponse};

/// Backwards-compatible alias while forge-app wiring is updated.
pub type OmniSettings = OmniConfig;
