use directories::ProjectDirs;

const PROJECT_ROOT: &str = env!("CARGO_MANIFEST_DIR");

pub fn asset_dir() -> std::path::PathBuf {
    if cfg!(debug_assertions) {
        std::path::PathBuf::from(PROJECT_ROOT).join("../../dev_assets")
    } else {
        ProjectDirs::from("ai", "bloop", env!("CARGO_PKG_NAME"))
            .expect("OS didn't give us a home directory")
            .data_dir()
            .to_path_buf()
    }

    // ✔ macOS → ~/Library/Application Support/MyApp
    // ✔ Linux → ~/.local/share/myapp   (respects XDG_DATA_HOME)
    // ✔ Windows → %APPDATA%\Example\MyApp
}

pub fn config_path() -> std::path::PathBuf {
    asset_dir().join("config.json")
}
