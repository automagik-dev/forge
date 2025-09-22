use std::path::Path;

use axum::http::header;
use axum::{
    body::Body,
    http::{HeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use mime_guess::from_path;
use rust_embed::RustEmbed;

const LEGACY_FRONTEND_ROOT: &str =
    concat!(env!("CARGO_MANIFEST_DIR"), "/../../upstream/frontend/dist");

#[derive(RustEmbed)]
#[folder = "../../frontend/dist"]
struct ForgeAssets;

pub async fn serve_frontend(path: axum::extract::Path<String>) -> impl IntoResponse {
    serve_embedded::<ForgeAssets>(&path)
}

pub async fn serve_frontend_root() -> impl IntoResponse {
    serve_embedded::<ForgeAssets>("index.html")
}

pub async fn serve_legacy_frontend(path: axum::extract::Path<String>) -> impl IntoResponse {
    serve_from_disk(&path)
}

pub async fn serve_legacy_frontend_root() -> impl IntoResponse {
    serve_from_disk("index.html")
}

fn serve_embedded<A>(requested_path: &str) -> Response
where
    A: RustEmbed,
{
    let normalized = requested_path.trim_start_matches('/');
    let path = if normalized.is_empty() {
        "index.html"
    } else {
        normalized
    };

    match A::get(path) {
        Some(content) => build_response(path, content.data.into_owned()),
        None => {
            if let Some(index) = A::get("index.html") {
                build_response("index.html", index.data.into_owned())
            } else {
                not_found()
            }
        }
    }
}

fn serve_from_disk(requested_path: &str) -> Response {
    let normalized = requested_path.trim_start_matches('/');
    let base = Path::new(LEGACY_FRONTEND_ROOT);
    let target_path = if normalized.is_empty() {
        base.join("index.html")
    } else {
        base.join(normalized)
    };

    if let Ok(bytes) = std::fs::read(&target_path) {
        let mime = from_path(&target_path).first_or_octet_stream();
        if target_path
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.eq_ignore_ascii_case("index.html"))
        {
            let rewritten = rewrite_legacy_index(bytes);
            build_response_lite(mime.as_ref(), rewritten)
        } else {
            build_response_lite(mime.as_ref(), bytes)
        }
    } else {
        let index_path = base.join("index.html");
        match std::fs::read(&index_path) {
            Ok(bytes) => build_response_lite("text/html", rewrite_legacy_index(bytes)),
            Err(_) => not_found(),
        }
    }
}

fn rewrite_legacy_index(bytes: Vec<u8>) -> Vec<u8> {
    let html = String::from_utf8_lossy(&bytes);
    html.replace("/assets/", "/legacy/assets/").into_bytes()
}

fn build_response(path: &str, bytes: Vec<u8>) -> Response {
    let mime = from_path(path).first_or_octet_stream();
    build_response_lite(mime.as_ref(), bytes)
}

fn build_response_lite(mime: &str, bytes: Vec<u8>) -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, HeaderValue::from_str(mime).unwrap())
        .body(Body::from(bytes))
        .unwrap()
}

fn not_found() -> Response {
    Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(Body::from("404 Not Found"))
        .unwrap()
}
