/// Profile Cache with Hot-Reload Support
///
/// Watches .genie folders for changes and automatically reloads profiles.

use anyhow::Result;
use executors::profile::ExecutorConfigs;
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

use super::genie_profiles::GenieProfileLoader;

/// Cached profiles for a workspace with hot-reload support
#[derive(Clone)]
pub struct ProfileCache {
    /// Workspace root path
    workspace_root: PathBuf,

    /// Cached profiles
    profiles: Arc<RwLock<ExecutorConfigs>>,

    /// Last known profile count for change detection
    last_count: Arc<RwLock<usize>>,
}

impl ProfileCache {
    /// Create a new profile cache for a workspace
    pub fn new(workspace_root: PathBuf) -> Self {
        Self {
            workspace_root,
            profiles: Arc::new(RwLock::new(ExecutorConfigs {
                executors: HashMap::new(),
            })),
            last_count: Arc::new(RwLock::new(0)),
        }
    }

    /// Load profiles initially
    pub async fn initialize(&self) -> Result<()> {
        let profiles = self.load_profiles_now()?;
        let count = self.count_variants(&profiles);

        *self.profiles.write().await = profiles;
        *self.last_count.write().await = count;

        tracing::info!(
            "📦 Initialized profile cache for {:?} ({} variants)",
            self.workspace_root,
            count
        );

        Ok(())
    }

    /// Get current cached profiles
    pub async fn get(&self) -> ExecutorConfigs {
        self.profiles.read().await.clone()
    }

    /// Reload profiles from disk
    pub async fn reload(&self) -> Result<()> {
        let old_count = *self.last_count.read().await;
        let new_profiles = self.load_profiles_now()?;
        let new_count = self.count_variants(&new_profiles);

        *self.profiles.write().await = new_profiles;
        *self.last_count.write().await = new_count;

        if new_count != old_count {
            tracing::info!(
                "🔄 Reloaded profiles for {:?}: {} → {} variants",
                self.workspace_root,
                old_count,
                new_count
            );
        } else {
            tracing::debug!("Profiles reloaded (no count change)");
        }

        Ok(())
    }

    /// Start watching for file changes
    pub fn start_watching(self: Arc<Self>) -> Result<()> {
        let genie_path = self.workspace_root.join(".genie");

        if !genie_path.exists() {
            tracing::debug!("No .genie folder to watch in {:?}", self.workspace_root);
            return Ok(());
        }

        tracing::info!("👀 Watching .genie folder for changes: {:?}", genie_path);

        // Clone for the watcher thread
        let cache = self.clone();

        // Capture current tokio runtime handle to use in thread
        let runtime = tokio::runtime::Handle::current();

        std::thread::spawn(move || {
            if let Err(e) = cache.watch_loop(&genie_path, runtime) {
                tracing::error!("File watcher error: {}", e);
            }
        });

        Ok(())
    }

    /// Watch loop (runs in separate thread)
    fn watch_loop(&self, genie_path: &Path, runtime: tokio::runtime::Handle) -> Result<()> {
        let (tx, rx) = std::sync::mpsc::channel();

        let mut watcher = RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            },
            Config::default(),
        )?;

        watcher.watch(genie_path, RecursiveMode::Recursive)?;

        tracing::debug!("File watcher started for {:?}", genie_path);

        // Debounce: collect events for a short period before reloading
        let debounce_duration = Duration::from_millis(500);
        let mut last_reload = std::time::Instant::now();
        let mut pending_reload = false;

        loop {
            match rx.recv_timeout(Duration::from_millis(100)) {
                Ok(event) => {
                    // Check if it's a relevant event
                    if self.is_relevant_event(&event) {
                        pending_reload = true;

                        tracing::debug!(
                            "📝 Detected change in .genie: {:?}",
                            event.paths.first().map(|p| p.file_name())
                        );
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {
                    // Check if we should reload
                    if pending_reload && last_reload.elapsed() > debounce_duration {
                        tracing::info!("🔄 Detected .genie changes, reloading profiles...");

                        // Reload using the passed-in runtime handle
                        if let Err(e) = runtime.block_on(self.reload()) {
                            tracing::error!("Failed to reload profiles: {}", e);
                        }

                        pending_reload = false;
                        last_reload = std::time::Instant::now();
                    }
                }
                Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {
                    tracing::warn!("File watcher channel disconnected");
                    break;
                }
            }
        }

        Ok(())
    }

    /// Check if event is relevant for profile reload
    fn is_relevant_event(&self, event: &Event) -> bool {
        match event.kind {
            EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                // Only care about .md files
                event.paths.iter().any(|p| {
                    p.extension().and_then(|e| e.to_str()) == Some("md")
                })
            }
            _ => false,
        }
    }

    /// Load profiles from disk (synchronous)
    fn load_profiles_now(&self) -> Result<ExecutorConfigs> {
        // Start with upstream defaults + user overrides
        let base_profiles = ExecutorConfigs::load();

        // Load .genie profiles
        let genie_profiles = GenieProfileLoader::new(&self.workspace_root).load_profiles()?;

        if genie_profiles.executors.is_empty() {
            return Ok(base_profiles);
        }

        // Merge: base + genie (genie overrides base)
        let mut merged = base_profiles;
        for (executor, genie_config) in genie_profiles.executors {
            let base_config = merged.executors.entry(executor).or_insert_with(|| {
                executors::profile::ExecutorConfig {
                    configurations: HashMap::new(),
                }
            });

            // Merge configurations
            for (variant_name, variant_config) in genie_config.configurations {
                base_config
                    .configurations
                    .insert(variant_name, variant_config);
            }
        }

        Ok(merged)
    }

    /// Count total profile variants
    fn count_variants(&self, profiles: &ExecutorConfigs) -> usize {
        profiles
            .executors
            .values()
            .map(|e| e.configurations.len())
            .sum()
    }
}

/// Global profile cache manager
pub struct ProfileCacheManager {
    /// Caches per workspace
    caches: Arc<RwLock<HashMap<PathBuf, Arc<ProfileCache>>>>,
}

impl ProfileCacheManager {
    pub fn new() -> Self {
        Self {
            caches: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get or create cache for a workspace
    pub async fn get_or_create(&self, workspace_root: PathBuf) -> Result<Arc<ProfileCache>> {
        // Check if cache exists
        {
            let caches = self.caches.read().await;
            if let Some(cache) = caches.get(&workspace_root) {
                return Ok(cache.clone());
            }
        }

        // Create new cache
        let cache = Arc::new(ProfileCache::new(workspace_root.clone()));
        cache.initialize().await?;

        // Start file watcher
        cache.clone().start_watching()?;

        // Store cache
        self.caches.write().await.insert(workspace_root, cache.clone());

        Ok(cache)
    }

    /// Get cached profiles for a workspace
    pub async fn get_profiles(&self, workspace_root: &Path) -> Result<ExecutorConfigs> {
        let cache = self.get_or_create(workspace_root.to_path_buf()).await?;
        Ok(cache.get().await)
    }
}
