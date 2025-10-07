# Task D-03: Forge-App Binary Validation

**Wish:** @.genie/wishes/upgrade-upstream-0-0-104-wish.md
**Owner:** implementor
**Effort:** M
**Priority:** HIGH
**Files:** `forge-app/src/{main.rs,router.rs,services/mod.rs}`

---

## Setup (CRITICAL - Worktree Isolation Fix)

```bash
git submodule update --init --recursive
```

---

## Discovery

### Objective
Validate forge-app binary compiles and composes upstream + extensions correctly.

### Files
1. `main.rs` - Binary entry point
2. `router.rs` - Route composition (upstream + Forge routes)
3. `services/mod.rs` - Service composition

---

## Implementation

### Steps

1. **Initialize submodules:**
   ```bash
   git submodule update --init --recursive
   ```

2. **Compile:**
   ```bash
   cargo build -p forge-app
   ```

3. **Test server startup:**
   ```bash
   cargo run -p forge-app --bin forge-app &
   SERVER_PID=$!
   sleep 5
   curl http://localhost:$BACKEND_PORT/api/system/config
   kill $SERVER_PID
   ```

4. **Verify route registration:**
   - Check Omni routes present
   - Check config routes present
   - Check upstream routes intact

---

## Verification

### Success Criteria
- [ ] Compilation succeeds
- [ ] Server starts without errors
- [ ] Routes respond correctly

### Evidence
```bash
cargo build -p forge-app 2>&1 | tee .genie/wishes/upgrade-upstream-0-0-104/evidence/d-03-compile.txt
# Server startup logs in evidence/d-03-startup.txt
# Route test outputs in evidence/d-03-routes.txt
```
