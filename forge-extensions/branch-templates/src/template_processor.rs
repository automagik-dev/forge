use anyhow::Result;
use regex::Regex;
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct BranchTemplateProcessor {
    template: String,
}

impl BranchTemplateProcessor {
    pub fn new(template: String) -> Self {
        Self { template }
    }

    /// Process a branch template with the given variables
    /// Supports {{variable}} syntax
    pub fn process(&self, variables: &HashMap<&str, &str>) -> Result<String> {
        let mut result = self.template.clone();

        // Replace {{variable}} patterns
        let re = Regex::new(r"\{\{([^}]+)\}\}")?;

        for capture in re.captures_iter(&self.template) {
            let full_match = &capture[0];
            let var_name = &capture[1];

            if let Some(&value) = variables.get(var_name.trim()) {
                result = result.replace(full_match, value);
            } else {
                // Leave unknown variables as-is or could return error
                // For now, leave as-is to be flexible
            }
        }

        Ok(result)
    }

    /// Validate that a template string is syntactically correct
    pub fn validate(&self) -> Result<()> {
        let re = Regex::new(r"\{\{([^}]+)\}\}")?;
        // Template is valid if regex compiles and matches don't have nested braces
        let nested_re = Regex::new(r"\{\{.*\{\{.*\}\}.*\}\}")?;
        if nested_re.is_match(&self.template) {
            return Err(anyhow::anyhow!("Nested template variables are not supported"));
        }
        Ok(())
    }

    /// Extract variable names from template
    pub fn extract_variables(&self) -> Result<Vec<String>> {
        let re = Regex::new(r"\{\{([^}]+)\}\}")?;
        let mut variables = Vec::new();

        for capture in re.captures_iter(&self.template) {
            variables.push(capture[1].trim().to_string());
        }

        // Remove duplicates while preserving order
        let mut seen = std::collections::HashSet::new();
        variables.retain(|v| seen.insert(v.clone()));

        Ok(variables)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_simple_template() {
        let processor = BranchTemplateProcessor::new("feature/{{task_id}}".to_string());

        let mut vars = HashMap::new();
        vars.insert("task_id", "123");

        let result = processor.process(&vars).unwrap();
        assert_eq!(result, "feature/123");
    }

    #[test]
    fn test_multiple_variables() {
        let processor = BranchTemplateProcessor::new("{{type}}/{{id}}-{{description}}".to_string());

        let mut vars = HashMap::new();
        vars.insert("type", "bugfix");
        vars.insert("id", "456");
        vars.insert("description", "login-issue");

        let result = processor.process(&vars).unwrap();
        assert_eq!(result, "bugfix/456-login-issue");
    }

    #[test]
    fn test_unknown_variables_left_as_is() {
        let processor = BranchTemplateProcessor::new("feature/{{task_id}}-{{unknown}}".to_string());

        let mut vars = HashMap::new();
        vars.insert("task_id", "123");

        let result = processor.process(&vars).unwrap();
        assert_eq!(result, "feature/123-{{unknown}}");
    }

    #[test]
    fn test_extract_variables() {
        let processor = BranchTemplateProcessor::new("{{type}}/{{id}}-{{type}}".to_string());
        let variables = processor.extract_variables().unwrap();
        assert_eq!(variables, vec!["type", "id"]);
    }

    #[test]
    fn test_validation() {
        let processor = BranchTemplateProcessor::new("valid/{{var}}".to_string());
        assert!(processor.validate().is_ok());

        let invalid_processor = BranchTemplateProcessor::new("invalid/{{nested{{var}}}}".to_string());
        assert!(invalid_processor.validate().is_err());
    }
}