//! Tests for Forge Services
//!
//! Extracted from mod.rs to keep file under 1000 lines (AGENTS.md Amendment #8)

use forge_core_services::services::{
    forge_config::{ForgeConfigService, ForgeProjectSettings},
    omni::{OmniConfig, RecipientType},
};
use httpmock::prelude::*;
use serde_json::json;
use sqlx::SqlitePool;
use uuid::Uuid;

use super::*;

async fn setup_pool() -> SqlitePool {
    unsafe {
        std::env::set_var("DATABASE_URL", "sqlite::memory:");
    }
    let db_service = forge_core_db::DBService::new()
        .await
        .expect("failed to create db service with migrations");
    db_service.pool
}

async fn insert_project(pool: &SqlitePool, project_id: Uuid) {
    let unique_path = format!("/tmp/test-project-{project_id}");
    sqlx::query("INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Forge Project', ?)")
        .bind(project_id)
        .bind(unique_path)
        .execute(pool)
        .await
        .expect("failed to insert project row");
}

async fn insert_task_graph(pool: &SqlitePool, project_id: Uuid) -> (Uuid, Uuid) {
    let task_id = Uuid::new_v4();
    let attempt_id = Uuid::new_v4();

    sqlx::query(
        "INSERT INTO tasks (id, project_id, title, status, created_at, updated_at)
         VALUES (?, ?, 'Omni Notification Test', 'todo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    )
    .bind(task_id)
    .bind(project_id)
    .execute(pool)
    .await
    .expect("failed to insert task row");

    sqlx::query(
        "INSERT INTO task_attempts (id, task_id, branch, target_branch, executor)
         VALUES (?, ?, 'feature/test', 'main', 'forge-agent')",
    )
    .bind(attempt_id)
    .bind(task_id)
    .execute(pool)
    .await
    .expect("failed to insert task attempt row");

    (task_id, attempt_id)
}

fn pending_metadata(attempt_id: Uuid, project_id: Uuid) -> String {
    json!({
        "task_attempt_id": attempt_id,
        "status": "completed",
        "executor": "forge-agent",
        "branch": "feature/test",
        "project_id": project_id,
    })
    .to_string()
}

#[tokio::test]
async fn omni_notification_skips_when_disabled() {
    let pool = setup_pool().await;
    let project_id = Uuid::new_v4();
    insert_project(&pool, project_id).await;
    let (_task_id, attempt_id) = insert_task_graph(&pool, project_id).await;

    let config = ForgeConfigService::new(pool.clone());

    let result = handle_omni_notification(
        &pool,
        &config,
        &PendingNotification {
            id: "notif-1".into(),
            metadata: Some(pending_metadata(attempt_id, project_id)),
        },
    )
    .await
    .expect("notification with disabled config should not error");

    match result {
        OmniQueueAction::Skipped { reason } => {
            assert!(reason.contains("disabled"));
        }
        other => panic!("expected skip, got {other:?}"),
    }
}

#[tokio::test]
async fn omni_notification_requires_host_configuration() {
    let pool = setup_pool().await;
    let project_id = Uuid::new_v4();
    insert_project(&pool, ForgeConfigService::GLOBAL_PROJECT_ID).await;
    insert_project(&pool, project_id).await;
    let (_task_id, attempt_id) = insert_task_graph(&pool, project_id).await;

    let config_service = ForgeConfigService::new(pool.clone());
    let settings = ForgeProjectSettings {
        omni_enabled: true,
        omni_config: Some(OmniConfig {
            enabled: true,
            host: None,
            api_key: None,
            instance: Some("forge-instance".into()),
            recipient: Some("+15550001111".into()),
            recipient_type: Some(RecipientType::PhoneNumber),
        }),
    };

    config_service
        .set_global_settings(&settings)
        .await
        .expect("should store global settings");

    let err = handle_omni_notification(
        &pool,
        &config_service,
        &PendingNotification {
            id: "notif-missing-host".into(),
            metadata: Some(pending_metadata(attempt_id, project_id)),
        },
    )
    .await
    .expect_err("missing host should raise error");

    assert!(err.to_string().contains("Omni host"));
}

#[tokio::test(flavor = "multi_thread")]
#[serial_test::serial]
async fn process_next_notification_marks_sent() {
    let pool = setup_pool().await;
    let project_id = Uuid::new_v4();
    insert_project(&pool, ForgeConfigService::GLOBAL_PROJECT_ID).await;
    insert_project(&pool, project_id).await;
    let (task_id, attempt_id) = insert_task_graph(&pool, project_id).await;

    let config_service = ForgeConfigService::new(pool.clone());
    let server = MockServer::start_async().await;
    let mock = server.mock(|when, then| {
        when.method(POST)
            .path("/api/v1/instance/forge-instance/send-text");
        then.status(200)
            .header("Content-Type", "application/json")
            .json_body(json!({
                "success": true,
                "message_id": "msg-123",
                "status": "queued",
                "error": null
            }));
    });
    let base_url = server.base_url();

    let settings = ForgeProjectSettings {
        omni_enabled: true,
        omni_config: Some(OmniConfig {
            enabled: true,
            host: Some(base_url.clone()),
            api_key: None,
            instance: Some("forge-instance".into()),
            recipient: Some("+15550001111".into()),
            recipient_type: Some(RecipientType::PhoneNumber),
        }),
    };
    config_service
        .set_global_settings(&settings)
        .await
        .expect("should persist omni settings");

    sqlx::query(
        "INSERT INTO forge_omni_notifications (id, task_id, notification_type, recipient, message, status, metadata)
         VALUES ('execution-1', ?, 'execution_completed', '', '', 'pending', ?)",
    )
    .bind(task_id)
    .bind(pending_metadata(attempt_id, project_id))
    .execute(&pool)
    .await
    .expect("failed to queue notification");

    let previous_url = std::env::var("PUBLIC_BASE_URL").ok();
    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "http://forge.example");
    }

    let processed = process_next_omni_notification(&pool, &config_service)
        .await
        .expect("processing should succeed");
    assert!(processed);

    let row: (String, Option<String>, Option<String>) = sqlx::query_as(
        "SELECT status, message, sent_at FROM forge_omni_notifications WHERE id = 'execution-1'",
    )
    .fetch_one(&pool)
    .await
    .expect("queue row remains accessible");

    assert_eq!(row.0, "sent");
    assert!(row.1.unwrap_or_default().contains("Execution completed"));
    assert!(row.2.is_some());

    mock.assert_async().await;

    unsafe {
        if let Some(url) = previous_url {
            std::env::set_var("PUBLIC_BASE_URL", url);
        } else {
            std::env::remove_var("PUBLIC_BASE_URL");
        }
    }
}

