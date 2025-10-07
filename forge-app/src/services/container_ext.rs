//! Container service extension for Forge branding
//!
//! Overrides branch naming to use "forge/" prefix instead of "vk/"

use utils::text::{git_branch_id, short_uuid};
use uuid::Uuid;

/// Generate git branch name with forge prefix
///
/// Creates branch names like: `forge/a1b2-feature-title`
pub fn forge_branch_from_task_attempt(attempt_id: &Uuid, task_title: &str) -> String {
    let task_title_id = git_branch_id(task_title);
    format!("forge/{}-{}", short_uuid(attempt_id), task_title_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_forge_branch_naming() {
        let id = Uuid::parse_str("12345678-1234-1234-1234-123456789abc").unwrap();
        let branch = forge_branch_from_task_attempt(&id, "Add Login Feature");
        assert!(branch.starts_with("forge/"));
        assert!(branch.contains("-add-login-feat"));
    }
}
