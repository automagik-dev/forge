# Task D: Backend Integration Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Group:** D - Backend validation
**Tracker:** `upgrade-upstream-0-0-104-task-d`
**Persona:** implementor
**Branch:** `feat/genie-framework-migration` (existing)
**Effort:** S

---

## Scope

Validate backend compatibility after upstream upgrade: type generation, MCP server, executor profiles, and new Copilot executor.

## Context

**Major Backend Changes:**
- MCP task_server.rs: 896 lines changed (-564/+364)
- New Copilot executor (+280 lines)
- Updated executor profiles (default_profiles.json)
- Updated task models (crates/db/src/models/task.rs)

## Inputs

- @crates/server/src/mcp/task_server.rs - MCP refactor
- @crates/executors/src/executors/copilot.rs - New executor
- @crates/executors/default_profiles.json - Updated profiles
- @.genie/wishes/upgrade-upstream-0-0-104-wish.md - Full context

## Deliverables

1. **Type Generation Validation:**
   - Core types: `cargo run -p server --bin generate_types -- --check`
   - Forge types: `cargo run -p forge-app --bin generate_forge_types -- --check`
   - Verify `shared/types.ts` and `shared/forge-types.ts` updated correctly

2. **MCP Server Tests:**
   - Start forge-app backend
   - Test MCP tools: `list_projects`, `create_task`, `update_task`
   - Capture JSON responses for comparison with baseline

3. **Executor Validation:**
   - Query `/api/executors/profiles`
   - Verify 8 executors present (including Copilot)
   - Confirm profile loading works

4. **Git Services Check:**
   - Verify worktree manager compatibility
   - Test git status, branch operations

## Task Breakdown

```
<task_breakdown>
1. [Discovery]
   - Review MCP refactor changes
   - Check new Copilot executor implementation
   - Examine executor profile changes

2. [Implementation]
   - Run type generation for core + forge
   - Start forge-app backend
   - Test MCP endpoints
   - Query executor profiles API
   - Validate git services

3. [Verification]
   - Compare with baseline-executors.json
   - Confirm all MCP tools functional
   - Verify Copilot executor appears in list
   - Check for errors in logs
</task_breakdown>
```

## Validation

```bash
# Type generation
cargo run -p server --bin generate_types -- --check
cargo run -p forge-app --bin generate_forge_types -- --check

# Start backend (background)
BACKEND_PORT=$(node scripts/setup-dev-environment.js backend) \
  cargo run -p forge-app --bin forge-app &
BACKEND_PID=$!
sleep 10  # Wait for startup

# Get port
BACKEND_PORT=$(cat dev_assets/backend_port 2>/dev/null || echo "3001")

# Test MCP via API (if exposed) or use Claude Code MCP
curl -s http://localhost:$BACKEND_PORT/api/system/config | jq .

# Executors API
curl -s http://localhost:$BACKEND_PORT/api/executors/profiles | jq 'keys | length'  # Should be 8
curl -s http://localhost:$BACKEND_PORT/api/executors/profiles | jq 'has("copilot")'  # Should be true

# Save responses
curl -s http://localhost:$BACKEND_PORT/api/executors/profiles > upgraded-executors.json

# Compare with baseline
diff baseline-executors.json upgraded-executors.json

# Kill backend
kill $BACKEND_PID
```

## Success Criteria

✅ Type generation succeeds (core + forge)
✅ Backend starts without errors
✅ MCP server responds correctly
✅ 8 executors present (Copilot included)
✅ Executor profiles load correctly
✅ No breaking changes in MCP tool signatures

## Never Do

❌ Skip type generation validation
❌ Proceed if MCP tools fail
❌ Ignore missing Copilot executor
❌ Forget to compare with baseline

## Dependencies

- Tasks A, B, C-01 through C-25 (all overrides refactored)

## Evidence

Store in: `.genie/wishes/upgrade-upstream-0-0-104/qa/task-d/`

- `type-gen-core.log`
- `type-gen-forge.log`
- `backend-startup.log`
- `mcp-responses/` (JSON files for each MCP tool)
- `upgraded-executors.json`
- `executor-diff.txt` (vs baseline)

## Follow-ups

- If MCP tools fail: Create blocker report, investigate refactor
- If Copilot missing: Check default_profiles.json merge
- After validation: Proceed to Task E (integration testing)
