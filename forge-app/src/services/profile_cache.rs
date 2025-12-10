use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

/// Profile Cache with Hot-Reload Support
///
/// Watches .genie folders for changes and automatically reloads profiles.
use anyhow::Result;
use executors::profile::ExecutorConfigs;
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tokio::sync::RwLock;
use uuid::Uuid;

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

        tracing::debug!("start_watching called for {:?}", self.workspace_root);

        if !genie_path.exists() {
            tracing::debug!("No .genie folder to watch in {:?}", self.workspace_root);
            return Ok(());
        }

        tracing::info!("👀 Watching .genie folder for changes: {:?}", genie_path);

        // Clone for the watcher thread
        let cache = self.clone();

        // Capture current tokio runtime handle to use in thread
        tracing::debug!("Capturing tokio runtime handle...");
        let runtime = tokio::runtime::Handle::current();

        tracing::debug!("Spawning file watcher thread...");
        std::thread::spawn(move || {
            tracing::debug!("File watcher thread started");
            if let Err(e) = cache.watch_loop(&genie_path, runtime) {
                tracing::error!("File watcher error: {}", e);
            }
        });

        tracing::debug!("File watcher thread spawned");
        Ok(())
    }

    /// Watch loop (runs in separate thread)
    fn watch_loop(&self, genie_path: &Path, runtime: tokio::runtime::Handle) -> Result<()> {
        tracing::debug!("watch_loop entered for {:?}", genie_path);

        let (tx, rx) = std::sync::mpsc::channel();

        tracing::debug!("Creating RecommendedWatcher...");
        let mut watcher = RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if let Ok(event) = res {
                    let _ = tx.send(event);
                }
            },
            Config::default(),
        )?;
        tracing::debug!("RecommendedWatcher created");

        tracing::debug!("Starting to watch {:?}", genie_path);
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
                event
                    .paths
                    .iter()
                    .any(|p| p.extension().and_then(|e| e.to_str()) == Some("md"))
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

/// Global profile cache manager (multi-tenant, project-aware)
pub struct ProfileCacheManager {
    /// Caches per workspace path
    caches_by_path: Arc<RwLock<HashMap<PathBuf, Arc<ProfileCache>>>>,

    /// Project ID → workspace path mapping
    project_paths: Arc<RwLock<HashMap<Uuid, PathBuf>>>,
}

impl Default for ProfileCacheManager {
    fn default() -> Self {
        Self::new()
    }
}

impl ProfileCacheManager {
    pub fn new() -> Self {
        Self {
            caches_by_path: Arc::new(RwLock::new(HashMap::new())),
            project_paths: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get or create cache for a workspace
    pub async fn get_or_create(&self, workspace_root: PathBuf) -> Result<Arc<ProfileCache>> {
        tracing::debug!(
            "ProfileCacheManager::get_or_create for {:?}",
            workspace_root
        );

        // Check if cache exists
        {
            let caches = self.caches_by_path.read().await;
            if let Some(cache) = caches.get(&workspace_root) {
                tracing::debug!("Using existing cache for {:?}", workspace_root);
                return Ok(cache.clone());
            }
        }

        // Create new cache
        tracing::debug!("Creating new ProfileCache for {:?}", workspace_root);
        let cache = Arc::new(ProfileCache::new(workspace_root.clone()));

        tracing::debug!("Initializing ProfileCache...");
        cache.initialize().await?;

        // Start file watcher
        tracing::debug!("Starting file watcher...");
        cache.clone().start_watching()?;
        tracing::debug!("File watcher started successfully");

        // Store cache
        self.caches_by_path
            .write()
            .await
            .insert(workspace_root, cache.clone());

        Ok(cache)
    }

    /// Register a project ID → workspace path mapping
    pub async fn register_project(&self, project_id: Uuid, workspace_root: PathBuf) {
        self.project_paths
            .write()
            .await
            .insert(project_id, workspace_root);
    }

    /// Get cached profiles for a workspace (by path)
    pub async fn get_profiles(&self, workspace_root: &Path) -> Result<ExecutorConfigs> {
        let cache = self.get_or_create(workspace_root.to_path_buf()).await?;
        Ok(cache.get().await)
    }

    /// Get cached profiles for a project (by project_id)
    pub async fn get_profiles_for_project(&self, project_id: Uuid) -> Result<ExecutorConfigs> {
        let workspace_root = {
            let paths = self.project_paths.read().await;
            paths.get(&project_id).cloned().ok_or_else(|| {
                anyhow::anyhow!("Project {project_id} not registered in profile cache")
            })?
        };

        self.get_profiles(&workspace_root).await
    }
}
