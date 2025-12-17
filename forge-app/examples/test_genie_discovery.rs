/// Test .genie folder discovery in Forge
/// Run with: cargo run --bin forge-app --example test_genie_discovery
use std::path::PathBuf;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    // Test with automagik-genie workspace
    let workspace_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../automagik-genie");

    if !workspace_root.exists() {
        eprintln!("❌ automagik-genie workspace not found at {workspace_root:?}");
        eprintln!("   Please clone automagik-genie repository as a sibling directory");
        std::process::exit(1);
    }

    println!("🔍 Testing .genie profile discovery (Forge App)");
    println!("📁 Workspace: {workspace_root:?}");
    println!();

    // Initialize forge services
    match forge_app_lib::services::ForgeServices::new().await {
        Ok(services) => {
            println!("✅ Forge services initialized");
            println!();

            // Load profiles for workspace (will start file watcher)
            match services.load_profiles_for_workspace(&workspace_root).await {
                Ok(configs) => {
                    println!("✅ Successfully loaded .genie profiles!");
                    println!();

                    // Count profiles
                    let total_variants: usize = configs
                        .executors
                        .values()
                        .map(|e| e.configurations.len())
                        .sum();

                    let executor_count = configs.executors.len();
                    println!("📊 Profile Summary:");
                    println!("   Executors: {executor_count}");
                    println!("   Total variants: {total_variants}");
                    println!();

                    // List all profiles
                    println!("📋 Discovered Profiles:");
                    for (executor, executor_config) in &configs.executors {
                        let variant_count = executor_config.configurations.len();
                        println!("   • {executor}: {variant_count} variants");
                        for variant_name in executor_config.configurations.keys() {
                            println!("      - {variant_name}");
                        }
                    }
                    println!();

                    println!("✨ Initial load completed successfully!");
                    println!();
                    println!("🔥 Hot-reload is active!");
                    println!("   File watcher is monitoring .genie/ for changes.");
                    let genie_path = workspace_root.join(".genie");
                    println!("   Try editing a .md file in {genie_path:?}");
                    println!("   Changes will be detected and profiles will reload automatically.");
                    println!();
                    println!("Press Ctrl+C to exit...");

                    // Keep running to test hot-reload
                    loop {
                        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                    }
                }
                Err(e) => {
                    eprintln!("❌ Failed to load profiles: {e}");
                    std::process::exit(1);
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to initialize forge services: {e}");
            std::process::exit(1);
        }
    }
}
