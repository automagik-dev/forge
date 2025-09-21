// Omni notification system extension
// Will be populated in Task 2 with actual Omni functionality

pub fn placeholder() -> &'static str {
    "forge-extensions-omni placeholder"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_placeholder() {
        assert_eq!(placeholder(), "forge-extensions-omni placeholder");
    }
}