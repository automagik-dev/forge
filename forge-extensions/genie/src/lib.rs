// Genie/Claude integration extension
// Will be populated in Task 2 with actual Genie functionality

pub fn placeholder() -> &'static str {
    "forge-extensions-genie placeholder"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_placeholder() {
        assert_eq!(placeholder(), "forge-extensions-genie placeholder");
    }
}