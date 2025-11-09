//! Android JNI bindings for Forge App
//!
//! This module provides JNI functions to start and stop the Forge server from Android.

#[cfg(feature = "android")]
use jni::JNIEnv;
#[cfg(feature = "android")]
use jni::objects::JClass;
#[cfg(feature = "android")]
use jni::sys::jint;
use std::sync::Once;
use tokio::runtime::Runtime;
use tokio::sync::oneshot;

static INIT: Once = Once::new();
static mut RUNTIME: Option<Runtime> = None;
static mut SERVER_HANDLE: Option<tokio::task::JoinHandle<()>> = None;

/// Initialize the Tokio runtime (called once)
fn get_runtime() -> &'static Runtime {
    unsafe {
        INIT.call_once(|| {
            // Initialize tracing for Android (once)
            tracing_subscriber::fmt::init();
            RUNTIME = Some(Runtime::new().expect("Failed to create Tokio runtime"));
        });
        RUNTIME.as_ref().unwrap()
    }
}

/// Start the Forge server and return the port number
///
/// This function blocks until the server successfully binds to the port,
/// preventing race conditions where the WebView tries to connect before
/// the server is ready.
#[cfg(feature = "android")]
#[no_mangle]
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

    // Create oneshot channel to signal when server is ready
    let (ready_tx, ready_rx) = oneshot::channel();

    // Spawn server in background
    let handle = runtime.spawn(async move {
        if let Err(e) = crate::run_server_with_readiness(Some(ready_tx)).await {
            eprintln!("Server error: {}", e);
        }
    });

    // Block until server is ready to accept connections
    runtime.block_on(async {
        match ready_rx.await {
            Ok(_) => tracing::info!("Server ready on port {}", port),
            Err(_) => eprintln!("Server failed to signal readiness"),
        }
    });

    unsafe {
        SERVER_HANDLE = Some(handle);
    }

    port as jint
}

/// Stop the Forge server
#[cfg(feature = "android")]
#[no_mangle]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_stopServer(
    _env: JNIEnv,
    _class: JClass,
) {
    unsafe {
        if let Some(handle) = SERVER_HANDLE.take() {
            handle.abort();
        }
    }
}
