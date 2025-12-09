use forge_omni::{client::OmniClient, types::SendTextRequest};
use wiremock::{
    Mock, MockServer, ResponseTemplate,
    matchers::{header, method, path},
};

// NOTE: All API keys and secrets in this test file are fake test values only.
// They are used solely for testing HTTP header functionality and are not real credentials.

/// Test successful notification sending with phone number
#[tokio::test]
async fn test_send_text_success_with_phone_number() {
    // Start a mock HTTP server
    let mock_server = MockServer::start().await;

    // Configure the mock to respond to send-text requests
    Mock::given(method("POST"))
        .and(path("/api/v1/instance/test-instance/send-text"))
        .and(header("content-type", "application/json"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "success": true,
            "message_id": "msg_12345",
            "status": "sent",
            "error": null
        })))
        .mount(&mock_server)
        .await;

    // Create client pointing to mock server
    let client = OmniClient::new(mock_server.uri(), None);

    // Create request
    let request = SendTextRequest {
        phone_number: Some("1234567890".to_string()),
        user_id: None,
        text: "Test notification message".to_string(),
    };

    // Send text
    let response = client
        .send_text("test-instance", request)
        .await
        .expect("Should successfully send text");

    // Verify response
    assert!(response.success);
    assert_eq!(response.message_id, Some("msg_12345".to_string()));
    assert_eq!(response.status, "sent");
    assert!(response.error.is_none());
}

/// Test successful notification sending with user ID
#[tokio::test]
async fn test_send_text_success_with_user_id() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api/v1/instance/whatsapp-bot/send-text"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "success": true,
            "message_id": "msg_67890",
            "status": "delivered",
            "error": null
        })))
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(mock_server.uri(), None);

    let request = SendTextRequest {
        phone_number: None,
        user_id: Some("user_abc123".to_string()),
        text: "Hello from tests!".to_string(),
    };

    let response = client
        .send_text("whatsapp-bot", request)
        .await
        .expect("Should successfully send text");

    assert!(response.success);
    assert_eq!(response.message_id, Some("msg_67890".to_string()));
    assert_eq!(response.status, "delivered");
}

/// Test request formatting with API key header
#[tokio::test]
async fn test_send_text_with_api_key_header() {
    let mock_server = MockServer::start().await;

    // Verify that the X-API-Key header is sent correctly
    Mock::given(method("POST"))
        .and(path("/api/v1/instance/secure-instance/send-text"))
        .and(header("X-API-Key", "test-api-key-fake-value"))
        .and(header("content-type", "application/json"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "success": true,
            "message_id": "msg_secure",
            "status": "sent",
            "error": null
        })))
        .mount(&mock_server)
        .await;

    // Create client with API key
    let client = OmniClient::new(
        mock_server.uri(),
        Some("test-api-key-fake-value".to_string()),
    );

    let request = SendTextRequest {
        phone_number: Some("9876543210".to_string()),
        user_id: None,
        text: "Secure message".to_string(),
    };

    let response = client
        .send_text("secure-instance", request)
        .await
        .expect("Should successfully send with API key");

    assert!(response.success);
    assert_eq!(response.message_id, Some("msg_secure".to_string()));
}

/// Test error handling for HTTP 4xx errors
#[tokio::test]
async fn test_send_text_http_error_4xx() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api/v1/instance/bad-instance/send-text"))
        .respond_with(
            ResponseTemplate::new(400).set_body_string("Invalid request: missing recipient"),
        )
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(mock_server.uri(), None);

    let request = SendTextRequest {
        phone_number: None,
        user_id: None,
        text: "This should fail".to_string(),
    };

    let result = client.send_text("bad-instance", request).await;

    assert!(result.is_err());
    let error = result.unwrap_err();
    let error_msg = error.to_string();
    assert!(
        error_msg.contains("400") || error_msg.contains("Invalid request"),
        "Error should mention 400 or invalid request, got: {error_msg}"
    );
}

