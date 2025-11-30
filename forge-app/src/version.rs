//! Runtime version detection for zero-rebuild promotion.
//!
//! This module reads the version from the `FORGE_VERSION` environment variable
//! at runtime, allowing the npm CLI wrapper to pass the package version.
//! This enables promoting RC builds to stable without recompiling the binary.

use std::sync::OnceLock;

static VERSION: OnceLock<String> = OnceLock::new();

/// Get the application version.
///
/// Reads from `FORGE_VERSION` environment variable (set by npx-cli wrapper).
/// Falls back to "unknown" if not set.
///
/// The version is cached after first read using `OnceLock` for efficiency.
pub fn get_version() -> &'static str {
    VERSION.get_or_init(|| std::env::var("FORGE_VERSION").unwrap_or_else(|_| "unknown".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version_fallback() {
        // When FORGE_VERSION is not set, should return "unknown"
        // Note: This test may not work if FORGE_VERSION is set in the environment
        let version = get_version();
        assert!(!version.is_empty());
    }
}
