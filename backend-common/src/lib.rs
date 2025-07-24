use rust_embed::RustEmbed

pub mod app_state;
pub mod command_executor;
pub mod command_runner;
pub mod deployment;
pub mod executor;
pub mod executors;
pub mod models;
pub mod services;
pub mod utils;

#[derive(RustEmbed)]
#[folder = "sounds"]
pub struct SoundAssets;