#[test]
fn status_summary_includes_branch_and_executor() {
    let summary = format_status_summary("completed", "forge-agent", "feature/auth");
    assert!(summary.contains("forge-agent"));
    assert!(summary.contains("feature/auth"));
    assert!(summary.starts_with("✅"));
}

#[test]
#[serial_test::serial]
fn omni_base_url_respects_env_vars() {
    let previous_public = std::env::var("PUBLIC_BASE_URL").ok();
    let previous_host = std::env::var("HOST").ok();
    let previous_backend_port = std::env::var("BACKEND_PORT").ok();
    let previous_port = std::env::var("PORT").ok();

    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "https://forge.example.com");
        std::env::set_var("HOST", "10.0.0.1");
        std::env::set_var("BACKEND_PORT", "9999");
    }
    assert_eq!(omni_base_url(), "https://forge.example.com");

    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
        std::env::set_var("HOST", "10.0.0.2");
        std::env::set_var("BACKEND_PORT", "9999");
    }
    assert_eq!(omni_base_url(), "http://10.0.0.2:9999");

    unsafe {
        std::env::remove_var("BACKEND_PORT");
        std::env::set_var("PORT", "8080");
    }
    assert_eq!(omni_base_url(), "http://10.0.0.2:8080");

    unsafe {
        std::env::remove_var("HOST");
        std::env::remove_var("PORT");
    }
    assert_eq!(omni_base_url(), "http://127.0.0.1:8887");

    unsafe {
        if let Some(url) = previous_public {
            std::env::set_var("PUBLIC_BASE_URL", url);
        } else {
            std::env::remove_var("PUBLIC_BASE_URL");
        }
        if let Some(host) = previous_host {
            std::env::set_var("HOST", host);
        } else {
            std::env::remove_var("HOST");
        }
        if let Some(port) = previous_backend_port {
            std::env::set_var("BACKEND_PORT", port);
        } else {
            std::env::remove_var("BACKEND_PORT");
        }
        if let Some(port) = previous_port {
            std::env::set_var("PORT", port);
        } else {
            std::env::remove_var("PORT");
        }
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_rejects_javascript_scheme() {
    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "javascript:alert(1)");
    }
    // Should fall back to HOST/PORT when invalid scheme detected
    let result = omni_base_url();
    assert!(result.starts_with("http://"));
    assert!(!result.contains("javascript"));
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_rejects_data_scheme() {
    unsafe {
        std::env::set_var(
            "PUBLIC_BASE_URL",
            "data:text/html,<script>alert(1)</script>",
        );
    }
    // Should fall back to HOST/PORT when invalid scheme detected
    let result = omni_base_url();
    assert!(result.starts_with("http://"));
    assert!(!result.contains("data:"));
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_rejects_file_scheme() {
    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "file:///etc/passwd");
    }
    // Should fall back to HOST/PORT when invalid scheme detected
    let result = omni_base_url();
    assert!(result.starts_with("http://"));
    assert!(!result.contains("file://"));
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_rejects_invalid_url() {
    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "not-a-valid-url");
    }
    // Should fall back to HOST/PORT when URL parsing fails
    let result = omni_base_url();
    assert_eq!(result, "http://127.0.0.1:8887");
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
    }
}

