/// Quick test to verify project-prefixed profile names
use std::path::PathBuf;

#[tokio::main]
async fn main() {
    // Test with automagik-genie workspace
    let workspace_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../automagik-genie");

    if !workspace_root.exists() {
        eprintln!("❌ automagik-genie workspace not found");
        std::process::exit(1);
    }

    println!("🔍 Testing profile name generation");
    println!("📁 Workspace: {:?}", workspace_root);
    println!();

    // Load profiles
    let loader = forge_app_lib::services::genie_profiles::GenieProfileLoader::new(&workspace_root);

    match loader.load_profiles() {
        Ok(configs) => {
            println!("✅ Successfully loaded profiles!");
            println!();

            // Show first 10 profile names from each executor
            for (executor, executor_config) in &configs.executors {
                println!("📋 {} profiles:", executor);
                let mut count = 0;
                for variant_name in executor_config.configurations.keys() {
                    if count < 10 {
                        println!("   - {}", variant_name);
                        count += 1;
                    }
                }
                if executor_config.configurations.len() > 10 {
                    println!(
                        "   ... and {} more",
                        executor_config.configurations.len() - 10
                    );
                }
                println!();
            }
        }
        Err(e) => {
            eprintln!("❌ Failed to load profiles: {}", e);
            std::process::exit(1);
        }
    }
}
