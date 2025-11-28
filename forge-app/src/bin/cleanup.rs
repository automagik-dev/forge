//! Forge Cleanup - Cleanup stale worktrees
//!
//! Scans the worktree temp directory, compares with active task_attempts
//! in the database, and identifies/removes orphaned worktrees.

use std::collections::HashSet;
use std::path::PathBuf;

use anyhow::{Context, Result};
use sqlx::{Row, SqlitePool};

/// Get the worktree base directory
fn get_worktree_base_dir() -> PathBuf {
    utils::path::get_automagik_forge_temp_dir().join("worktrees")
}

/// Get database URL (same logic as db crate)
fn get_database_url() -> String {
    if let Ok(db_url) = std::env::var("DATABASE_URL") {
        if db_url.starts_with("sqlite://") {
            let path_part = db_url.strip_prefix("sqlite://").unwrap();
            if PathBuf::from(path_part).is_absolute() {
                db_url
            } else {
                let abs_path = std::env::current_dir()
                    .unwrap_or_else(|_| PathBuf::from("."))
                    .join(path_part);
                format!("sqlite://{}", abs_path.to_string_lossy())
            }
        } else {
            db_url
        }
    } else {
        format!(
            "sqlite://{}",
            utils::assets::asset_dir().join("db.sqlite").to_string_lossy()
        )
    }
}

/// Worktree info with size
#[derive(Debug)]
struct WorktreeInfo {
    path: PathBuf,
    name: String,
    size_bytes: u64,
}

impl WorktreeInfo {
    fn size_human(&self) -> String {
        const KB: u64 = 1024;
        const MB: u64 = 1024 * KB;
        const GB: u64 = 1024 * MB;

        if self.size_bytes >= GB {
            format!("{:.2} GB", self.size_bytes as f64 / GB as f64)
        } else if self.size_bytes >= MB {
            format!("{:.2} MB", self.size_bytes as f64 / MB as f64)
        } else if self.size_bytes >= KB {
            format!("{:.2} KB", self.size_bytes as f64 / KB as f64)
        } else {
            format!("{} bytes", self.size_bytes)
        }
    }
}

/// Calculate directory size recursively
fn dir_size(path: &PathBuf) -> u64 {
    let mut size = 0u64;
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                size += dir_size(&path);
            } else if let Ok(metadata) = path.metadata() {
                size += metadata.len();
            }
        }
    }
    size
}

/// Scan worktree directory for all worktrees
fn scan_worktree_directory(base_dir: &PathBuf) -> Result<Vec<WorktreeInfo>> {
    let mut worktrees = Vec::new();

    if !base_dir.exists() {
        return Ok(worktrees);
    }

    let entries = std::fs::read_dir(base_dir)
        .with_context(|| format!("Failed to read worktree directory: {}", base_dir.display()))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let name = path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            let size_bytes = dir_size(&path);
            worktrees.push(WorktreeInfo {
                path,
                name,
                size_bytes,
            });
        }
    }

    Ok(worktrees)
}

/// Get active worktree paths from database (where worktree_deleted = false)
async fn get_active_worktree_paths(pool: &SqlitePool) -> Result<HashSet<String>> {
    let records = sqlx::query(
        "SELECT container_ref FROM task_attempts WHERE worktree_deleted = FALSE AND container_ref IS NOT NULL"
    )
    .fetch_all(pool)
    .await
    .context("Failed to query task_attempts")?;

    Ok(records
        .into_iter()
        .filter_map(|r| r.get::<Option<String>, _>("container_ref"))
        .collect())
}

/// Find orphan worktrees (on disk but not in database)
fn find_orphans<'a>(
    disk_worktrees: &'a [WorktreeInfo],
    db_paths: &HashSet<String>,
) -> Vec<&'a WorktreeInfo> {
    disk_worktrees
        .iter()
        .filter(|wt| {
            let path_str = wt.path.to_string_lossy().to_string();
            !db_paths.contains(&path_str)
        })
        .collect()
}

/// Delete a worktree directory
fn delete_worktree(path: &PathBuf) -> Result<()> {
    std::fs::remove_dir_all(path)
        .with_context(|| format!("Failed to delete worktree: {}", path.display()))?;
    Ok(())
}

fn print_usage() {
    eprintln!("Usage: forge cleanup [--force]");
    eprintln!();
    eprintln!("Cleanup stale worktrees that are no longer referenced by active tasks.");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  --force, -f    Actually delete orphan worktrees (default: dry run)");
    eprintln!("  --help, -h     Show this help message");
}

