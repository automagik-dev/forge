use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

/// Genie Profile Discovery Service
///
/// Discovers and loads executor profiles from .genie folders in project workspaces.
/// This enables per-project agent customization.
use anyhow::{Context, Result};
use convert_case::{Case, Casing};
use executors::{
    executors::{BaseCodingAgent, CodingAgent},
    profile::{ExecutorConfig, ExecutorConfigs},
};
use serde::{Deserialize, Serialize};

/// Represents the new frontmatter schema with genie.* and forge.* namespaces
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentFrontmatter {
    /// Agent identifier (required)
    pub name: String,

    /// One-line description (required)
    pub description: Option<String>,

    /// UI color hint (optional)
    pub color: Option<String>,

    /// UI emoji (optional)
    pub emoji: Option<String>,

    /// Explicit Forge profile name override (optional)
    pub forge_profile_name: Option<String>,

    /// Orchestration configuration (genie namespace)
    #[serde(default)]
    pub genie: GenieConfig,

    /// Executor configuration (forge namespace)
    /// Can be either:
    /// 1. Flat config (legacy): `forge: { model: sonnet }`
    /// 2. Per-executor config: `forge: { CLAUDE_CODE: { model: sonnet }, CODEX: { ... } }`
    #[serde(default, deserialize_with = "deserialize_forge_config")]
    pub forge: ForgeConfigMap,
}

/// Orchestration settings (genie.* namespace)
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct GenieConfig {
    /// Executor type (CLAUDE_CODE, CODEX, OPENCODE, etc.)
    /// Can be a single string or an array of strings
    #[serde(default, deserialize_with = "deserialize_executor")]
    pub executor: Vec<String>,

    /// Profile variant name (e.g., DEFAULT, MASTER, REVIEW_STRICT_EVIDENCE)
    pub variant: Option<String>,

    /// Run in background mode (default: true)
    pub background: Option<bool>,
}

/// Custom deserializer to support both single executor and array
fn deserialize_executor<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;

    #[derive(Deserialize)]
    #[serde(untagged)]
    enum ExecutorValue {
        Single(String),
        Multiple(Vec<String>),
    }

    match ExecutorValue::deserialize(deserializer)? {
        ExecutorValue::Single(s) => Ok(vec![s]),
        ExecutorValue::Multiple(v) => {
            if v.is_empty() {
                Err(Error::custom("executor array cannot be empty"))
            } else {
                Ok(v)
            }
        }
    }
}

/// Map of executor-specific configurations
/// Key is executor name (CLAUDE_CODE, CODEX, etc.), value is config
#[derive(Debug, Clone, Default, Serialize)]
pub struct ForgeConfigMap {
    pub configs: HashMap<String, ForgeConfig>,
}

/// Custom deserializer to support both flat and per-executor forge configs
fn deserialize_forge_config<'de, D>(deserializer: D) -> Result<ForgeConfigMap, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Error;
    use serde_json::Value;

    let value = Value::deserialize(deserializer)?;

    match value {
        // Empty object
        Value::Object(ref map) if map.is_empty() => Ok(ForgeConfigMap::default()),

        // Check if it's a flat config (has known ForgeConfig fields) or per-executor config
        Value::Object(map) => {
            // Known ForgeConfig field names (flat config indicators)
            let flat_fields = [
                "model",
                "dangerously_skip_permissions",
                "sandbox",
                "dangerously_allow_all",
                "model_reasoning_effort",
                "yolo",
                "force",
                "allow_all_tools",
                "additional_params",
                "append_prompt",
                "claude_code_router",
                "plan",
                "approvals",
            ];

            // Check if any keys match known executor names (uppercase convention)
            let is_per_executor = map
                .keys()
                .any(|k| k.chars().all(|c| c.is_uppercase() || c == '_'));

            // Check if any keys are flat config fields
            let is_flat = map.keys().any(|k| flat_fields.contains(&k.as_str()));

            if is_per_executor && !is_flat {
                // Per-executor format: { CLAUDE_CODE: {...}, CODEX: {...} }
                let mut configs = HashMap::new();
                for (executor, config_value) in map {
                    let config: ForgeConfig = serde_json::from_value(config_value.clone())
                        .map_err(|e| {
                            Error::custom(format!("Invalid config for {executor}: {e}"))
                        })?;
                    configs.insert(executor, config);
                }
                Ok(ForgeConfigMap { configs })
            } else if is_flat && !is_per_executor {
                // Flat format (legacy): { model: sonnet, ... }
                // Apply to all executors
                let config: ForgeConfig = serde_json::from_value(Value::Object(map))
                    .map_err(|e| Error::custom(format!("Invalid flat config: {e}")))?;
                let mut configs = HashMap::new();
                configs.insert("*".to_string(), config); // Wildcard applies to all
                Ok(ForgeConfigMap { configs })
            } else if !is_flat && !is_per_executor {
                // Empty or unknown keys - treat as empty
                Ok(ForgeConfigMap::default())
            } else {
                // Mixed format - error
                Err(Error::custom(
                    "forge config cannot mix flat fields and per-executor keys. Use either flat format (forge: { model: sonnet }) or per-executor format (forge: { CLAUDE_CODE: { model: sonnet } })",
                ))
            }
        }
        _ => Err(Error::custom("forge config must be an object")),
    }
}

