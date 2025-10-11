# Task D-05: MCP Server Endpoints Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** qa
**Effort:** S
**Priority:** MEDIUM

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

---

## Discovery

### Objective
Validate all Forge MCP endpoints respond correctly against v0.0.105.

### Endpoints to Test
- `/api/forge/omni/status`
- `/api/forge/config`
- All standard MCP tools (list_projects, create_task, etc.)

---

## Implementation

```bash
git submodule update --init --recursive

# Start server
cargo run -p forge-app --bin forge-app &
SERVER_PID=$!
sleep 5

# Test Forge endpoints
curl http://localhost:$BACKEND_PORT/api/forge/omni/status
curl http://localhost:$BACKEND_PORT/api/forge/config

# Test standard MCP
curl http://localhost:$BACKEND_PORT/api/system/config

# Cleanup
kill $SERVER_PID
```

---

## Verification

### Success Criteria
- [ ] All endpoints respond
- [ ] JSON schemas valid
- [ ] No 404 errors

### Evidence
Save all endpoint responses to `.genie/wishes/upgrade-upstream-0-0-104/evidence/d-05-endpoints/`
