# 🧞 PER-AGENT MCP TOOL SELECTION WISH

**Status:** READY_FOR_REVIEW

## Executive Summary
Implement per-agent MCP tool selection by extending the existing agent profile structure, allowing each agent configuration to specify which MCP tools to use from the executor's available set, while preserving the complex existing MCP configuration architecture.

## Current State Analysis
**What exists:**
- MCP configuration per executor type with vastly different implementations:
  - Different config file locations (`~/.claude.json`, `~/.codex/config.toml`, `~/.config/amp/settings.json`, etc.)
  - Different config formats (JSON vs TOML)
  - Different config structures (`mcpServers` vs `mcp_servers` vs `amp.mcpServers` vs `mcp`)
  - Complex McpConfig system handling all these variations
- Agent profiles stored in profiles.json with ExecutorConfig structure
- Global MCP settings page per executor type at `/settings/mcp`

**Gap identified:** No way to customize MCP tool selection per individual agent configuration

**Solution approach:** Add MCP tool filtering at the **execution level** rather than configuration level, preserving all existing MCP architecture complexity while enabling per-agent tool selection

## Fork Safety Strategy
- **Isolation principle:** Only add optional fields to existing agent profiles structure, zero modifications to MCP system
- **Extension pattern:** Extend ExecutorConfig without touching complex MCP configuration handling
- **Upstream immunity:** Zero modifications to MCP config files, routes, executor implementations, or mcp_config.rs

## Success Criteria
✅ Each agent configuration can specify custom MCP tool selection during creation/editing
✅ Existing agents continue working without modification (backward compatible)
✅ Existing MCP configuration system remains completely unchanged and functional
✅ MCP tool filtering happens at execution time, preserving all format complexity (JSON/TOML/different paths)
✅ UI seamlessly integrates MCP tool selection into agent configuration form
✅ All executor types work regardless of their MCP format differences (Claude JSON, Codex TOML, Amp nested paths, etc.)
✅ No changes to existing MCP config files, McpConfig logic, or executor-specific handling

## Never Do (Upstream Protection)
❌ Modify existing MCP configuration system (mcp_config.rs, routes/config.rs MCP endpoints, McpConfig struct)
❌ Change existing executor MCP file formats, paths, or handling logic (Claude/.claude.json, Codex/.codex/config.toml, etc.)
❌ Break existing MCP settings page functionality at `/settings/mcp`
❌ Touch the complex executor-specific MCP config reading/writing logic (JSON/TOML differences)
❌ Modify existing agent profile core structure (only add optional fields)
❌ Change how executors read/write their diverse MCP config files
❌ Alter the get_mcp_config(), supports_mcp(), or default_mcp_config_path() methods

## Technical Architecture

### Component Structure
Backend:
├── crates/executors/src/profile.rs                   # Extend ExecutorConfig with selected_mcp_tools
├── crates/executors/src/mcp_filtering.rs             # NEW: MCP tool filtering logic
└── crates/executors/src/executors/mod.rs            # Add MCP filtering method to CodingAgent trait

Frontend:
├── frontend/src/components/ExecutorConfigForm.tsx    # Add MCP tool selection section
├── frontend/src/components/mcp/McpToolSelector.tsx   # NEW: Reusable MCP tool selector
└── frontend/src/hooks/useMcpTools.ts                 # NEW: Hook for available MCP tools per executor

### Naming Conventions
- **Field name:** `selected_mcp_tools: Option<Vec<String>>`
- **Components:** `McpToolSelector` (reusable component)
- **Logic:** `filter_available_mcp_tools()`, `apply_agent_mcp_filter()`
- **Types:** `SelectedMcpTools` interface

## Task Decomposition

### Dependency Graph
```
A[Profile Extension] ──► B[Filtering Logic] ──► D[UI Integration]
     │                        │                     │
     └──► C[Frontend Hooks] ──┴──────────────────► E[Testing]
```

### Group A: Profile Extension (Single Task)
Dependencies: None

**A1-profile-extension**: Extend ExecutorConfig with MCP tool selection
@crates/executors/src/profile.rs [context]
Creates: Extended `ExecutorConfig` struct with `selected_mcp_tools: Option<Vec<String>>`
Exports: Updated ExecutorConfig with optional MCP tool selection field
Success: Agent profiles can store per-agent MCP tool selections, completely backward compatible

