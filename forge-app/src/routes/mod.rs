//! Route modules for Forge
//!
//! This module contains domain-specific route handlers organized by functionality.
//! The main router.rs imports and composes these modules into the final API router.

pub mod agents;
pub mod attempts;
pub mod config;
pub mod frontend;
pub mod omni;
pub mod projects;
pub mod state;
pub mod tasks;

// Re-export commonly used types
pub use state::ForgeAppState;
