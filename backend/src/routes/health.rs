use axum::response::Json;
use serde_json::{json, Value};

use crate::models::ApiResponse;

pub async fn health_check() -> Json<ApiResponse<Value>> {
    let info = os_info::get();

    let system_info = json!({
        "status": "OK",
        "system": {
            "os_type": info.os_type().to_string(),
            "os_version": info.version().to_string(),
            "architecture": info.architecture().unwrap_or("unknown").to_string(),
            "bitness": info.bitness().to_string(),
        }
    });

    Json(ApiResponse::success(system_info))
}
