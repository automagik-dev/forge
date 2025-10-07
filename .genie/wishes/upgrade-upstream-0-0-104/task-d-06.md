# Task D-06: Git Services & Worktree Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** implementor
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
Validate worktree manager and executor profiles work with v0.0.105.

---

## Implementation

```bash
git submodule update --init --recursive

# Start server
cargo run -p forge-app --bin forge-app &
SERVER_PID=$!
sleep 5

# Check executors
curl http://localhost:$BACKEND_PORT/api/executors/profiles | jq 'keys | length'  # Should be 8
curl http://localhost:$BACKEND_PORT/api/executors/profiles | jq 'has("copilot")'  # Should be true

# Cleanup
kill $SERVER_PID
```

---

## Verification

### Success Criteria
- [ ] 8 executors present
- [ ] Copilot executor exists
- [ ] Worktree operations functional

### Evidence
```bash
curl http://localhost:$BACKEND_PORT/api/executors/profiles 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-06-executors.json
```
