//! Android JNI bindings for Forge App
//!
//! This module provides JNI functions to start and stop the Forge server from Android.

#[cfg(target_os = "android")]
use jni::JNIEnv;
#[cfg(target_os = "android")]
use jni::objects::{JClass, JString};
#[cfg(target_os = "android")]
use jni::sys::jint;
use std::sync::{Mutex, OnceLock};
use tokio::runtime::Runtime;
use tokio::sync::oneshot;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();
static SERVER_HANDLE: Mutex<Option<tokio::task::JoinHandle<()>>> = Mutex::new(None);
static LAST_ERROR: Mutex<Option<String>> = Mutex::new(None);

/// Initialize the Tokio runtime (called once)
fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        // Initialize android_logger for Android (once)
        #[cfg(target_os = "android")]
        android_logger::init_once(
            android_logger::Config::default()
                .with_max_level(log::LevelFilter::Debug)
                .with_tag("ForgeApp"),
        );

        #[cfg(target_os = "android")]
        unsafe {
            std::env::set_var("RUST_LOG", "debug");
        }

        // Initialize tracing subscriber
        #[cfg(not(target_os = "android"))]
        tracing_subscriber::fmt::init();

        Runtime::new().expect("Failed to create Tokio runtime")
    })
}

fn set_last_error(error: String) {
    *LAST_ERROR.lock().unwrap() = Some(error.clone());

    if let Ok(data_dir) = std::env::var("FORGE_DATA_DIR") {
        let error_file = format!("{}/forge-last-error.txt", data_dir);
        if let Err(e) = std::fs::write(&error_file, &error) {
            tracing::error!("Failed to write error to file {}: {}", error_file, e);
        }
    }
}

#[cfg(target_os = "android")]
#[no_mangle]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_getLastError<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
) -> JString<'local> {
    let error = LAST_ERROR
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(|| "Unknown error".to_string());

    env.new_string(error)
        .unwrap_or_else(|_| env.new_string("Failed to create error string").unwrap())
}

#[cfg(target_os = "android")]
#[no_mangle]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_setDataDir(
    mut env: JNIEnv,
    _class: JClass,
    data_dir: JString,
) {
    let data_dir_str: String = env
        .get_string(&data_dir)
        .expect("Failed to get data_dir string")
        .into();

    unsafe {
        std::env::set_var("FORGE_DATA_DIR", &data_dir_str);
        std::env::set_var(
            "DATABASE_URL",
            format!("sqlite:///{}/forge.db", data_dir_str),
        );
        std::env::set_var(
            "SQLX_DATABASE_URL",
            format!("sqlite:///{}/forge.db", data_dir_str),
        );
    }

    tracing::info!("Android data directory set to: {}", data_dir_str);
}

/// Start the Forge server and return the port number
///
/// This function blocks until the server successfully binds to the port,
/// preventing race conditions where the WebView tries to connect before
/// the server is ready.
#[cfg(target_os = "android")]
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

    tracing::info!("Starting Forge server on port {}", port);

    // Create oneshot channel to signal when server is ready
    let (ready_tx, ready_rx) = oneshot::channel();

    // Spawn server in background with error capture
    let handle = runtime.spawn(async move {
        if let Err(e) = crate::run_server_with_readiness(Some(ready_tx)).await {
            let error_msg = format!("Server initialization failed: {}", e);
            tracing::error!("{}", error_msg);
            set_last_error(error_msg);
        }
    });

    // Block until server is ready to accept connections (with timeout)
    let ready_result = runtime.block_on(async {
        tokio::time::timeout(std::time::Duration::from_secs(10), ready_rx).await
    });

    match ready_result {
        Ok(Ok(_)) => {
            tracing::info!("Server ready on port {}", port);
            *SERVER_HANDLE.lock().unwrap() = Some(handle);
            port as jint
        }
        Ok(Err(_)) => {
            runtime.block_on(async {
                for _ in 0..10 {
                    if LAST_ERROR.lock().unwrap().is_some() {
                        break;
                    }
                    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                }
            });

            let has_specific_error = LAST_ERROR.lock().unwrap().is_some();
            if !has_specific_error {
                set_last_error(
                    "Server failed to signal readiness - check initialization".to_string(),
                );
            }
            tracing::error!("Server failed to signal readiness");
            handle.abort();
            -1
        }
        Err(_) => {
            runtime.block_on(async {
                for _ in 0..10 {
                    if LAST_ERROR.lock().unwrap().is_some() {
                        break;
                    }
                    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                }
            });

            let has_specific_error = LAST_ERROR.lock().unwrap().is_some();
            if !has_specific_error {
                set_last_error(
                    "Server startup timeout (10s) - initialization took too long".to_string(),
                );
            }
            tracing::error!("Server startup timeout");
            handle.abort();
            -1
        }
    }
}

/// Stop the Forge server
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_getLogsPath<'local>(
    mut env: JNIEnv<'local>,
    _class: JClass<'local>,
) -> JString<'local> {
    let logs_path = if let Ok(data_dir) = std::env::var("FORGE_DATA_DIR") {
        format!("{}/forge-debug.log", data_dir)
    } else {
        "/tmp/forge-debug.log".to_string()
    };

    env.new_string(logs_path)
        .unwrap_or_else(|_| env.new_string("").unwrap())
}

#[cfg(target_os = "android")]
#[no_mangle]
pub extern "C" fn Java_ai_namastex_forge_MainActivity_stopServer(_env: JNIEnv, _class: JClass) {
    if let Some(handle) = SERVER_HANDLE.lock().unwrap().take() {
        handle.abort();
    }
}