/// Executor-specific configuration (forge.* namespace)
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ForgeConfig {
    /// Model name (sonnet, opus, haiku, etc.)
    pub model: Option<String>,

    /// Skip permission checks (CLAUDE_CODE only)
    pub dangerously_skip_permissions: Option<bool>,

    /// Sandbox mode (CODEX only)
    pub sandbox: Option<String>,

    /// Allow all tools (AMP only)
    pub dangerously_allow_all: Option<bool>,

    /// Reasoning effort level (CODEX only)
    pub model_reasoning_effort: Option<String>,

    /// YOLO mode (GEMINI, QWEN_CODE)
    pub yolo: Option<bool>,

    /// Force mode (CURSOR_AGENT)
    pub force: Option<bool>,

    /// Allow all tools (COPILOT)
    pub allow_all_tools: Option<bool>,

    /// Additional parameters (OPENCODE, CODEX)
    pub additional_params: Option<Vec<HashMap<String, String>>>,

    /// Additional prompt text to append
    pub append_prompt: Option<String>,

    /// Enable router mode (CLAUDE_CODE)
    pub claude_code_router: Option<bool>,

    /// Enable plan mode
    pub plan: Option<bool>,

    /// Approval settings
    pub approvals: Option<serde_json::Value>,
}

/// Represents a discovered agent file
#[derive(Debug, Clone)]
pub struct AgentFile {
    /// Full path to the agent file
    pub file_path: PathBuf,

    /// Collective name (if in a collective), e.g., "code", "create"
    pub collective: Option<String>,

    /// Type: "agent" or "neuron"
    pub agent_type: AgentType,

    /// Namespaced key: "code/implementor", "neurons/master"
    pub namespaced_key: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AgentType {
    Agent,
    Neuron,
}

/// Represents a collective (directory with AGENTS.md marker)
#[derive(Debug, Clone)]
pub struct Collective {
    /// Collective ID (e.g., "code", "create")
    pub id: String,

    /// Agents directory path
    pub agents_dir: PathBuf,

    /// Context file path (AGENTS.md)
    pub context_file: PathBuf,
}

/// Main entry point for discovering .genie folders and loading profiles
pub struct GenieProfileLoader {
    workspace_root: PathBuf,
}

impl GenieProfileLoader {
    /// Create a new loader for the given workspace
    pub fn new(workspace_root: impl Into<PathBuf>) -> Self {
        Self {
            workspace_root: workspace_root.into(),
        }
    }

