use std::{env, sync::Arc};

use axum::{
    extract::{Extension, Host, Query},
    response::{Json as ResponseJson, Redirect},
    routing::get,
    Router,
};
use serde::Deserialize;
use serde_json::Value;
use tokio::sync::RwLock;

use crate::models::{ApiResponse, Config};

pub fn auth_router() -> Router {
    Router::new()
        .route("/auth/github/login", get(github_login))
        .route("/auth/github/callback", get(github_callback))
}

#[derive(Deserialize)]
struct GitHubLoginQuery {
    state: Option<String>,
}

/// Redirects user to GitHub OAuth login
async fn github_login(
    Host(host): Host,
    Query(query): Query<GitHubLoginQuery>,
) -> ResponseJson<ApiResponse<String>> {
    let client_id = env::var("GITHUB_APP_CLIENT_ID").unwrap_or_default();
    let port = host.split(':').nth(1).unwrap_or("80");
    let redirect_uri = format!("http://127.0.0.1:{}/api/auth/github/callback", port);
    let scope = "user:email";
    let mut url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope={}",
        client_id, redirect_uri, scope
    );
    if let Some(state) = &query.state {
        url.push_str("&state=");
        url.push_str(&urlencoding::encode(state));
    }
    ResponseJson(ApiResponse {
        success: true,
        data: Some(url.clone()),
        message: Some("Redirect to GitHub OAuth".to_string()),
    })
}

#[derive(Deserialize)]
struct GitHubCallbackQuery {
    code: String,
    state: Option<String>,
}

fn build_error_redirect(state: &Option<String>, code: &str) -> Redirect {
    let redirect_target = state.as_deref().unwrap_or("/");
    let sep = if redirect_target.contains('?') {
        "&"
    } else {
        "?"
    };
    let url = if redirect_target.starts_with("http://") || redirect_target.starts_with("https://") {
        format!("{}{}oauth_error={}", redirect_target, sep, code)
    } else {
        let frontend_port = std::env::var("FRONTEND_PORT").unwrap_or_else(|_| "5173".to_string());
        format!(
            "http://127.0.0.1:{}{}{}oauth_error={}",
            frontend_port, redirect_target, sep, code
        )
    };
    Redirect::to(&url)
}

/// Handles GitHub OAuth callback
async fn github_callback(
    Host(host): Host,
    Extension(config): Extension<Arc<RwLock<Config>>>,
    Query(query): Query<GitHubCallbackQuery>,
) -> Redirect {
    let client_id = env::var("GITHUB_APP_CLIENT_ID").unwrap_or_default();
    let client_secret = env::var("GITHUB_APP_CLIENT_SECRET").unwrap_or_default();
    let app_id = env::var("GITHUB_APP_ID").unwrap_or_default();
    let port = host.split(':').nth(1).unwrap_or("80");
    let redirect_uri = format!("http://127.0.0.1:{}/api/auth/github/callback", port);
    if client_id.is_empty() || client_secret.is_empty() || app_id.is_empty() {
        return build_error_redirect(&query.state, "missing_credentials");
    }

    // Exchange code for access token
    let token_url = "https://github.com/login/oauth/access_token";
    let params = [
        ("client_id", client_id.as_str()),
        ("client_secret", client_secret.as_str()),
        ("code", query.code.as_str()),
        ("redirect_uri", redirect_uri.as_str()),
    ];

    let client = reqwest::Client::new();
    let token_res = client
        .post(token_url)
        .header("Accept", "application/json")
        .form(&params)
        .send()
        .await;

    let token_res = match token_res {
        Ok(res) => res,
        Err(_) => return build_error_redirect(&query.state, "exchange_failed"),
    };
    let token_json: Value = match token_res.json().await {
        Ok(json) => json,
        Err(_) => return build_error_redirect(&query.state, "exchange_failed"),
    };
    let access_token = token_json
        .get("access_token")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    let refresh_token = token_json
        .get("refresh_token")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    if access_token.is_none() {
        return build_error_redirect(&query.state, "no_access_token");
    }
    let access_token = access_token.unwrap();

    // Fetch user info
    let user_res = client
        .get("https://api.github.com/user")
        .bearer_auth(&access_token)
        .header("User-Agent", "vibe-kanban-app")
        .send()
        .await;
    let user_json: Value = match user_res {
        Ok(res) => match res.json().await {
            Ok(json) => json,
            Err(_) => return build_error_redirect(&query.state, "user_fetch_failed"),
        },
        Err(_) => return build_error_redirect(&query.state, "user_fetch_failed"),
    };
    let username = user_json
        .get("login")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // Fetch user emails
    let emails_res = client
        .get("https://api.github.com/user/emails")
        .bearer_auth(&access_token)
        .header("User-Agent", "vibe-kanban-app")
        .send()
        .await;
    let emails_json: Value = match emails_res {
        Ok(res) => match res.json().await {
            Ok(json) => json,
            Err(_) => return build_error_redirect(&query.state, "email_fetch_failed"),
        },
        Err(_) => return build_error_redirect(&query.state, "email_fetch_failed"),
    };
    let primary_email = emails_json
        .as_array()
        .and_then(|arr| {
            arr.iter()
                .find(|email| {
                    email
                        .get("primary")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false)
                })
                .and_then(|email| email.get("email").and_then(|v| v.as_str()))
        })
        .map(|s| s.to_string());

    // Save to config
    {
        let mut config = config.write().await;
        config.github.username = username;
        config.github.primary_email = primary_email;
        config.github.token = Some(access_token);
        config.github.refresh_token = refresh_token;
        let config_path = crate::utils::config_path();
        if config.save(&config_path).is_err() {
            return build_error_redirect(&query.state, "config_save_failed");
        }
    }

    // Redirect to the original page (state) or home
    let redirect_target = query.state.as_deref().unwrap_or("/");
    let final_url =
        if redirect_target.starts_with("http://") || redirect_target.starts_with("https://") {
            redirect_target.to_string()
        } else {
            let frontend_port = env::var("FRONTEND_PORT").unwrap_or_else(|_| "5173".to_string());
            format!("http://127.0.0.1:{}{}", frontend_port, redirect_target)
        };
    Redirect::to(&final_url)
}
