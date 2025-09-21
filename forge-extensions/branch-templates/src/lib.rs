//! Branch template extension scaffold.

use serde::{Deserialize, Serialize};

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
}
