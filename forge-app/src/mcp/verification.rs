//! MCP Tools Verification Module
//!
//! This module provides programmatic verification that ALL backend endpoints
//! are exposed as MCP tools in advanced mode.

use std::collections::HashSet;

/// Complete list of all Forge backend API endpoints
/// This is the CANONICAL source of truth for what should be exposed
pub const ALL_BACKEND_ENDPOINTS: &[(&str, &str, &str)] = &[
    // (HTTP_METHOD, ENDPOINT_PATH, MCP_TOOL_NAME)

    // ========== CORE TOOLS (7 - always available) ==========
    ("GET", "/api/projects", "list_projects"),
    ("POST", "/api/tasks", "create_task"),
    ("GET", "/api/tasks/{id}", "get_task"),
    ("GET", "/api/tasks", "list_tasks"),
    ("PUT", "/api/tasks/{id}", "update_task"),
    ("DELETE", "/api/tasks/{id}", "delete_task"),
    ("POST", "/api/task-attempts", "start_task_attempt"),
    // ========== ADVANCED: PROJECTS (4 tools) ==========
    ("POST", "/api/projects", "adv_create_project"),
    ("GET", "/api/projects/{id}", "adv_get_project"),
    ("PUT", "/api/projects/{id}", "adv_update_project"),
    ("DELETE", "/api/projects/{id}", "adv_delete_project"),
    // ========== ADVANCED: TASKS (2 tools) ==========
    (
        "POST",
        "/api/tasks/create-and-start",
        "adv_create_task_and_start",
    ),
    ("GET", "/api/tasks/stream/ws", "adv_stream_tasks"), // WebSocket - may skip
    // ========== ADVANCED: TASK ATTEMPTS (25 tools) ==========
    ("GET", "/api/task-attempts", "adv_list_task_attempts"),
    ("GET", "/api/task-attempts/{id}", "adv_get_task_attempt"),
    ("POST", "/api/task-attempts/{id}/follow-up", "adv_follow_up"),
    (
        "POST",
        "/api/task-attempts/{id}/stop",
        "adv_stop_task_attempt",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/merge",
        "adv_merge_task_attempt",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/push",
        "adv_push_task_attempt",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/rebase",
        "adv_rebase_task_attempt",
    ),
    ("POST", "/api/task-attempts/{id}/pr", "adv_create_pr"),
    ("POST", "/api/task-attempts/{id}/pr/attach", "adv_attach_pr"),
    (
        "GET",
        "/api/task-attempts/{id}/branch-status",
        "adv_get_branch_status",
    ),
    ("GET", "/api/task-attempts/{id}/diff/ws", "adv_stream_diff"), // WebSocket - may skip
    ("GET", "/api/task-attempts/{id}/draft", "adv_get_draft"),
    ("PUT", "/api/task-attempts/{id}/draft", "adv_save_draft"),
    (
        "DELETE",
        "/api/task-attempts/{id}/draft",
        "adv_delete_draft",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/draft/queue",
        "adv_set_draft_queue",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/replace-process",
        "adv_replace_process",
    ),
    (
        "GET",
        "/api/task-attempts/{id}/commit-info",
        "adv_get_commit_info",
    ),
    (
        "GET",
        "/api/task-attempts/{id}/commit-compare",
        "adv_compare_commit",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/start-dev-server",
        "adv_start_dev_server",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/open-editor",
        "adv_open_editor",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/delete-file",
        "adv_delete_file",
    ),
    (
        "GET",
        "/api/task-attempts/{id}/children",
        "adv_get_children",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/conflicts/abort",
        "adv_abort_conflicts",
    ),
    (
        "POST",
        "/api/task-attempts/{id}/change-target-branch",
        "adv_change_target_branch",
    ),
    // ========== ADVANCED: EXECUTION PROCESSES (3 tools) ==========
    ("GET", "/api/execution-processes", "adv_list_processes"),
    ("GET", "/api/execution-processes/{id}", "adv_get_process"),
    (
        "POST",
        "/api/execution-processes/{id}/stop",
        "adv_stop_process",
    ),
    // ========== ADVANCED: IMAGES (2 tools) ==========
    ("POST", "/api/images", "adv_upload_image"),
    ("GET", "/api/images/{id}", "adv_get_image"),
    // ========== ADVANCED: FILESYSTEM (2 tools) ==========
    ("GET", "/api/filesystem/tree", "adv_get_filesystem_tree"),
    ("GET", "/api/filesystem/file", "adv_get_file"),
    // ========== ADVANCED: CONFIG (2 tools) ==========
    ("GET", "/api/config", "adv_get_config"),
    ("PUT", "/api/config", "adv_update_config"),
    // ========== ADVANCED: DRAFTS (5 tools) ==========
    ("GET", "/api/drafts", "adv_list_drafts"),
    ("POST", "/api/drafts", "adv_create_draft"),
    ("GET", "/api/drafts/{id}", "adv_get_draft_by_id"),
    ("PUT", "/api/drafts/{id}", "adv_update_draft"),
    ("DELETE", "/api/drafts/{id}", "adv_delete_draft_by_id"),
    // ========== ADVANCED: CONTAINERS (2 tools) ==========
    ("GET", "/api/containers", "adv_list_containers"),
    ("GET", "/api/containers/{id}", "adv_get_container"),
    // ========== ADVANCED: FORGE-SPECIFIC (8 tools) ==========
    ("GET", "/api/forge/config", "adv_get_forge_config"),
    ("PUT", "/api/forge/config", "adv_update_forge_config"),
    (
        "GET",
        "/api/forge/projects/{id}/settings",
        "adv_get_project_settings",
    ),
    (
        "PUT",
        "/api/forge/projects/{id}/settings",
        "adv_update_project_settings",
    ),
    ("GET", "/api/forge/omni/status", "adv_get_omni_status"),
    (
        "GET",
        "/api/forge/omni/instances",
        "adv_list_omni_instances",
    ),
    (
        "POST",
        "/api/forge/omni/validate",
        "adv_validate_omni_config",
    ),
    (
        "GET",
        "/api/forge/omni/notifications",
        "adv_list_omni_notifications",
    ),
    // ========== SKIPPED: EVENTS/SSE (not suitable for MCP) ==========
    // GET /api/events/processes/{id}/logs - Server-Sent Events
    // GET /api/events/task-attempts/{id}/diff - Server-Sent Events
];