### Group B: MCP Filtering Logic (After A1)
Dependencies: A1.profile-extension

**B1-filtering-interface**: Add MCP filtering method to CodingAgent trait
@A1:extended ExecutorConfig [required input]
@crates/executors/src/executors/mod.rs [integration point]
Creates: `filter_available_mcp_tools()` method in CodingAgent trait
Exports: Interface for agents to filter their available MCP tools
Success: All CodingAgent implementations can filter MCP tools based on agent selection

**B2-filtering-implementation**: Implement MCP tool filtering logic
@B1:filtering interface [required trait method]
@crates/executors/src/mcp_config.rs [pattern reference - DO NOT MODIFY]
Creates: `crates/executors/src/mcp_filtering.rs` - new isolated module
Exports: `apply_agent_mcp_filter()` function that works with all MCP formats
Success: Agent MCP filtering works with all executor types (JSON/TOML/different paths/different structures)

### Group C: Frontend Hooks & Components (After A1, Parallel to B)
Dependencies: A1.profile-extension

**C1-mcp-tools-hook**: Create hook for fetching available MCP tools per executor
@A1:extended ExecutorConfig [required types]
@frontend/src/lib/api.ts [API pattern reference]
Creates: `frontend/src/hooks/useMcpTools.ts`
Exports: `useMcpTools(executorType)` hook for fetching available tools per executor
Success: Hook provides available MCP tools for any executor type using existing MCP API

**C2-mcp-tool-selector**: Create reusable MCP tool selection component
@C1:useMcpTools hook [required data]
@frontend/src/pages/settings/McpSettings.tsx [pattern reference - DO NOT MODIFY]
Creates: `frontend/src/components/mcp/McpToolSelector.tsx`
Exports: `<McpToolSelector />` component for selecting MCP tools with search/filter
Success: Reusable component for MCP tool selection that works with any executor type

### Group D: UI Integration (After B & C)
Dependencies: All B and C tasks

**D1-executor-form-integration**: Add MCP tool selection to agent configuration form
@C2:McpToolSelector component [required component]
@B1:filtering interface [required backend logic]
@frontend/src/components/ExecutorConfigForm.tsx [integration point]
Modifies: Adds MCP tool selection section to agent configuration form
Success: Agent creation/editing includes MCP tool selection UI that shows available tools per executor

**D2-api-integration**: Wire up frontend to backend profile API
@D1:modified ExecutorConfigForm [required UI]
@B2:MCP filtering implementation [required backend]
@frontend/src/lib/api.ts [profiles API - existing]
Modifies: Extends existing profiles API calls to handle `selected_mcp_tools` field
Success: Agent MCP tool selections save and load correctly via existing profiles system

**D3-types-generation**: Generate updated TypeScript types
@A1:extended ExecutorConfig [required Rust types]
Runs: `pnpm run generate-types`
Validates: `selected_mcp_tools` appears in shared/types.ts ExecutorConfig interface
Success: Frontend uses generated types for MCP tool selection, no manual type duplication

### Group E: Testing & Validation (After D)
Dependencies: Complete integration

**E1-executor-compatibility**: Test MCP filtering with all executor types
@all previous outputs [complete feature]
Creates: Test scenarios covering all executor formats:
- Claude (JSON, ~/.claude.json, mcpServers path)
- Codex (TOML, ~/.codex/config.toml, mcp_servers path)
- Amp (JSON, ~/.config/amp/settings.json, amp.mcpServers path)
- Gemini (JSON, ~/.gemini/settings.json, mcpServers path)
- Opencode (JSON, XDG config, mcp path with $schema)
- Cursor (JSON, ~/.cursor/mcp.json, mcpServers path)
Success: All executor types work correctly with per-agent MCP filtering

**E2-backward-compatibility**: Verify existing functionality unchanged
@all previous outputs [complete feature]
Validates:
- All existing MCP settings pages work without changes
- Existing agent profiles work without MCP selection (use all tools)
- Complex MCP config reading/writing preserved across all formats
- McpConfig system completely unchanged
Success: Existing MCP functionality and agent system remain fully functional

## Implementation Examples