/// Test error handling for HTTP 5xx errors
#[tokio::test]
async fn test_send_text_http_error_5xx() {
    let mock_server = MockServer::start().await;

    Mock::given(method("POST"))
        .and(path("/api/v1/instance/failing-instance/send-text"))
        .respond_with(ResponseTemplate::new(503).set_body_string("Service temporarily unavailable"))
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(mock_server.uri(), None);

    let request = SendTextRequest {
        phone_number: Some("1111111111".to_string()),
        user_id: None,
        text: "Test message".to_string(),
    };

    let result = client.send_text("failing-instance", request).await;

    assert!(result.is_err());
    let error = result.unwrap_err();
    let error_msg = error.to_string();
    assert!(
        error_msg.contains("503") || error_msg.contains("unavailable"),
        "Error should mention 503 or unavailable, got: {error_msg}"
    );
}

/// Test network connection failure handling
#[tokio::test]
async fn test_send_text_connection_failure() {
    // Use an invalid URL that will fail to connect
    let client = OmniClient::new(
        "http://invalid-host-that-does-not-exist:9999".to_string(),
        None,
    );

    let request = SendTextRequest {
        phone_number: Some("1234567890".to_string()),
        user_id: None,
        text: "This will fail to connect".to_string(),
    };

    let result = client.send_text("any-instance", request).await;

    assert!(result.is_err());
    // The error should be a connection/network error
    let error = result.unwrap_err();
    let error_msg = error.to_string().to_lowercase();
    // reqwest errors typically contain words like "dns", "connection", "resolve", etc.
    assert!(
        error_msg.contains("dns")
            || error_msg.contains("connection")
            || error_msg.contains("resolve")
            || error_msg.contains("error"),
        "Error should indicate connection failure, got: {error}"
    );
}

/// Test list_instances success
#[tokio::test]
async fn test_list_instances_success() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/api/v1/instances/"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "channels": [
                {
                    "instance_name": "whatsapp-1",
                    "channel_type": "whatsapp",
                    "display_name": "WhatsApp - Main",
                    "status": "connected",
                    "is_healthy": true
                },
                {
                    "instance_name": "discord-bot",
                    "channel_type": "discord",
                    "display_name": "Discord Bot",
                    "status": "connected",
                    "is_healthy": true
                }
            ]
        })))
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(mock_server.uri(), None);

    let instances = client
        .list_instances()
        .await
        .expect("Should successfully list instances");

    assert_eq!(instances.len(), 2);
    assert_eq!(instances[0].instance_name, "whatsapp-1");
    assert_eq!(instances[0].channel_type, "whatsapp");
    assert!(instances[0].is_healthy);
    assert_eq!(instances[1].instance_name, "discord-bot");
    assert_eq!(instances[1].channel_type, "discord");
}

/// Test list_instances with API key
#[tokio::test]
async fn test_list_instances_with_api_key() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/api/v1/instances/"))
        .and(header("X-API-Key", "fake-key-for-testing-only"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "channels": [
                {
                    "instance_name": "secure-channel",
                    "channel_type": "telegram",
                    "display_name": "Telegram Secure",
                    "status": "connected",
                    "is_healthy": true
                }
            ]
        })))
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(
        mock_server.uri(),
        Some("fake-key-for-testing-only".to_string()),
    );

    let instances = client
        .list_instances()
        .await
        .expect("Should successfully list instances with API key");

    assert_eq!(instances.len(), 1);
    assert_eq!(instances[0].instance_name, "secure-channel");
}

/// Test list_instances error handling
#[tokio::test]
async fn test_list_instances_error() {
    let mock_server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/api/v1/instances/"))
        .respond_with(ResponseTemplate::new(500).set_body_string("Internal server error"))
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(mock_server.uri(), None);

    let result = client.list_instances().await;

    assert!(result.is_err());
}

/// Test request body formatting - verify JSON structure
#[tokio::test]
async fn test_send_text_request_body_format() {
    let mock_server = MockServer::start().await;

    // Use a custom matcher to verify the request body structure
    Mock::given(method("POST"))
        .and(path("/api/v1/instance/test/send-text"))
        .and(wiremock::matchers::body_json(serde_json::json!({
            "phone_number": "5551234567",
            "text": "Formatted message"
        })))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "success": true,
            "message_id": "msg_format_test",
            "status": "sent",
            "error": null
        })))
        .mount(&mock_server)
        .await;

    let client = OmniClient::new(mock_server.uri(), None);

    let request = SendTextRequest {
        phone_number: Some("5551234567".to_string()),
        user_id: None, // Should be omitted from JSON
        text: "Formatted message".to_string(),
    };

    let response = client
        .send_text("test", request)
        .await
        .expect("Should send with correct body format");

    assert!(response.success);
}
