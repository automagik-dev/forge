// Branch template extension
// Will be populated in Task 2 with actual branch template functionality

pub fn placeholder() -> &'static str {
    "forge-extensions-branch-templates placeholder"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_placeholder() {
        assert_eq!(placeholder(), "forge-extensions-branch-templates placeholder");
    }
}