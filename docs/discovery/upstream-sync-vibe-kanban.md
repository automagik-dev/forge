# Upstream Sync Discovery: forge-core ← BloopAI/vibe-kanban

**Comparison:** https://github.com/namastexlabs/forge-core/compare/main...BloopAI:vibe-kanban:main
**Gap:** 187 commits behind (v0.0.115 → v0.0.138)
**Date Range:** 2025-11-04 → 2025-12-16 (~6 weeks)
**Files Changed:** 300 total (284 in crates/)

---

## Council Advisory

| Member | Vote | Summary |
|--------|------|---------|
| nayr | REJECT | "You're a fork, not downstream. Monitor security only." |
| oettam | APPROVE w/ CONDITIONS | "3 critical perf fixes first, then cleanup." |
| jt | MODIFY | "~25 commits worth taking, skip ~160." |

**Verdict: 2/3 MODIFY** - Selective cherry-pick, not wholesale sync.

---

## Architecture Divergence Alert

**Upstream added 2 new crates forge-core doesn't have:**
- `crates/remote` (112 files) - Remote task sharing infrastructure
- `crates/review` - Remote review workflows

**Council initially said SKIP (local-first assumption). BUT user is heading SaaS direction with multi-users/team collaboration. RE-EVALUATE these crates.**

### SaaS Features to Re-Evaluate

| Feature | Commit | Relevance to Forge SaaS |
|---------|--------|-------------------------|
| Task sharing | #1210, #1379 | ✅ Team collaboration |
| Remote review | #1521 | ✅ PR review workflows |
| Multi-repo projects | #1516 | ✅ Monorepo support |
| ElectricSQL migration | #1379 | ✅ Real-time sync |
| OAuth improvements | #1354, #1419 | ✅ Multi-user auth |

---

## Commit Categorization by Version

