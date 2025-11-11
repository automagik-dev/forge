//! Android JNI bindings for Forge App
//!
//! This module provides JNI functions to start and stop the Forge server from Android.

#[cfg(feature = "android")]
use jni::JNIEnv;
#[cfg(feature = "android")]
use jni::objects::JClass;
#[cfg(feature = "android")]
use jni::sys::jint;
use std::sync::{Mutex, OnceLock};
use tokio::runtime::Runtime;
use tokio::sync::oneshot;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();
static SERVER_HANDLE: Mutex<Option<tokio::task::JoinHandle<()>>> = Mutex::new(None);

/// Initialize the Tokio runtime (called once)
fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        // Initialize android_logger for Android (once)
        #[cfg(target_os = "android")]
        android_logger::init_once(
            android_logger::Config::default()
                .with_max_level(log::LevelFilter::Info)
                .with_tag("ForgeApp"),
        );

        // Initialize tracing subscriber
        #[cfg(not(target_os = "android"))]
        tracing_subscriber::fmt::init();

        Runtime::new().expect("Failed to create Tokio runtime")
    })
}

/// Start the Forge server and return the port number
///
/// This function blocks until the server successfully binds to the port,
/// preventing race conditions where the WebView tries to connect before
/// the server is ready.
///
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

    tracing::info!("Starting Forge server on port {}", port);

    // Create oneshot channel to signal when server is ready
    let (ready_tx, ready_rx) = oneshot::channel();

    // Spawn server in background
    let handle = runtime.spawn(async move {
        if let Err(e) = crate::run_server_with_readiness(Some(ready_tx)).await {
            tracing::error!("Server error: {}", e);
        }
    });

    // Block until server is ready to accept connections
    let server_ready = runtime.block_on(async {
        match ready_rx.await {
            Ok(_) => {
                tracing::info!("Server ready on port {}", port);
                true
            }
            Err(_) => {
                tracing::error!(
                    "Server failed to signal readiness - server may have crashed during startup"
                );
                false
            }
        }
    });

    if server_ready {
        *SERVER_HANDLE.lock().unwrap() = Some(handle);
        port as jint
    } else {
        handle.abort();
        tracing::error!("Returning error code -1 to indicate server startup failure");
        -1
    }
}

/// Stop the Forge server
#[cfg(feature = "android")]
#[unsafe(no_mangle)]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_stopServer(_env: JNIEnv, _class: JClass) {
    if let Some(handle) = SERVER_HANDLE.lock().unwrap().take() {
        handle.abort();
    }
}
