//! Android JNI bindings for Forge App
//!
//! This module provides JNI functions to start and stop the Forge server from Android.
//!
//! ## Concurrency Safety
//!
//! This module uses proper synchronization to handle concurrent JNI calls:
//! - `LazyLock` for safe static initialization of the mutex
//! - Mutex lock error handling to avoid panics on poisoned mutexes
//! - Double-start prevention to avoid spawning multiple servers

#[cfg(feature = "android")]
use jni::JNIEnv;
#[cfg(feature = "android")]
use jni::objects::JClass;
#[cfg(feature = "android")]
use jni::sys::jint;
use std::sync::{LazyLock, Mutex, OnceLock};
use tokio::runtime::Runtime;
use tokio::sync::oneshot;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();
static SERVER_HANDLE: LazyLock<Mutex<Option<tokio::task::JoinHandle<()>>>> =
    LazyLock::new(|| Mutex::new(None));

/// Initialize the Tokio runtime (called once)
fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        // Initialize tracing for Android (once)
        tracing_subscriber::fmt::init();
        Runtime::new().expect("Failed to create Tokio runtime")
    })
}

/// Error code returned when the server is already running
#[cfg(feature = "android")]
const ERR_ALREADY_RUNNING: jint = -1;
/// Error code returned when mutex lock fails (poisoned)
#[cfg(feature = "android")]
#[allow(dead_code)] // Reserved for future use
const ERR_LOCK_FAILED: jint = -2;
/// Error code returned when server fails to start
#[cfg(feature = "android")]
const ERR_SERVER_START_FAILED: jint = -3;

/// Start the Forge server and return the port number
///
/// This function blocks until the server successfully binds to the port,
/// preventing race conditions where the WebView tries to connect before
/// the server is ready.
///
/// # Returns
/// - Positive value: The port number the server is listening on
/// - `-1` (`ERR_ALREADY_RUNNING`): Server is already running
/// - `-2` (`ERR_LOCK_FAILED`): Failed to acquire lock (mutex poisoned)
/// - `-3` (`ERR_SERVER_START_FAILED`): Server failed to start
#[cfg(feature = "android")]
#[unsafe(no_mangle)]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_startServer(
    _env: JNIEnv,
    _class: JClass,
) -> jint {
    let runtime = get_runtime();

    // Default port
    let port: u16 = std::env::var("BACKEND_PORT")
        .or_else(|_| std::env::var("PORT"))
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8887);

    // Acquire lock with proper error handling for poisoned mutex
    let mut guard = match SERVER_HANDLE.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            tracing::warn!("SERVER_HANDLE mutex was poisoned, recovering");
            // Recover from poisoned mutex - this is safe because we just store a JoinHandle
            poisoned.into_inner()
        }
    };

    // Check if server is already running (double-start prevention)
    if let Some(ref handle) = *guard {
        if !handle.is_finished() {
            tracing::warn!("Server already running, ignoring duplicate start request");
            return ERR_ALREADY_RUNNING;
        }
        // Previous server finished, clean up the old handle
        tracing::info!("Previous server finished, starting new instance");
    }

    // Create oneshot channel to signal when server is ready
    let (ready_tx, ready_rx) = oneshot::channel();

    // Spawn server in background
    let handle = runtime.spawn(async move {
        if let Err(e) = crate::run_server_with_readiness(Some(ready_tx)).await {
            tracing::error!("Server error: {}", e);
        }
    });

    // Store handle before blocking to allow stopServer to work during startup
    *guard = Some(handle);

    // Release the lock before blocking to avoid holding it during potentially long wait
    drop(guard);

    // Block until server is ready to accept connections
    let ready = runtime.block_on(async {
        match ready_rx.await {
            Ok(_) => {
                tracing::info!("Server ready on port {}", port);
                true
            }
            Err(_) => {
                tracing::error!("Server failed to signal readiness");
                false
            }
        }
    });

    if ready {
        port as jint
    } else {
        ERR_SERVER_START_FAILED
    }
}

/// Stop the Forge server
///
/// This function safely stops the server if it is running.
/// It handles mutex poisoning gracefully and logs all operations.
#[cfg(feature = "android")]
#[unsafe(no_mangle)]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_stopServer(
    _env: JNIEnv,
    _class: JClass,
) {
    // Acquire lock with proper error handling for poisoned mutex
    let mut guard = match SERVER_HANDLE.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            tracing::warn!("SERVER_HANDLE mutex was poisoned during stop, recovering");
            poisoned.into_inner()
        }
    };

    if let Some(handle) = guard.take() {
        if handle.is_finished() {
            tracing::info!("Server was already stopped");
        } else {
            tracing::info!("Stopping server...");
            handle.abort();
            tracing::info!("Server stop requested");
        }
    } else {
        tracing::debug!("stopServer called but no server was running");
    }
}