### v0.0.116 (2025-11-06) - 5 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| 6ecf592c | Responsive overflow fix (#1193) | UI | SKIP (frontend) |
| 947cb53f | Edit branch name (#1182) | Git | EVALUATE |
| e2ca4083 | Fix path refresh (#1203) | Bug Fix | CHERRY-PICK |
| bcb9b4f0 | Handle width in task panel (#1202) | UI | SKIP (frontend) |
| eefad7e1 | chore: bump version 0.0.116 | Version | SKIP |

### v0.0.117 (2025-11-14) - 6 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| 31d90833 | CI for share (#1213) | CI | EVALUATE (team collab) |
| a0c22ab7 | **feat: share tasks (#1210)** | Feature | **EVALUATE (SaaS)** |
| 1ff0395c | VK_SHARED_API_BASE in prod builds (#1288) | Infra | SKIP (their branding) |
| e1f69e2a | Fix create PR gh helper i18n (#1290) | Bug Fix | EVALUATE |
| abf32424 | Remove auth from GitActionsDialog (#1291) | Auth | EVALUATE |
| 1f280f4e | VK_SHARED_API_BASE for Linux (#1292) | Infra | SKIP |

### v0.0.118 (2025-11-17) - 19 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| c49a008c | Bump Amp version (#1294) | Executor | EVALUATE |
| 49840a05 | Follow up area text scroll (#1295) | UI | SKIP |
| c4c1eb40 | Fix confirm retry spacing (#1296) | UI | SKIP |
| d02dbdcf | Larger tap target for logs (#1201) | UI | SKIP |
| 143a0f06 | Theme query param for release notes (#1258) | UI | SKIP |
| d683effc | Add email event (#1289) | Analytics | SKIP |
| c9178de3 | **Remove crypto from frontend (#1299)** | Cleanup | **CHERRY-PICK** |
| 99921f35 | Stop preview on shutdown (#1300) | Bug Fix | CHERRY-PICK |
| bb4136a1 | Verified changes (#1301) | Bug Fix | EVALUATE |
| d578b6f5 | Improve task creation dialog (#1007) | UI | SKIP |
| 124ebbf3 | Kanban card user icon (#1303) | UI | SKIP |
| 8579029a | Task tags docs (#1204) | Docs | SKIP |
| 6067dc69 | **SQLite append-only logs (#1276)** | Perf | **CHERRY-PICK CRITICAL** |
| 8fcc6f31 | Bump coding agents (#1302) | Executor | EVALUATE |
| a2df2334 | Typesafe dialogs (#1304) | TypeScript | SKIP (frontend) |
| 11f0bf7e | MCP context (#1185) | Feature | EVALUATE |
| aab01cb7 | Hiring README (#1306) | Docs | SKIP |
| aaaeccf2 | chore: bump 0.0.118 | Version | SKIP |

### v0.0.119 (2025-11-18) - 11 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| 5e7742da | Batch B: React Hooks fixes (#1307) | TypeScript | SKIP (frontend) |
| 870a166c | Batch A: 'any' types fix (#1310) | TypeScript | SKIP (frontend) |
| 41376eba | Batch C: UI 'any' types (#1312) | TypeScript | SKIP (frontend) |
| b35708e7 | Batch D Complete (#1313) | TypeScript | SKIP (frontend) |
| 9d8c0b28 | Hook invalidation fix (#1309) | Bug Fix | EVALUATE |
| 1dae217f | Frontend warnings (#1316) | TypeScript | SKIP |
| b04672d7 | CMD+shift+enter no start (#1317) | UI | SKIP |
| 81b92c6e | Frontend warnings final (#1319) | TypeScript | SKIP |
| 18ae6c5f | Refactor FeatureShowcase (#1308) | Refactor | SKIP |
| 0bd36a3b | Disable eslint-disable (#1321) | Lint | SKIP |
| 36bde0b4 | File naming rule (#1322) | Lint | SKIP |

### v0.0.120 (2025-11-18) - 4 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| fea5a1b7 | Bump Gemini (#1323) | Executor | EVALUATE |
| 79a3d262 | Bump Amp (#1324) | Executor | EVALUATE |
| 4eab641d | macOS runner fix (#1326) | CI | CHERRY-PICK |
| 7fb00530 | CreateAttemptDialog fix (#1329) | UI | SKIP |

### v0.0.121 (2025-11-19) - 11 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| 4e6dc179 | Tags in showcase (#1268) | UI | SKIP |
| 44351a89 | **Unify Git/Github interfaces (#1327)** | Refactor | **CHERRY-PICK** |
| 20b8de95 | Bump Amp (#1333) | Executor | EVALUATE |
| 85690d6a | **Cleanup dead code (#1336)** | Cleanup | **CHERRY-PICK** |
| 4b1af8cd | Editor availability (#1325) | UI | SKIP |
| 5ac6c2b4 | Touch scroll fix (#1334) | UI | SKIP |
| 23b0d9c0 | Fix ts compile (#1337) | TypeScript | EVALUATE |
| f3d963c2 | Add org events (#1339) | Analytics | SKIP |
| 84454b54 | **JWT access/refresh separation (#1315)** | Security | **CHERRY-PICK** |
| 6e5cb34f | Better worktree errors (#1338) | UX | CHERRY-PICK |
| 9a5323b3 | Prefer runtime VK_SHARED_API_BASE (#1340) | Infra | SKIP |

### v0.0.122 (2025-11-20) - 6 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| a3c134b4 | Bump Amp (#1344) | Executor | EVALUATE |
| 83602590 | Droid agent (#1318) | Feature | SKIP |
| 40252b6e | Bump Codex (#1345) | Executor | EVALUATE |
| c3755603 | VK_SHARED_API_BASE followup (#1342) | Infra | SKIP |
| 037302c6 | Multi-process MCP (#1343) | Feature | EVALUATE |
| 1933bb46 | Decouple git from github errors (#1347) | Refactor | CHERRY-PICK |

### v0.0.123 (2025-11-25) - 7 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| 37f8f3c7 | Gemini fixes (#1349) | Bug Fix | CHERRY-PICK |
| c2a10aaf | Copilot session resume (#1355) | Bug Fix | CHERRY-PICK |
| 44b7f749 | Auth redirect non-localhost (#1346) | Auth | EVALUATE |
| f651c64f | Text wrap toggle (#1219) | UI | SKIP |
| 1ef16241 | Pre-flight branch check (#1341) | Git | CHERRY-PICK |
| 036dd802 | Force push (#1350) | Git | CHERRY-PICK |
| bd93f140 | **Refactor container/deployments (#1351)** | Cleanup | **CHERRY-PICK** |

### v0.0.124-125 (2025-11-26-28) - 12 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| fd5ef916 | Agent availability onboarding (#1352) | UI | SKIP |
| b50f9ddc | Smooth Codex login (#1155) | UX | EVALUATE |
| b3a75914 | Fix Win compile (#1367) | Build | CHERRY-PICK |
| 581a4df6 | Bump Claude Code 2.0.53 (#1364) | Executor | EVALUATE |
| 6d281949 | Remove log truncation (#1368) | Bug Fix | CHERRY-PICK |
| 17e0acc9 | Bump Amp (#1372) | Executor | EVALUATE |
| b93cf5da | Parse tool_use_id (#1370) | Bug Fix | CHERRY-PICK |
| e6a55a9b | Bump Claude 2.0.54 (#1377) | Executor | EVALUATE |
| d430f374 | Strip remote prefix (#1373) | Git | CHERRY-PICK |
| ae9425b9 | **Async diff stream (#1376)** | Perf | **CHERRY-PICK CRITICAL** |
| 14fe26f7 | Claude subscription setting (#1229) | Feature | EVALUATE |
| 82d04642 | Fix push notification (#1389) | Bug Fix | EVALUATE |

### v0.0.126-127 (2025-12-02-03) - 13 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| c06c3a90 | Up Codex 0.63.0 (#1382) | Executor | EVALUATE |
| 34236c95 | Fix duplicate None/null (#1384) | Bug Fix | CHERRY-PICK |
| 770d8974 | Prevent TasksLayout unmount (#1391) | UI | SKIP |
| 1c380c70 | Fix custom Codex providers (#1393) | Bug Fix | CHERRY-PICK |
| e4e129a4 | **Revoke OAuth sessions (#1354)** | Security | **CHERRY-PICK** |
| e616bc3e | Debug to trace level (#1402) | Logging | EVALUATE |
| 2a965546 | Implementation complete (#1403) | Meta | SKIP |
| 6c7980eb | Cursor pointer fix (#1401) | UI | SKIP |
| d3317f68 | WYSIWYG editor (#1397) | Feature | EVALUATE (team docs) |
| 18637ab3 | Arrow key navigation (#1406) | UI | SKIP |
| edc532c0 | Image attachment bug (#1405) | Bug Fix | SKIP (WYSIWYG) |
| 60caf995 | No conversation found fix (#1400) | Bug Fix | CHERRY-PICK |
| a763a0ea | **ElectricSQL migration (#1379)** | Feature | **EVALUATE (real-time sync)** |

### v0.0.128-132 (2025-12-04-09) - 35 commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| b5c5aaa9 | Disable OAuth email dedup (#1419) | Auth | EVALUATE |
| e1cb2492 | WYSIWYG colors (#1412) | UI | SKIP |
| b6a4f76e | TypeScript/ESLint pass (#1427) | TypeScript | SKIP |
| fa4a8f9e | Task follow-up loading (#1430) | UI | SKIP |
| 7989168e | Bump Amp (#1422) | Executor | EVALUATE |
| 9bfaa6dd | Copy process logs button (#1429) | UI | SKIP |
| ef1ba1b4 | Glob copy files (#1420) | Feature | EVALUATE |
| 9f4fabc2 | **Agent interrupts (#1408)** | Feature | **EVALUATE (high interest)** |
| a369cec3 | Inject ENV into shell (#1426) | Feature | CHERRY-PICK |
| 8a91dba6 | Check prepare DB in CI (#1423) | CI | EVALUATE |
| 2b11040d | Upgrade Gemini and ACP (#1431) | Executor | EVALUATE |
| 92a65b4e | Switch to nightly (#1434) | Build | EVALUATE |
| 58aecc03 | Three changes applied (#1432) | Meta | SKIP |
| 63423f97 | Link visibility fix (#1418) | UI | SKIP |
| 32c689df | Setup/cleanup scripts (#1428) | Feature | EVALUATE |
| 89c0f1b0 | Revert (#1439) | Revert | SKIP |
| 86705f9c | Fix summary (#1441) | Bug Fix | EVALUATE |
| 9107b4b3 | GitHub comments WYSIWYG (#1449) | Feature | SKIP |
| 52c84f0c | i18n Chinese (#1438 squash) | i18n | SKIP |
| 77d4fcbf | fmt | Format | SKIP |
| e6a5694b | Fix i18n | i18n | SKIP |
| d72ec43d | **Auto approve plan mode (#1450)** | Feature | **EVALUATE (high interest)** |
| 757a4836 | i18n Chinese final (#1438) | i18n | SKIP |
| 7da884bc | ENV vars in executor profiles (#1444) | Feature | CHERRY-PICK |
| 76877ea6 | Setup script parallel (#1446) | Feature | EVALUATE |
| f045b3f9 | i18n missing keys (#1455) | i18n | SKIP |
| e28e2572 | Claude Opus variant (#1452) | Feature | CHERRY-PICK |
| 45d03591 | Agent Settings page (#1453) | UI | SKIP |
| 08d88483 | **Remove unused deps (#1462)** | Cleanup | **CHERRY-PICK** |
| 047695e5 | Settings nav previous (#1467) | UI | SKIP |
| 9c70858b | Draft PRs (#1460) | Feature | CHERRY-PICK |
| 0b1af7e3 | Bump Copilot-cli (#1469) | Executor | EVALUATE |
| a82c7e37 | GitHub comment overflow (#1465) | UI | SKIP |
| 8846e662 | Improve reset dialog (#1466) | UI | SKIP |
| 21d175bc | Notification sound (#1463) | Feature | SKIP |

### v0.0.133-138 (2025-12-09-16) - 40+ commits

| SHA | Description | Category | Action |
|-----|-------------|----------|--------|
| e83e0ee1 | MCP server expand tag (#1458) | Feature | EVALUATE |
| 1ee05ea8 | Normalize cursor todo (#1473) | Bug Fix | EVALUATE |
| aee6ac35 | Opencode ACP (#1471) | Feature | EVALUATE |
| d8eeab62 | Auto subtask from branch (#1468) | Feature | EVALUATE |
| 55ca4d36 | Auto-generate PR description (#1479) | Feature | CHERRY-PICK |
| 84d80659 | Normalize tool display (#1482) | Bug Fix | CHERRY-PICK |
| cbe27a75 | Update claude.md (#1484) | Docs | SKIP |
| 72c95262 | Change target branch running (#1474) | Feature | CHERRY-PICK |
| 85f6ee52 | **Gitignore-aware watching (#1399)** | Perf | **CHERRY-PICK CRITICAL** |
| b818f32b | Preserve preceding space (#1495) | UI | SKIP |
| 07e1b34a | Border around task form (#1492) | UI | SKIP |
| 2366e4ad | **Knip cleanup (#1499)** | Cleanup | **CHERRY-PICK** |
| 9688734e | **Remove unused DB queries (#1501)** | Cleanup | **CHERRY-PICK** |
| 5d5d882b | GPT-5.2 (#1503) | Executor | EVALUATE |
| a5eac1da | Stop button dev server (#1509) | Bug Fix | CHERRY-PICK |
| bb2404e1 | Upgrade Codex SDK (#1504) | Executor | EVALUATE |
| a07bebe3 | Queue button not disabled (#1533) | UI | SKIP |
| 0e57cf34 | Approvals ACP executors (#1511) | Feature | EVALUATE |
| fd9e5e5d | **Remote review (#1521)** | Feature | **EVALUATE (SaaS - new crate)** |
| 51bcd30d | Update prod URL | Infra | SKIP |
| 47a66651 | Reqwest fix (#1549) | Bug Fix | CHERRY-PICK |
| 8a623ee9 | Larger runner (#1552) | CI | SKIP |
| e16602cc | Downgrade version | Version | SKIP |
| 7f9f1433 | R2 binaries (#1554) | Infra | EVALUATE (SaaS infra) |
| 22ff27d8 | **Multi-repo projects (#1516)** | Feature | **EVALUATE (SaaS)** |
| ec8666da | Dev server working dir (#1559) | Feature | CHERRY-PICK |
| f989b474 | Branch fetching repo IDs (#1560) | Refactor | EVALUATE |
| 6900b1df | **Security: untrusted clone (#1564)** | Security | **CHERRY-PICK CRITICAL** |
| 2079c76c | In-app repo selection (#1565) | UI | SKIP |
| d58211f6 | Code compiles (#1558) | Meta | SKIP |
| 8eb38ec4 | Dev server working dir fix (#1568) | Bug Fix | CHERRY-PICK |
| b0be64ed | Repo name prefix fix (#1567) | Bug Fix | EVALUATE |
| 7f09d25a | Git actions modal overflow (#1566) | UI | SKIP |
| 4e158df3 | PR review payload fix (#1583) | Bug Fix | CHERRY-PICK |

---

## Summary by Action (Updated for SaaS Direction)

### CHERRY-PICK CRITICAL (5 commits) - Do First

| SHA | Description | Why Critical |
|-----|-------------|--------------|
| 6067dc69 | SQLite append-only logs | Eliminates lock contention |
| ae9425b9 | Async diff stream | Eliminates WebSocket timeouts |
| 85f6ee52 | Gitignore-aware watching | Fixes memory leak on pnpm |
| 6900b1df | Security: untrusted clone | Security vulnerability |
| 84454b54 | JWT token separation | Security improvement |

### CHERRY-PICK (26 commits) - High Value

Cleanup/Deletion (net negative LOC):
- c9178de3, 85690d6a, bd93f140, 08d88483, 2366e4ad, 9688734e

Bug Fixes:
- e2ca4083, 99921f35, 37f8f3c7, c2a10aaf, 1ef16241, 036dd802, b3a75914,
- 6d281949, b93cf5da, d430f374, 34236c95, 1c380c70, 60caf995, 47a66651,
- a5eac1da, 8eb38ec4, 4e158df3

Features Worth Taking:
- 44351a89 (git/github unify), 6e5cb34f (worktree errors), 1933bb46 (error decouple),
- a369cec3 (ENV injection), 7da884bc (profile ENV), e28e2572 (Opus variant),
- 9c70858b (draft PRs), 55ca4d36 (auto PR desc), 84d80659 (tool display),
- 72c95262 (target branch), ec8666da (dev server dir)

### EVALUATE - High Interest (User Specified)

| Feature | Commits | Notes |
|---------|---------|-------|
| **Executor bumps** | All Amp, Gemini, Claude, Codex | Newer versions, potential fixes |
| **Agent interrupts** | #1408 | Interrupt running agents |
| **Auto-approve plan mode** | #1450 | Streamlined approvals |

### EVALUATE - SaaS Features (Now Relevant)

| Feature | Commits | Why Relevant |
|---------|---------|--------------|
| **Task sharing** | #1210, #1379 | Team collaboration |
| **Remote review** | #1521 | PR review workflows (new crate!) |
| **Multi-repo projects** | #1516 | Monorepo/multi-repo support |
| **ElectricSQL migration** | #1379 | Real-time sync for teams |
| **WYSIWYG editor** | #1397 | Team documentation |
| **R2 binaries** | #1554 | SaaS infrastructure |

### SKIP (~90 commits) - Still Not Relevant

- All VK_SHARED branding commits
- All i18n commits (unless you want translations)
- All version bump commits (own versioning)
- Pure frontend UI polish (separate repo concern)

---

## Implementation Phases

### Phase 1: Critical Performance + Security (5 commits)
```bash
git cherry-pick 6067dc69  # SQLite append-only
git cherry-pick ae9425b9  # Async diff stream
git cherry-pick 85f6ee52  # Gitignore watching
git cherry-pick 6900b1df  # Security: clone safety
git cherry-pick 84454b54  # JWT separation
```

### Phase 2: Code Cleanup (6 commits)
```bash
git cherry-pick 85690d6a  # Dead code
git cherry-pick bd93f140  # Container refactor
git cherry-pick 08d88483  # Unused deps
git cherry-pick 2366e4ad  # Knip cleanup
git cherry-pick 9688734e  # DB query cleanup
git cherry-pick c9178de3  # Crypto removal
```

### Phase 3: Bug Fixes (15 commits)
Apply fixes for path refresh, worktree errors, git operations, etc.

### Phase 4: Executor Updates
Review each executor bump for compatibility:
- Claude Code: 2.0.53 → 2.0.55
- Amp: Multiple version bumps
- Gemini CLI: 0.16.0
- Codex SDK: 0.63.0+
- Copilot-cli bump
- GPT-5.2 addition

### Phase 5: High Interest Features
- Agent interrupts (#1408)
- Auto-approve plan mode (#1450)

### Phase 6: SaaS Foundation (Major Work)
**Requires careful planning - adds new crates!**

| Feature | Complexity | Dependencies |
|---------|------------|--------------|
| Task sharing (#1210) | Medium | New API endpoints |
| Remote review (#1521) | **High** | New `crates/remote` crate |
| Multi-repo (#1516) | **High** | Schema changes, UI changes |
| ElectricSQL (#1379) | **High** | Database migration |
| WYSIWYG (#1397) | Medium | Frontend-heavy |

**Recommendation:** Phase 6 should be a separate initiative after Phase 1-5 are stable.

---

## Files to Watch

**Will require manual adaptation:**
- `crates/services/src/services/filesystem_watcher.rs` (166→623 lines)
- `crates/db/src/models/execution_process_logs.rs` (schema change)
- `crates/services/src/services/auth.rs` (JWT changes)
- `crates/services/src/services/git.rs` (security fix)

**Do NOT add:**
- `crates/remote/` (entire crate - SaaS infra)
- `crates/review/` (entire crate - remote review)