    /// Discover and load all .genie profiles from the workspace
    pub fn load_profiles(&self) -> Result<ExecutorConfigs> {
        // Step 1: Check if .genie folder exists
        let genie_root = self.workspace_root.join(".genie");
        if !genie_root.exists() {
            tracing::debug!("No .genie folder found in {:?}", self.workspace_root);
            return Ok(ExecutorConfigs {
                executors: HashMap::new(),
            });
        }

        tracing::info!("Discovering .genie profiles in {:?}", genie_root);

        // Step 2: Discover collectives
        let collectives = self.discover_collectives(&genie_root)?;
        tracing::debug!(
            "Found {} collectives: {:?}",
            collectives.len(),
            collectives.iter().map(|c| &c.id).collect::<Vec<_>>()
        );

        // Step 3: Scan agent/neuron files
        let agent_files = self.scan_agent_files(&genie_root, &collectives)?;
        tracing::info!("Found {} agent/neuron files", agent_files.len());

        // Step 4: Parse and generate profiles (one per executor)
        let mut executor_configs: HashMap<BaseCodingAgent, ExecutorConfig> = HashMap::new();

        for file in agent_files {
            match self.parse_and_generate_profiles(&file, &collectives) {
                Ok(profiles) => {
                    for (executor, variant_name, config) in profiles {
                        // Get or create executor config
                        let executor_config =
                            executor_configs
                                .entry(executor)
                                .or_insert_with(|| ExecutorConfig {
                                    configurations: HashMap::new(),
                                });

                        // Add variant
                        executor_config
                            .configurations
                            .insert(variant_name.clone(), config);
                        tracing::debug!(
                            "✓ Loaded {} → {}:{}",
                            file.namespaced_key,
                            executor,
                            variant_name
                        );
                    }
                }
                Err(e) => {
                    tracing::warn!("Failed to parse {}: {}", file.file_path.display(), e);
                }
            }
        }

        Ok(ExecutorConfigs {
            executors: executor_configs,
        })
    }

    /// Discover collectives (directories with AGENTS.md marker)
    fn discover_collectives(&self, genie_root: &Path) -> Result<Vec<Collective>> {
        let mut collectives = Vec::new();

        // Directories to ignore (everything except agents/, code/, create/, neurons/)
        // These are NOT collectives and should not be scanned:
        // - spells/ = reusable knowledge (not agents)
        // - workflows/ = automation scripts
        // - reports/ = execution logs
        // - state/ = runtime state
        // - product/ = product docs
        // - qa/ = quality assurance evidence
        // - wishes/ = feature requests
        // - scripts/ = helper scripts
        // - utilities/ = utility functions
        // - teams/ = team definitions
        // - specs/ = specifications
        // - .cache/ = cached data
        let ignore_dirs = [
            "spells",
            "workflows",
            "reports",
            "state",
            "product",
            "qa",
            "wishes",
            "scripts",
            "utilities",
            "teams",
            "specs",
            ".cache",
            "node_modules",
            ".git",
        ];

        // Scan .genie/ for directories with AGENTS.md
        let entries = fs::read_dir(genie_root)
            .context(format!("Failed to read .genie directory: {genie_root:?}"))?;

        for entry in entries.flatten() {
            if !entry.path().is_dir() {
                continue;
            }

            let dir_name = entry.file_name().to_string_lossy().to_string();
            if ignore_dirs.contains(&dir_name.as_str()) {
                continue;
            }

            let collective_root = entry.path();
            let agents_file = collective_root.join("AGENTS.md");

            // Check if AGENTS.md exists (marker for collective)
            if agents_file.exists() {
                collectives.push(Collective {
                    id: dir_name,
                    agents_dir: collective_root.join("agents"),
                    context_file: agents_file,
                });
            }
        }

        Ok(collectives)
    }

    /// Scan for agent and neuron files
    fn scan_agent_files(
        &self,
        genie_root: &Path,
        collectives: &[Collective],
    ) -> Result<Vec<AgentFile>> {
        let mut files = Vec::new();

        // 1. Scan global agents (.genie/agents/)
        let global_agents_dir = genie_root.join("agents");
        if global_agents_dir.exists() {
            files.extend(Self::scan_directory(
                &global_agents_dir,
                None,
                AgentType::Agent,
            )?);
        }

        // 2. Scan collective agents
        for collective in collectives {
            if collective.agents_dir.exists() {
                files.extend(Self::scan_directory(
                    &collective.agents_dir,
                    Some(collective.id.clone()),
                    AgentType::Agent,
                )?);
            }
        }

        // 3. Scan neurons (.genie/neurons/)
        let neurons_dir = genie_root.join("neurons");
        if neurons_dir.exists() {
            files.extend(Self::scan_directory(&neurons_dir, None, AgentType::Neuron)?);
        }

        Ok(files)
    }

