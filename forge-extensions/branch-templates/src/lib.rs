//! Branch template helpers and data access for forge-specific metadata.

use serde::{Deserialize, Serialize};
use uuid::Uuid;

mod store;

pub use store::BranchTemplateStore;

/// Generate a branch name using either a custom template or the default forge pattern.
pub fn generate_branch_name(template: Option<&str>, title: &str, attempt_id: &Uuid) -> String {
    if let Some(template) = template.filter(|value| !value.trim().is_empty()) {
        format!("{}-{}", template, &attempt_id.to_string()[..4])
    } else {
        let task_title_id = utils::text::git_branch_id(title);
        format!(
            "forge-{}-{}",
            task_title_id,
            utils::text::short_uuid(attempt_id)
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BranchTemplate {
    pub name: String,
    pub description: String,
}

impl BranchTemplate {
    pub fn example() -> Self {
        Self {
            name: "feature/scaffold".to_string(),
            description: "Placeholder template until extraction".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn example_has_expected_name() {
        let template = BranchTemplate::example();
        assert_eq!(template.name, "feature/scaffold");
    }

    #[test]
    fn generate_branch_name_uses_template_suffix() {
        let attempt_id = Uuid::new_v4();
        let result = generate_branch_name(Some("feature-login"), "Login Flow", &attempt_id);
        assert!(result.starts_with("feature-login-"));
        assert_eq!(result.len(), "feature-login-".len() + 4);
    }

    #[test]
    fn generate_branch_name_uses_default_pattern() {
        let attempt_id = Uuid::nil();
        let result = generate_branch_name(None, "Add Payment Flow", &attempt_id);
        let expected_prefix = format!("forge-{}-", utils::text::git_branch_id("Add Payment Flow"));
        assert!(result.starts_with(&expected_prefix));
    }

    #[test]
    fn ignores_blank_template() {
        let attempt_id = Uuid::nil();
        let result = generate_branch_name(Some("   "), "Task", &attempt_id);
        assert!(result.starts_with("forge-"));
    }
}