#[test]
fn test_sanitize_hostname_removes_newlines() {
    let malicious = "evil.com\nX-Injected: true";
    let sanitized = sanitize_hostname(malicious);
    assert_eq!(sanitized, "evil.comX-Injectedtrue");
    assert!(!sanitized.contains('\n'));
}

#[test]
fn test_sanitize_hostname_allows_ipv4() {
    let ipv4 = "192.168.1.1";
    let sanitized = sanitize_hostname(ipv4);
    assert_eq!(sanitized, ipv4);
}

#[test]
fn test_sanitize_hostname_allows_ipv6() {
    let ipv6 = "[::1]";
    let sanitized = sanitize_hostname(ipv6);
    assert_eq!(sanitized, ipv6);

    let ipv6_full = "[2001:db8::1]";
    let sanitized_full = sanitize_hostname(ipv6_full);
    assert_eq!(sanitized_full, ipv6_full);
}

#[test]
fn test_sanitize_hostname_allows_valid_domains() {
    let domain = "api.example-test.com";
    let sanitized = sanitize_hostname(domain);
    assert_eq!(sanitized, domain);
}

#[test]
fn test_sanitize_hostname_removes_special_chars() {
    let malicious = "evil.com?param=value";
    let sanitized = sanitize_hostname(malicious);
    assert_eq!(sanitized, "evil.comparamvalue");
    assert!(!sanitized.contains('?'));
}

#[test]
fn test_sanitize_port_removes_non_digits() {
    let malicious = "8080?evil=param";
    let sanitized = sanitize_port(malicious);
    assert_eq!(sanitized, "8080");
}

#[test]
fn test_sanitize_port_removes_newlines() {
    let malicious = "8080\nX-Injected: true";
    let sanitized = sanitize_port(malicious);
    assert_eq!(sanitized, "8080");
    assert!(!sanitized.contains('\n'));
}

#[test]
fn test_sanitize_port_allows_valid_port() {
    let valid = "8887";
    let sanitized = sanitize_port(valid);
    assert_eq!(sanitized, valid);
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_sanitizes_host_injection() {
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
        std::env::set_var("HOST", "evil.com\nX-Injected: header");
        std::env::set_var("BACKEND_PORT", "8080");
    }
    let result = omni_base_url();
    assert_eq!(result, "http://evil.comX-Injectedheader:8080");
    assert!(!result.contains('\n'));
    unsafe {
        std::env::remove_var("HOST");
        std::env::remove_var("BACKEND_PORT");
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_sanitizes_port_injection() {
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
        std::env::set_var("HOST", "localhost");
        std::env::set_var("BACKEND_PORT", "8080?evil=param");
    }
    let result = omni_base_url();
    assert_eq!(result, "http://localhost:8080");
    assert!(!result.contains('?'));
    unsafe {
        std::env::remove_var("HOST");
        std::env::remove_var("BACKEND_PORT");
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_accepts_valid_https() {
    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "https://secure.example.com");
    }
    let result = omni_base_url();
    assert_eq!(result, "https://secure.example.com");
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
    }
}

#[test]
#[serial_test::serial]
fn test_omni_base_url_accepts_valid_http() {
    unsafe {
        std::env::set_var("PUBLIC_BASE_URL", "http://local.example.com");
    }
    let result = omni_base_url();
    assert_eq!(result, "http://local.example.com");
    unsafe {
        std::env::remove_var("PUBLIC_BASE_URL");
    }
}