    /// Scan a directory for .md files recursively
    fn scan_directory(
        dir: &Path,
        collective: Option<String>,
        agent_type: AgentType,
    ) -> Result<Vec<AgentFile>> {
        let mut files = Vec::new();

        let entries = fs::read_dir(dir).context(format!("Failed to read directory: {dir:?}"))?;

        for entry in entries.flatten() {
            let path = entry.path();

            // Skip non-agent directories (spells, workflows, teams, etc.)
            if path.is_dir() {
                let dir_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

                // Directories to exclude from agent scanning
                // Note: teams/ is included (will contain agent definitions in future)
                let excluded_dirs = [
                    "spells",
                    "workflows",
                    "specs",
                    "reports",
                    "state",
                    "product",
                    "qa",
                    "wishes",
                    "scripts",
                    "utilities",
                    ".cache",
                    "node_modules",
                    ".git",
                    "backups",
                ];

                if excluded_dirs.contains(&dir_name) {
                    tracing::debug!("Skipping non-agent directory: {}", path.display());
                    continue;
                }

                // Recursively scan subdirectories
                files.extend(Self::scan_directory(
                    &path,
                    collective.clone(),
                    agent_type.clone(),
                )?);
                continue;
            }

            // Only process .md files
            if path.extension().and_then(|s| s.to_str()) != Some("md") {
                continue;
            }

            // Skip README files (documentation, not agents)
            let name = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_string();

            if name.eq_ignore_ascii_case("README") || name.eq_ignore_ascii_case("AGENTS") {
                tracing::debug!("Skipping documentation file: {}", path.display());
                continue;
            }

            let namespaced_key = match (&collective, &agent_type) {
                (Some(coll), AgentType::Agent) => format!("{coll}/{name}"),
                (None, AgentType::Neuron) => format!("neurons/{name}"),
                (None, AgentType::Agent) => format!("agents/{name}"),
                (Some(_), AgentType::Neuron) => format!("neurons/{name}"), // shouldn't happen
            };

            files.push(AgentFile {
                file_path: path,
                collective: collective.clone(),
                agent_type: agent_type.clone(),
                namespaced_key,
            });
        }

        Ok(files)
    }

    /// Parse agent file and generate profile configurations (one per executor)
    fn parse_and_generate_profiles(
        &self,
        file: &AgentFile,
        collectives: &[Collective],
    ) -> Result<Vec<(BaseCodingAgent, String, CodingAgent)>> {
        // Read file content
        let content = fs::read_to_string(&file.file_path)
            .context(format!("Failed to read file: {:?}", file.file_path))?;

        // Extract frontmatter and body
        let (metadata, instructions) = self.extract_frontmatter(&content)?;

        // Load collective context if applicable
        let collective_context = if let Some(coll_id) = &file.collective {
            let collective = collectives.iter().find(|c| &c.id == coll_id);
            self.load_collective_context(collective)?
        } else {
            String::new()
        };

        // Build full instructions
        let full_instructions = if !collective_context.is_empty() {
            format!("{collective_context}\n\n---\n\n{instructions}")
        } else {
            instructions
        };

        // Get executors (array or default to CLAUDE_CODE)
        let executors = if metadata.genie.executor.is_empty() {
            vec!["CLAUDE_CODE".to_string()]
        } else {
            metadata.genie.executor.clone()
        };

        // Generate one profile per executor
        let mut profiles = Vec::new();

        for executor_str in executors {
            let executor = executor_str
                .parse::<BaseCodingAgent>()
                .context(format!("Invalid executor: {executor_str}"))?;

            // Determine variant name (same for all executors of this agent)
            let variant_name = metadata
                .forge_profile_name
                .clone()
                .or_else(|| Some(self.derive_variant_name(&metadata, file)))
                .unwrap_or_else(|| "GENIE".to_string());

            // Build CodingAgent configuration
            let config = self.build_coding_agent(&executor, &metadata, &full_instructions)?;

            profiles.push((executor, variant_name, config));
        }

        Ok(profiles)
    }

