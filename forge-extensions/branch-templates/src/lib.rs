use regex::Regex;
use uuid::Uuid;

pub struct BranchTemplateService;

impl BranchTemplateService {
    pub fn new() -> Self {
        Self
    }

    /// Generate a branch name based on a template and task information
    pub fn generate_branch_name(
        &self,
        template: Option<&str>,
        task_title: &str,
        attempt_id: &Uuid,
    ) -> String {
        if let Some(template) = template {
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

    /// Convert text to a git-safe branch name
    fn git_branch_id(&self, text: &str) -> String {
        // Replace spaces and special chars with hyphens
        let re = Regex::new(r"[^a-zA-Z0-9-]").unwrap();
        let mut result = re.replace_all(text, "-").to_lowercase();
        
        // Remove consecutive hyphens
        let re = Regex::new(r"-+").unwrap();
        result = re.replace_all(&result, "-").to_string();
        
        // Trim hyphens from start and end
        result.trim_matches('-').to_string()
    }

    /// Generate short UUID for branch names
    fn short_uuid(&self, uuid: &Uuid) -> String {
        uuid.to_string()[..8].to_string()
    }

    /// Validate a branch template
    pub fn validate_template(&self, template: &str) -> bool {
        // Basic validation - should not contain spaces or special chars
        let re = Regex::new(r"^[a-zA-Z0-9/_-]+$").unwrap();
        re.is_match(template)
    }
}

impl Default for BranchTemplateService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_branch_name_with_template() {
        let service = BranchTemplateService::new();
        let attempt_id = Uuid::new_v4();
        
        let result = service.generate_branch_name(
            Some("feature/amazing-change"),
            "Amazing Change",
            &attempt_id,
        );
        
        assert!(result.starts_with("feature/amazing-change-"));
        assert_eq!(result.len(), "feature/amazing-change-".len() + 4);
    }

    #[test]
    fn test_generate_branch_name_without_template() {
        let service = BranchTemplateService::new();
        let attempt_id = Uuid::new_v4();
        
        let result = service.generate_branch_name(
            None,
            "Amazing Change",
            &attempt_id,
        );
        
        assert!(result.starts_with("forge-amazing-change-"));
        assert_eq!(result.len(), "forge-amazing-change-".len() + 8);
    }

    #[test]
    fn test_git_branch_id() {
        let service = BranchTemplateService::new();
        
        assert_eq!(service.git_branch_id("Hello World"), "hello-world");
        assert_eq!(service.git_branch_id("Test@123!"), "test-123");
        assert_eq!(service.git_branch_id("Multiple   Spaces"), "multiple-spaces");
        assert_eq!(service.git_branch_id("---Extra-Hyphens---"), "extra-hyphens");
    }

    #[test]
    fn test_validate_template() {
        let service = BranchTemplateService::new();
        
        assert!(service.validate_template("feature/new"));
        assert!(service.validate_template("bugfix/issue-123"));
        assert!(service.validate_template("hotfix/critical"));
        assert!(service.validate_template("feature/sub_feature"));
        
        assert!(!service.validate_template("feature new"));
        assert!(!service.validate_template("feature@new"));
        assert!(!service.validate_template("feature#new"));
    }
}