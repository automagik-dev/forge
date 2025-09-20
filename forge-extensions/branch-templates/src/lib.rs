//! Forge branch templates extension

use uuid::Uuid;

/// Branch template service for generating branch names
pub struct BranchTemplateService {
    // TODO: Add configuration if needed
}

impl BranchTemplateService {
    pub fn new() -> Self {
        Self {}
    }

    /// Generate a branch name for a task attempt
    pub fn generate_branch_name(&self, task_title: &str, branch_template: Option<&str>, attempt_id: &Uuid) -> String {
        if let Some(template) = branch_template {
            // User-provided template with short UUID suffix for uniqueness
            format!("{}-{}", template, &attempt_id.to_string()[..4])
        } else {
            // Fallback to forge-{title}-{uuid} pattern
            let task_title_id = self.git_branch_id(task_title);
            format!(
                "forge-{}-{}",
                task_title_id,
                self.short_uuid(attempt_id)
            )
        }
    }

    /// Convert a string to a git-safe branch identifier
    fn git_branch_id(&self, input: &str) -> String {
        input
            .chars()
            .map(|c| match c {
                'a'..='z' | 'A'..='Z' | '0'..='9' | '-' => c,
                ' ' => '-',
                _ => '-',
            })
            .collect::<String>()
            .to_lowercase()
            .trim_matches('-')
            .to_string()
    }

    /// Generate a short UUID string
    fn short_uuid(&self, uuid: &Uuid) -> String {
        uuid.to_string()[..8].to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    #[test]
    fn test_generate_branch_name_with_template() {
        let service = BranchTemplateService::new();
        let attempt_id = Uuid::new_v4();
        let branch_name = service.generate_branch_name("Test Task", Some("feature/test"), &attempt_id);

        assert!(branch_name.starts_with("feature/test-"));
        assert_eq!(branch_name.len(), "feature/test-".len() + 4);
    }

    #[test]
    fn test_generate_branch_name_without_template() {
        let service = BranchTemplateService::new();
        let attempt_id = Uuid::new_v4();
        let branch_name = service.generate_branch_name("Test Task", None, &attempt_id);

        assert!(branch_name.starts_with("forge-test-task-"));
        assert_eq!(branch_name.len(), "forge-test-task-".len() + 8);
    }

    #[test]
    fn test_git_branch_id() {
        let service = BranchTemplateService::new();

        assert_eq!(service.git_branch_id("Hello World"), "hello-world");
        assert_eq!(service.git_branch_id("Test_Task_123"), "test_task_123");
        assert_eq!(service.git_branch_id("Special@Chars!"), "special-chars-");
    }
}