    /// Extract frontmatter and markdown body from content
    fn extract_frontmatter(&self, content: &str) -> Result<(AgentFrontmatter, String)> {
        let front_matter_regex =
            regex::Regex::new(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$").unwrap();

        let Some(captures) = front_matter_regex.captures(content) else {
            // No frontmatter, return minimal metadata
            return Ok((
                AgentFrontmatter {
                    name: "unknown".to_string(),
                    description: None,
                    color: None,
                    emoji: None,
                    forge_profile_name: None,
                    genie: GenieConfig::default(),
                    forge: ForgeConfigMap::default(),
                },
                content.to_string(),
            ));
        };

        let front_matter_yaml = &captures[1];
        let body = captures[2].trim().to_string();

        let metadata: AgentFrontmatter =
            serde_yaml::from_str(front_matter_yaml).context("Failed to parse frontmatter YAML")?;

        Ok((metadata, body))
    }

    /// Load collective context from AGENTS.md
    fn load_collective_context(&self, collective: Option<&Collective>) -> Result<String> {
        let Some(collective) = collective else {
            return Ok(String::new());
        };

        let content = fs::read_to_string(&collective.context_file).context(format!(
            "Failed to read collective context: {:?}",
            collective.context_file
        ))?;

        // Remove frontmatter if present
        let (_, body) = self.extract_frontmatter(&content)?;
        Ok(body)
    }

    /// Derive variant name from metadata and file info
    /// Includes project prefix to prevent name collisions when multiple projects are loaded
    fn derive_variant_name(&self, metadata: &AgentFrontmatter, file: &AgentFile) -> String {
        // Extract project name from workspace_root
        let project_prefix = self
            .workspace_root
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_case(Case::ScreamingSnake);

        // Build base name based on agent type
        let base_name = if file.agent_type == AgentType::Neuron {
            // Neurons: NAME
            metadata.name.to_case(Case::ScreamingSnake)
        } else if let Some(collective) = &file.collective {
            // Agents with collective: COLLECTIVE_NAME
            let collective_prefix = collective.to_case(Case::ScreamingSnake);
            let agent_name = metadata.name.to_case(Case::ScreamingSnake);
            format!("{collective_prefix}_{agent_name}")
        } else {
            // Global agents: NAME
            metadata.name.to_case(Case::ScreamingSnake)
        };

        // Prefix with project name to ensure uniqueness across projects
        format!("{project_prefix}_{base_name}")
    }

    /// Build CodingAgent from metadata
    fn build_coding_agent(
        &self,
        executor: &BaseCodingAgent,
        metadata: &AgentFrontmatter,
        instructions: &str,
    ) -> Result<CodingAgent> {
        // Build base config with append_prompt
        let mut base_json = serde_json::json!({
            "append_prompt": instructions,
        });

        // Get executor-specific config, falling back to wildcard "*"
        let executor_str = executor.to_string();
        let forge_config = metadata
            .forge
            .configs
            .get(&executor_str)
            .or_else(|| metadata.forge.configs.get("*"));

        // Add forge.* fields to the config (if config exists for this executor)
        if let Some(config) = forge_config {
            if let Some(model) = &config.model {
                base_json["model"] = serde_json::json!(model);
            }
            if let Some(skip_perms) = config.dangerously_skip_permissions {
                base_json["dangerously_skip_permissions"] = serde_json::json!(skip_perms);
            }
            if let Some(sandbox) = &config.sandbox {
                base_json["sandbox"] = serde_json::json!(sandbox);
            }
            if let Some(allow_all) = config.dangerously_allow_all {
                base_json["dangerously_allow_all"] = serde_json::json!(allow_all);
            }
            if let Some(reasoning) = &config.model_reasoning_effort {
                base_json["model_reasoning_effort"] = serde_json::json!(reasoning);
            }
            if let Some(yolo) = config.yolo {
                base_json["yolo"] = serde_json::json!(yolo);
            }
            if let Some(force) = config.force {
                base_json["force"] = serde_json::json!(force);
            }
            if let Some(allow_tools) = config.allow_all_tools {
                base_json["allow_all_tools"] = serde_json::json!(allow_tools);
            }
            if let Some(params) = &config.additional_params {
                base_json["additional_params"] = serde_json::json!(params);
            }
            if let Some(router) = config.claude_code_router {
                base_json["claude_code_router"] = serde_json::json!(router);
            }
            if let Some(plan) = config.plan {
                base_json["plan"] = serde_json::json!(plan);
            }
            if let Some(approvals) = &config.approvals {
                base_json["approvals"] = approvals.clone();
            }
        }

        // Construct the executor-specific config
        let config_json = serde_json::json!({
            executor.to_string(): base_json
        });

        // Deserialize into CodingAgent
        let config: CodingAgent = serde_json::from_value(config_json).context(format!(
            "Failed to build CodingAgent for executor {executor}"
        ))?;

        Ok(config)
    }
}
