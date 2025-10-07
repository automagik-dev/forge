use directories::{BaseDirs, ProjectDirs};
use rust_embed::RustEmbed;

use crate::path::expand_tilde;

const PROJECT_ROOT: &str = env!("CARGO_MANIFEST_DIR");

fn preferred_data_dir() -> std::path::PathBuf {
    if cfg!(target_os = "linux") {
        // Linux: Use ~/.automagik-forge directly
        BaseDirs::new()
            .expect("OS didn't give us a home directory")
            .home_dir()
            .join(".automagik-forge")
    } else if cfg!(target_os = "windows") {
        // Windows: Use %APPDATA%\\automagik-forge (without organization folder)
        BaseDirs::new()
            .expect("OS didn't give us a data directory")
            .data_dir()
            .join("automagik-forge")
    } else {
        // macOS: Use OS-specific directory
        ProjectDirs::from("ai", "namastex", "automagik-forge")
            .expect("OS didn't give us a home directory")
            .data_dir()
            .to_path_buf()
    }
}

pub fn asset_dir() -> std::path::PathBuf {
    if let Ok(custom) = std::env::var("FORGE_ASSET_DIR") {
        let expanded = expand_tilde(custom.trim());
        if !expanded.exists() {
            if let Err(err) = std::fs::create_dir_all(&expanded) {
                tracing::warn!(?err, path=?expanded, "Failed to create custom FORGE_ASSET_DIR, falling back to default");
            } else {
                return expanded;
            }
        } else {
            return expanded;
        }
    }

    let use_dev_assets = std::env::var("FORGE_USE_DEV_ASSETS")
        .map(|v| matches!(v.as_str(), "1" | "true" | "TRUE"))
        .unwrap_or(false);

    let path = if cfg!(debug_assertions) && use_dev_assets {
        std::path::PathBuf::from(PROJECT_ROOT).join("../../dev_assets")
    } else {
        preferred_data_dir()
    };

    // Ensure the directory exists
    if !path.exists() {
        std::fs::create_dir_all(&path).expect("Failed to create asset directory");
    }

    path
    // ✔ Linux → ~/.automagik-forge
    // ✔ Windows → %APPDATA%\automagik-forge
    // ✔ macOS → ~/Library/Application Support/automagik-forge
}

pub fn config_path() -> std::path::PathBuf {
    asset_dir().join("config.json")
}

pub fn profiles_path() -> std::path::PathBuf {
    asset_dir().join("profiles.json")
}

#[derive(RustEmbed)]
#[folder = "../../assets/sounds"]
pub struct SoundAssets;

#[derive(RustEmbed)]
#[folder = "../../assets/scripts"]
pub struct ScriptAssets;
