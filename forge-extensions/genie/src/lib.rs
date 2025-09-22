//! Genie integration utilities and metadata helpers used by forge-app.

use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

use anyhow::{anyhow, bail, Context, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GenieConfig {
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GenieCommand {
    pub id: String,
    pub name: String,
    pub description: String,
    pub doc_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GenieWish {
    pub slug: String,
    pub title: String,
    pub status: Option<String>,
    pub doc_path: String,
}

pub fn connect(config: &GenieConfig) -> Result<String> {
    let provider = config.provider.trim();
    if provider.is_empty() {
        bail!("missing provider name");
    }
    Ok(format!("connected to {provider}"))
}

/// Load metadata for available Genie CLI commands from markdown documentation files.
pub fn list_commands<P: AsRef<Path>>(commands_dir: P) -> Result<Vec<GenieCommand>> {
    let dir = commands_dir.as_ref();
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut commands = Vec::new();
    for entry in
        fs::read_dir(dir).with_context(|| format!("reading commands dir {}", dir.display()))?
    {
        let path = entry?.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
            continue;
        }

        let raw = fs::read_to_string(&path)
            .with_context(|| format!("reading command doc {}", path.display()))?;

        commands.push(parse_command_doc(&path, &raw)?);
    }

    commands.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(commands)
}

/// Load metadata for Genie wishes from the genie/wishes directory.
pub fn list_wishes<P: AsRef<Path>>(wishes_dir: P) -> Result<Vec<GenieWish>> {
    let dir = wishes_dir.as_ref();
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut wishes = Vec::new();
    for entry in
        fs::read_dir(dir).with_context(|| format!("reading wishes dir {}", dir.display()))?
    {
        let path = entry?.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("md") {
            continue;
        }

        let raw = fs::read_to_string(&path)
            .with_context(|| format!("reading wish doc {}", path.display()))?;

        wishes.push(parse_wish_doc(&path, &raw)?);
    }

    wishes.sort_by(|a, b| a.slug.cmp(&b.slug));
    Ok(wishes)
}

fn parse_command_doc(path: &Path, raw: &str) -> Result<GenieCommand> {
    let mut lines = raw.lines();
    let title_line = lines
        .find(|line| !line.trim().is_empty())
        .ok_or_else(|| anyhow!("command doc {} is empty", path.display()))?;

    let (command_name, summary) = parse_command_heading(title_line)
        .with_context(|| format!("invalid command heading in {}", path.display()))?;

    let front_matter = extract_front_matter(raw);
    let description = front_matter
        .get("description")
        .cloned()
        .unwrap_or_else(|| summary.clone());

    Ok(GenieCommand {
        id: command_name.trim_start_matches('/').to_string(),
        name: command_name,
        description,
        doc_path: normalise_path(path),
    })
}

fn parse_wish_doc(path: &Path, raw: &str) -> Result<GenieWish> {
    let mut lines = raw.lines();
    let title_line = lines
        .find(|line| line.trim_start().starts_with('#'))
        .ok_or_else(|| anyhow!("wish doc {} missing title", path.display()))?;

    let title = title_line.trim_start_matches('#').trim().to_string();

    let status = raw
        .lines()
        .find_map(|line| line.trim().strip_prefix("**Status:**"))
        .map(|value| value.trim().trim_matches('*').to_string())
        .filter(|value| !value.is_empty());

    Ok(GenieWish {
        slug: path
            .file_stem()
            .and_then(|stem| stem.to_str())
            .unwrap_or_default()
            .to_string(),
        title,
        status,
        doc_path: normalise_path(path),
    })
}

fn parse_command_heading(line: &str) -> Option<(String, String)> {
    let trimmed = line.trim().trim_start_matches('#').trim();
    if !trimmed.starts_with('/') {
        return None;
    }

    let mut parts = trimmed.splitn(2, '-');
    let command = parts.next()?.trim().to_string();
    let summary = parts
        .next()
        .map(|value| value.trim().to_string())
        .unwrap_or_default();
    Some((command, summary))
}

fn extract_front_matter(raw: &str) -> HashMap<String, String> {
    let mut lines = raw.lines();
    // Skip the heading line
    lines.next();

    // Seek first "---" fence
    while let Some(line) = lines.next() {
        if line.trim() == "---" {
            break;
        }
        if !line.trim().is_empty() {
            // No front matter present
            return HashMap::new();
        }
    }

    let mut front_matter = HashMap::new();
    for line in lines.by_ref() {
        let trimmed = line.trim();
        if trimmed == "---" {
            break;
        }
        if let Some((key, value)) = trimmed.split_once(':') {
            front_matter.insert(key.trim().to_string(), value.trim().to_string());
        }
    }

    front_matter
}

fn normalise_path(path: &Path) -> String {
    path.components()
        .map(|comp| comp.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn connect_returns_provider() {
        let output = connect(&GenieConfig {
            provider: "claude".into(),
        })
        .unwrap();
        assert_eq!(output, "connected to claude");
    }

    #[test]
    fn parse_command_doc_extracts_metadata() {
        let tmp_dir = tempfile::tempdir().unwrap();
        let path = tmp_dir.path().join("forge.md");
        let mut file = fs::File::create(&path).unwrap();
        writeln!(
            file,
            "# /forge - Execute Wish\n---\ndescription: test description\n---\n"
        )
        .unwrap();

        let raw = fs::read_to_string(&path).unwrap();
        let command = parse_command_doc(&path, &raw).unwrap();
        assert_eq!(command.id, "forge");
        assert_eq!(command.name, "/forge");
        assert_eq!(command.description, "test description");
    }

    #[test]
    fn parse_wish_doc_reads_status() {
        let tmp_dir = tempfile::tempdir().unwrap();
        let path = tmp_dir.path().join("wish-example.md");
        let mut file = fs::File::create(&path).unwrap();
        writeln!(file, "# Wish Example\n\n**Status:** READY\n").unwrap();

        let raw = fs::read_to_string(&path).unwrap();
        let wish = parse_wish_doc(&path, &raw).unwrap();
        assert_eq!(wish.slug, "wish-example");
        assert_eq!(wish.status.as_deref(), Some("READY"));
    }
}