/// Get statistics about endpoint coverage
pub fn get_coverage_stats() -> (usize, usize, usize) {
    let total = ALL_BACKEND_ENDPOINTS.len();
    let core = ALL_BACKEND_ENDPOINTS
        .iter()
        .filter(|(_, _, name)| !name.starts_with("adv_"))
        .count();
    let advanced = total - core;
    (total, core, advanced)
}

/// Verify that all expected tools are defined
pub fn verify_tool_completeness(defined_tools: &[&str]) -> Result<(), Vec<String>> {
    let defined: HashSet<&str> = defined_tools.iter().copied().collect();
    let expected: HashSet<&str> = ALL_BACKEND_ENDPOINTS
        .iter()
        .map(|(_, _, name)| *name)
        .collect();

    let missing: Vec<String> = expected
        .difference(&defined)
        .map(|s| s.to_string())
        .collect();

    if missing.is_empty() {
        Ok(())
    } else {
        Err(missing)
    }
}

/// Print coverage report
pub fn print_coverage_report() {
    let (total, core, advanced) = get_coverage_stats();

    println!("=== Forge MCP Tools Coverage Report ===");
    println!("Total Backend Endpoints: {}", total);
    println!("Core Tools (always available): {}", core);
    println!("Advanced Tools (--advanced flag): {}", advanced);
    println!();
    println!("Breakdown by Category:");

    let mut categories: std::collections::HashMap<&str, usize> = std::collections::HashMap::new();
    for (_, path, name) in ALL_BACKEND_ENDPOINTS {
        let category = if name.starts_with("adv_") {
            if path.contains("/projects") && !path.contains("/forge/") {
                "Advanced: Projects"
            } else if path.contains("/tasks") && !path.contains("/task-attempts") {
                "Advanced: Tasks"
            } else if path.contains("/task-attempts") {
                "Advanced: Task Attempts"
            } else if path.contains("/execution-processes") {
                "Advanced: Execution Processes"
            } else if path.contains("/images") {
                "Advanced: Images"
            } else if path.contains("/filesystem") {
                "Advanced: Filesystem"
            } else if path.contains("/config") && !path.contains("/forge/") {
                "Advanced: Config"
            } else if path.contains("/drafts") {
                "Advanced: Drafts"
            } else if path.contains("/containers") {
                "Advanced: Containers"
            } else if path.contains("/forge/") {
                "Advanced: Forge-Specific"
            } else {
                "Advanced: Other"
            }
        } else {
            "Core"
        };

        *categories.entry(category).or_insert(0) += 1;
    }

    for (category, count) in categories.iter() {
        println!("  {}: {}", category, count);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coverage_stats() {
        let (total, core, advanced) = get_coverage_stats();
        assert!(total > 0, "Should have endpoints defined");
        assert!(core > 0, "Should have core tools");
        assert!(advanced > 0, "Should have advanced tools");
        assert_eq!(total, core + advanced, "Total should equal core + advanced");
    }

    #[test]
    fn test_no_duplicate_tool_names() {
        let tool_names: Vec<&str> = ALL_BACKEND_ENDPOINTS
            .iter()
            .map(|(_, _, name)| *name)
            .collect();

        let unique: HashSet<&str> = tool_names.iter().copied().collect();
        assert_eq!(tool_names.len(), unique.len(), "Tool names must be unique");
    }
}
