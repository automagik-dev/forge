use std::sync::OnceLock;

/// Cache for WSL2 detection result
static WSL2_CACHE: OnceLock<bool> = OnceLock::new();

/// Check if running in WSL2 (cached)
pub fn is_wsl2() -> bool {
    *WSL2_CACHE.get_or_init(|| {
        // Check for WSL environment variables
        if std::env::var("WSL_DISTRO_NAME").is_ok() || std::env::var("WSLENV").is_ok() {
            tracing::debug!("WSL2 detected via environment variables");
            return true;
        }

        // Check /proc/version for WSL2 signature
        if let Ok(version) = std::fs::read_to_string("/proc/version") {
            if version.contains("WSL2") || version.contains("microsoft") {
                tracing::debug!("WSL2 detected via /proc/version");
                return true;
            }
        }

        tracing::debug!("WSL2 not detected");
        false
    })
}