### Backend Profile Extension (Additive Only)
```rust
// crates/executors/src/profile.rs - EXTEND ONLY, NO BREAKING CHANGES
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
pub struct ExecutorConfig {
    #[serde(flatten)]
    pub configurations: HashMap<String, CodingAgent>,

    // NEW: Per-agent MCP tool selection (optional, completely backward compatible)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_mcp_tools: Option<Vec<String>>,
}

impl ExecutorConfig {
    /// Get MCP tools for this agent configuration
    pub fn get_selected_mcp_tools(&self) -> Option<&Vec<String>> {
        self.selected_mcp_tools.as_ref()
    }

    /// Set MCP tools for this agent configuration
    pub fn set_selected_mcp_tools(&mut self, tools: Option<Vec<String>>) {
        self.selected_mcp_tools = tools;
    }
}
```

### MCP Filtering Logic (New Isolated Module)
```rust
// crates/executors/src/mcp_filtering.rs - NEW FILE, ZERO RISK
use std::collections::HashMap;
use serde_json::Value;
use crate::mcp_config::McpConfig;

/// Apply agent-specific MCP tool filtering to any McpConfig
/// Works with all executor formats: JSON/TOML, different paths, different structures
pub fn apply_agent_mcp_filter(
    mcp_config: &mut McpConfig,
    agent_selected_tools: Option<&Vec<String>>
) {
    if let Some(selected_tools) = agent_selected_tools {
        // Get current servers from MCP config (works with all formats)
        let current_servers = mcp_config.servers.clone();

        // Filter to only include selected tools
        let filtered_servers: HashMap<String, Value> = current_servers
            .into_iter()
            .filter(|(tool_name, _)| selected_tools.contains(tool_name))
            .collect();

        // Update MCP config with filtered servers
        mcp_config.set_servers(filtered_servers);
    }
    // If no selection, use all available tools (backward compatibility)
}
```

### CodingAgent Trait Extension (Minimal Risk)
```rust
// crates/executors/src/executors/mod.rs - ADD METHOD TO EXISTING TRAIT
use crate::mcp_filtering::apply_agent_mcp_filter;

impl CodingAgent {
    /// Filter this agent's MCP config based on selected tools
    /// Preserves all existing MCP complexity while enabling per-agent filtering
    pub fn filter_available_mcp_tools(&self, agent_selected_tools: Option<&Vec<String>>) -> McpConfig {
        let mut mcp_config = self.get_mcp_config(); // Uses existing complex logic
        apply_agent_mcp_filter(&mut mcp_config, agent_selected_tools);
        mcp_config
    }
}
```

### Frontend MCP Tool Selector Component
```tsx
// frontend/src/components/mcp/McpToolSelector.tsx - NEW COMPONENT
interface McpToolSelectorProps {
  selectedTools: string[];
  onSelectionChange: (tools: string[]) => void;
  executorType: string;
  disabled?: boolean;
}

export function McpToolSelector({
  selectedTools,
  onSelectionChange,
  executorType,
  disabled = false
}: McpToolSelectorProps) {
  const { availableTools, loading, error } = useMcpTools(executorType);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = availableTools.filter(tool =>
    tool.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToolToggle = (toolName: string) => {
    if (disabled) return;

    const newSelection = selectedTools.includes(toolName)
      ? selectedTools.filter(t => t !== toolName)
      : [...selectedTools, toolName];
    onSelectionChange(newSelection);
  };

  if (loading) return <div>Loading available MCP tools for {executorType}...</div>;
  if (error) return <div>Error loading MCP tools: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          {selectedTools.length} of {availableTools.length} tools selected
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectionChange([])}
          disabled={selectedTools.length === 0 || disabled}
        >
          Clear All
        </Button>
      </div>

      <Input
        placeholder="Search MCP tools..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled}
      />

      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
        {filteredTools.map((tool) => (
          <div key={tool} className="flex items-center space-x-2">
            <Checkbox
              id={tool}
              checked={selectedTools.includes(tool)}
              onCheckedChange={() => handleToolToggle(tool)}
              disabled={disabled}
            />
            <Label htmlFor={tool} className="text-sm">
              {tool}
            </Label>
          </div>
        ))}
      </div>

      {selectedTools.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No tools selected - this agent will use all available MCP tools for {executorType}.
        </p>
      )}
    </div>
  );
}
```

