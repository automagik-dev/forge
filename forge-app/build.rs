use std::{fs, path::Path};

fn main() {
    // macOS framework linking
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("macos") {
        println!("cargo:rustc-link-lib=framework=AppKit");
        println!("cargo:rustc-link-lib=framework=Foundation");
    }

    // Create frontend/dist directory if it doesn't exist
    let dist_path = Path::new("../frontend/dist");
    if !dist_path.exists() {
        println!("cargo:warning=Creating dummy frontend/dist directory for compilation");
        fs::create_dir_all(dist_path).unwrap();

        // Create a dummy index.html
        let dummy_html = r#"<!DOCTYPE html>
<html><head><title>Build frontend first</title></head>
<body><h1>Please build the frontend</h1></body></html>"#;

        fs::write(dist_path.join("index.html"), dummy_html).unwrap();
    }
}