#[tokio::main]
async fn main() -> Result<()> {
    // Parse arguments
    let args: Vec<String> = std::env::args().collect();
    let force = args.iter().any(|a| a == "--force" || a == "-f");
    let help = args.iter().any(|a| a == "--help" || a == "-h");

    if help {
        print_usage();
        return Ok(());
    }

    // Get paths
    let worktree_base = get_worktree_base_dir();
    let db_url = get_database_url();

    println!("Forge Cleanup - Stale Worktree Removal");
    println!("======================================");
    println!();
    println!("Worktree directory: {}", worktree_base.display());
    println!("Database: {}", db_url.replace("sqlite://", ""));
    println!();

    // Check if worktree directory exists
    if !worktree_base.exists() {
        println!("Worktree directory does not exist. Nothing to clean up.");
        return Ok(());
    }

    // Scan disk for worktrees
    println!("Scanning worktree directory...");
    let disk_worktrees = scan_worktree_directory(&worktree_base)?;
    println!("Found {} worktrees on disk", disk_worktrees.len());
    println!();

    if disk_worktrees.is_empty() {
        println!("No worktrees found. Nothing to clean up.");
        return Ok(());
    }

    // Connect to database
    println!("Connecting to database...");
    let db_path = db_url.replace("sqlite://", "");
    if !PathBuf::from(&db_path).exists() {
        println!("Database file does not exist: {}", db_path);
        println!("All worktrees on disk are orphans (no database to reference).");
        println!();

        // All worktrees are orphans
        let total_size: u64 = disk_worktrees.iter().map(|w| w.size_bytes).sum();
        println!("Orphan worktrees: {} (total: {})",
            disk_worktrees.len(),
            WorktreeInfo { path: PathBuf::new(), name: String::new(), size_bytes: total_size }.size_human()
        );

        if !force {
            println!();
            println!("Run with --force to delete these worktrees.");
            return Ok(());
        }

        // Delete all
        let mut recovered = 0u64;
        for wt in &disk_worktrees {
            print!("  Deleting {}... ", wt.name);
            match delete_worktree(&wt.path) {
                Ok(()) => {
                    println!("done ({})", wt.size_human());
                    recovered += wt.size_bytes;
                }
                Err(e) => println!("FAILED: {}", e),
            }
        }

        println!();
        println!("Space recovered: {}",
            WorktreeInfo { path: PathBuf::new(), name: String::new(), size_bytes: recovered }.size_human()
        );
        return Ok(());
    }

    let pool = SqlitePool::connect(&db_url)
        .await
        .context("Failed to connect to database")?;

    // Get active worktree paths from database
    println!("Querying active task attempts...");
    let db_paths = get_active_worktree_paths(&pool).await?;
    println!("Found {} active worktree references in database", db_paths.len());
    println!();

    // Find orphans
    let orphans = find_orphans(&disk_worktrees, &db_paths);

    if orphans.is_empty() {
        println!("No orphan worktrees found. All worktrees are referenced by active tasks.");
        return Ok(());
    }

    // Calculate total orphan size
    let total_orphan_size: u64 = orphans.iter().map(|w| w.size_bytes).sum();

    println!("Found {} orphan worktrees (not referenced by any active task):", orphans.len());
    println!();
    for wt in &orphans {
        println!("  {} - {}", wt.name, wt.size_human());
    }
    println!();
    println!("Total orphan size: {}",
        WorktreeInfo { path: PathBuf::new(), name: String::new(), size_bytes: total_orphan_size }.size_human()
    );

    if !force {
        println!();
        println!("This is a dry run. Run with --force to delete these worktrees.");
        return Ok(());
    }

    // Delete orphans
    println!();
    println!("Deleting orphan worktrees...");
    let mut recovered = 0u64;
    let mut deleted_count = 0;
    let mut failed_count = 0;

    for wt in &orphans {
        print!("  Deleting {}... ", wt.name);
        match delete_worktree(&wt.path) {
            Ok(()) => {
                println!("done ({})", wt.size_human());
                recovered += wt.size_bytes;
                deleted_count += 1;
            }
            Err(e) => {
                println!("FAILED: {}", e);
                failed_count += 1;
            }
        }
    }

    println!();
    println!("Summary:");
    println!("  Deleted: {}", deleted_count);
    if failed_count > 0 {
        println!("  Failed: {}", failed_count);
    }
    println!("  Space recovered: {}",
        WorktreeInfo { path: PathBuf::new(), name: String::new(), size_bytes: recovered }.size_human()
    );

    Ok(())
}