### ExecutorConfigForm Integration (Minimal Risk)
```tsx
// frontend/src/components/ExecutorConfigForm.tsx - ADD SECTION TO EXISTING FORM
export function ExecutorConfigForm({ executor, value, onChange, onSave }: Props) {
  const [selectedMcpTools, setSelectedMcpTools] = useState<string[]>(
    value.selected_mcp_tools || []
  );

  const handleMcpToolsChange = (tools: string[]) => {
    setSelectedMcpTools(tools);
    onChange({
      ...value,
      selected_mcp_tools: tools.length > 0 ? tools : undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* existing executor configuration fields */}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-medium">MCP Tool Selection</Label>
          <p className="text-sm text-muted-foreground">
            Choose which MCP tools this agent configuration can access.
            Leave empty to use all available tools for the {executor} executor.
          </p>
        </div>

        <McpToolSelector
          selectedTools={selectedMcpTools}
          onSelectionChange={handleMcpToolsChange}
          executorType={executor}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}
```

### Available MCP Tools Hook
```typescript
// frontend/src/hooks/useMcpTools.ts - NEW HOOK USING EXISTING API
export function useMcpTools(executorType: string) {
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMcpTools = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use existing MCP API to get available tools for this executor
        const result = await mcpServersApi.load({
          executor: executorType as BaseCodingAgent,
        });

        // Extract tool names from the MCP config
        const toolNames = Object.keys(result.mcp_config.servers || {});
        setAvailableTools(toolNames);
      } catch (err: any) {
        if (err?.message && err.message.includes('does not support MCP')) {
          setAvailableTools([]); // Executor doesn't support MCP
        } else {
          setError(err?.message || 'Failed to load MCP tools');
        }
      } finally {
        setLoading(false);
      }
    };

    if (executorType) {
      fetchMcpTools();
    }
  }, [executorType]);

  return { availableTools, loading, error };
}
```

## Testing Protocol
```bash
# Backend validation - test with all executor format variations
cargo test -p executors mcp_filtering_claude      # Test Claude JSON format
cargo test -p executors mcp_filtering_codex       # Test Codex TOML format
cargo test -p executors mcp_filtering_amp         # Test Amp nested JSON format
cargo test -p executors mcp_filtering_opencode    # Test Opencode XDG format
cargo test -p executors mcp_filtering_gemini      # Test Gemini format
cargo test -p executors mcp_filtering_cursor      # Test Cursor format

# Frontend integration
pnpm run type-check
pnpm run lint

# Integration tests for each executor type with their specific MCP complexity
1. Configure agent with MCP tool selection for Claude (JSON, ~/.claude.json, mcpServers path)
2. Configure agent with MCP tool selection for Codex (TOML, ~/.codex/config.toml, mcp_servers path)
3. Configure agent with MCP tool selection for Amp (JSON, ~/.config/amp/settings.json, amp.mcpServers path)
4. Configure agent with MCP tool selection for Opencode (JSON, XDG config, mcp path with $schema)
5. Verify each agent only uses selected MCP tools while preserving all format complexity
6. Test existing agents continue working unchanged with all available tools
7. Verify existing MCP settings pages continue working for all executor types
```

## Validation Checklist
- [ ] All changes are purely additive (no modifications to existing MCP system)
- [ ] ExecutorConfig extension is optional and backward compatible
- [ ] Existing MCP configuration system completely unchanged (mcp_config.rs, McpConfig, all routes)
- [ ] All executor types work with their specific MCP formats (JSON/TOML/different paths/different structures)
- [ ] Existing agent configurations continue working without changes (use all tools by default)
- [ ] MCP tool filtering happens at execution time, preserving all configuration complexity
- [ ] UI integrates cleanly into existing ExecutorConfigForm without disruption
- [ ] TypeScript types auto-generate correctly from Rust changes
- [ ] No changes to existing MCP config file handling, reading, or writing logic
- [ ] Feature can be completely ignored (backward compatible)
- [ ] Fork isolation maintained (no upstream file modifications)
- [ ] Complex executor-specific MCP handling preserved (Claude/.claude.json vs Codex/.codex/config.toml vs Amp nested paths)

---

**Key Architectural Decision**: This approach respects the incredibly complex, heterogeneous MCP architecture by filtering at execution time rather than trying to modify the diverse configuration systems. Each executor keeps its unique MCP handling (JSON vs TOML, different paths, different structures) while gaining per-agent tool selection capability through a clean filtering layer.

**Critical Insight**: The MCP system is far more complex than initially apparent - every executor handles MCP differently (file locations, formats, config structures, path hierarchies). Our solution preserves this complexity entirely while adding the filtering capability as a separate concern.