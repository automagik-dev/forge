# 🧞 Genie Framework Migration Plan

**Status:** APPROVED - Ready for execution
**Source:** `research/automagik-genie` → `automagik-forge`
**Objective:** Upgrade to latest Genie framework while adapting context from "genie development" to "forge development"

## Migration Principles

1. **Bring Everything**: Full CLI implementation in-repo until npm publish
2. **Intelligent Merge**: Don't copy blindly - adapt patterns and context
3. **Context Transform**: Change "genie development" context to "forge development" context
4. **Learn & Enhance**: Use new patterns to improve existing forge agents
5. **Clean Later**: Keep everything working now, remove `.genie/agents.old/` at end

## Phase 1: Foundation Files ✅ APPROVED

### 1.1 Root Documentation

#### AGENTS.md
- **Current**: 607 lines with forge-specific content
- **Upstream**: 575 lines domain-agnostic framework
- **Action**:
  - Merge upstream framework sections (behavioral learnings, orchestration patterns)
  - **PRESERVE** forge-specific tech stack (Rust, React, SQLx, etc.)
  - **PRESERVE** automagik-forge architecture overview
  - Add new patterns: Evidence-Based Challenge Protocol, Forge MCP Task Pattern
- **Priority**: HIGH

#### CLAUDE.md
- **Current**: Forge-specific AI assistant guidelines
- **Upstream**: Framework patterns and protocols
- **Action**:
  - Integrate new behavioral guidelines
  - Merge Evidence-Based Challenge Protocol
  - Add Forge MCP Task Pattern
  - Keep forge context throughout
- **Priority**: HIGH

#### README.md
- **Decision**: NOT MIGRATING - Keep current forge README as-is

### 1.2 .genie Core Structure

#### .genie/README.md
- **Action**: Copy from upstream, adapt intro paragraph to reference "automagik-forge"
- **Changes needed**: Replace generic project references with forge context
- **Priority**: MEDIUM

## Phase 2: Agent Migration Strategy

### Agent Mapping & Context Transformation

| Old (agents.old/) | New (upstream) | Merge Strategy | Context Changes |
|-------------------|----------------|----------------|-----------------|
| `forge-coder.md` | `implementor.md` | Merge patterns, keep forge context | "Implement genie features" → "Implement forge features" |
| `forge-tests.md` | `tests.md` | Merge test strategies | "Test genie code" → "Test forge (Rust + React) code" |
| `forge-qa-tester.md` | `qa.md` | Merge QA patterns | Adapt to forge's tech stack |
| `forge-quality.md` | `polish.md` | Merge quality checks | Rust/TS linting patterns |
| `forge-master.md` | `forge.md` | Rename & enhance | Keep forge task orchestration logic |
| `forge-self-learn.md` | `self-learn.md` | Merge learning patterns | Forge-specific violation examples |
| `forge-hooks.md` | *NEW* | Keep as forge-specific | No upstream equivalent |

### New Agents to Integrate

**Core Workflow** (`.genie/agents/`):
- [ ] `plan.md` - Product planning orchestrator
- [ ] `wish.md` - Wish creation agent
- [ ] `forge.md` - Execution breakdown (REPLACES forge-master)
- [ ] `review.md` - QA validation agent

**Specialists** (`.genie/agents/specialists/`):
- [ ] `implementor.md` → **MERGE WITH** `forge-coder.md`
- [ ] `tests.md` → **MERGE WITH** `forge-tests.md`
- [ ] `qa.md` → **MERGE WITH** `forge-qa-tester.md`
- [ ] `polish.md` → **MERGE WITH** `forge-quality.md`
- [ ] `self-learn.md` → **MERGE WITH** `forge-self-learn.md`
- [ ] `bug-reporter.md` - NEW
- [ ] `genie-qa.md` - NEW (adapt to "forge-qa")
- [ ] `git-workflow.md` - NEW
- [ ] `learn.md` - NEW (meta-learning)
- [ ] `project-manager.md` - NEW
- [ ] `sleepy.md` - NEW (autonomous execution)

**Utilities** (`.genie/agents/utilities/`):
- [ ] `analyze.md` - Architecture analysis
- [ ] `challenge.md` - Assumption breaking
- [ ] `codereview.md` - Diff review
- [ ] `commit.md` - Commit message generation
- [ ] `consensus.md` - Decision facilitation
- [ ] `debug.md` - Root cause investigation
- [ ] `docgen.md` - Documentation generation
- [ ] `identity-check.md` - Agent identity verification
- [ ] `install.md` - Framework installation (adapt to forge)
- [ ] `prompt.md` - Prompt refinement
- [ ] `refactor.md` - Refactoring planning
- [ ] `secaudit.md` - Security audit
- [ ] `testgen.md` - Test generation
- [ ] `thinkdeep.md` - Extended reasoning
- [ ] `tracer.md` - Instrumentation planning
- [ ] `twin.md` - Pressure-testing & second opinions

### Context Transformation Guidelines

**Replace Throughout:**
- "genie development" → "forge development"
- "genie features" → "forge features"
- "genie codebase" → "forge codebase"
- Generic examples → Forge-specific examples (Rust/React/SQLx)

**Preserve:**
- Forge's tech stack context (Rust, Axum, React, SQLx, SQLite)
- Forge's MCP server implementation
- Forge's task execution model
- Forge's worktree management

**Enhance:**
- Add forge-specific validation commands (cargo test, pnpm check)
- Add forge-specific file paths
- Add forge-specific architectural patterns

## Phase 3: Directory Structure

### 3.1 Essential Directories

#### .genie/agents/ ⭐ HIGHEST PRIORITY
```
.genie/agents/
├── plan.md                    # NEW from upstream
├── wish.md                    # NEW from upstream
├── forge.md                   # REPLACES forge-master.md
├── review.md                  # NEW from upstream
├── specialists/
│   ├── implementor.md         # MERGE with forge-coder.md
│   ├── tests.md              # MERGE with forge-tests.md
│   ├── qa.md                 # MERGE with forge-qa-tester.md
│   ├── polish.md             # MERGE with forge-quality.md
│   ├── self-learn.md         # MERGE with forge-self-learn.md
│   ├── forge-hooks.md        # KEEP (forge-specific)
│   ├── bug-reporter.md       # NEW
│   ├── genie-qa.md → forge-qa.md  # NEW, rename for context
│   ├── git-workflow.md       # NEW
│   ├── learn.md              # NEW
│   ├── project-manager.md    # NEW
│   └── sleepy.md             # NEW
└── utilities/
    ├── analyze.md            # NEW
    ├── challenge.md          # NEW
    ├── codereview.md         # NEW
    ├── commit.md             # NEW
    ├── consensus.md          # NEW
    ├── debug.md              # NEW
    ├── docgen.md             # NEW
    ├── identity-check.md     # NEW
    ├── install.md            # NEW, adapt to forge
    ├── prompt.md             # NEW
    ├── refactor.md           # NEW
    ├── secaudit.md           # NEW
    ├── testgen.md            # NEW
    ├── thinkdeep.md          # NEW
    ├── tracer.md             # NEW
    └── twin.md               # NEW
```

**Actions**:
1. Copy upstream structure
2. For each MERGE: Read both files, extract best patterns, combine with forge context
3. Adapt all examples to forge tech stack
4. Test each agent after migration

#### .genie/instructions/
```
.genie/instructions/
├── core/
│   ├── analyze-product.md
│   ├── create-spec.md
│   ├── create-tasks.md
│   ├── execute-task.md
│   ├── execute-tasks.md
│   ├── plan-product.md
│   └── post-execution-tasks.md
└── meta/
    ├── post-flight.md
    └── pre-flight.md
```

**Actions**:
1. Copy entire directory
2. Review each file for "genie" → "forge" context
3. Adapt examples to forge workflows

#### .genie/guides/
```
.genie/guides/
└── getting-started.md
```

**Actions**:
1. Copy getting-started.md
2. Adapt to forge onboarding
3. Add forge-specific setup steps

### 3.2 Product & Standards

#### .genie/product/
**Current**: Info scattered in AGENTS.md/CLAUDE.md
**Action**:
1. Create directory structure
2. Extract from current docs:
   - Mission statement
   - Tech stack overview
   - Roadmap
   - Environment config
3. Organize into separate files

#### .genie/standards/
**Current**: Embedded in AGENTS.md
**Action**:
1. Create `code-style/` subdirectory
2. Extract coding standards from AGENTS.md
3. Organize by language (rust.md, typescript.md)

### 3.3 Infrastructure

#### .genie/cli/ ⭐ HIGH PRIORITY (Full Implementation)
```
.genie/cli/
├── src/
│   ├── cli-core/
│   │   └── handlers/
│   ├── commands/
│   ├── executors/
│   ├── lib/
│   ├── types/
│   ├── view/
│   └── views/
├── dist/            # Build output
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

**Actions**:
1. Copy entire directory structure
2. Keep package.json (needed until npm publish)
3. Test CLI locally: `./genie --help`
4. Verify all commands work with forge context
5. **Note**: Will clean up package.json later when publishing to npm

#### .genie/mcp/
**Current**: Forge has built-in MCP server
**Upstream**: Standalone MCP implementation

**Merge Strategy**:
1. Copy upstream MCP directory
2. Review for patterns to enhance forge's MCP
3. Keep both implementations for now
4. Document differences in MCP integration
5. Consider unification in future iteration

#### .genie/benchmark/
**Action**: Copy if exists, low priority

### 3.4 Keep Existing ✅

#### .genie/reports/
- Already exists with valuable Done Reports
- Keep as-is
- Ensure new agents use same format

#### .genie/wishes/
- Already exists with active work
- Keep all existing wishes
- Update template for new wishes to match upstream format

## Phase 4: .claude Integration

### 4.1 Commands
**Current**: `.claude/commands/` with basic structure
**Upstream**: Comprehensive commands referencing `.genie/agents/`

**Actions**:
1. Copy upstream command structure
2. Update all `@include` references to point to new `.genie/agents/` locations
3. Add forge-specific commands if needed
4. Test each command

### 4.2 Agents
**Current**: `.claude/agents/` with some definitions
**Upstream**: Simplified aliases using `@include` pattern

**Actions**:
1. Refactor to avoid duplication
2. Use `@include` pattern to reference `.genie/agents/`
3. Remove duplicate agent definitions
4. Maintain forge-specific agent configurations

## Phase 5: Tooling & Scripts

### 5.1 CLI Executable
**Action**: Copy `./genie` executable from upstream

### 5.2 Package Dependencies
**Action**:
1. Copy `package.json` and `pnpm-lock.yaml`
2. Install dependencies: `pnpm install`
3. Test CLI: `./genie --help`
4. **Note**: These will be cleaned up when publishing to npm

### 5.3 Scripts Directory
**Action**: Copy any utility scripts from upstream `.genie/cli/` if useful

## Agent Merge Methodology

### Example: forge-coder.md → implementor.md

**Step-by-step process**:

1. **Read Both Files**
   ```bash
   # Current
   cat .genie/agents.old/forge-coder.md

   # Upstream
   cat research/automagik-genie/.genie/agents/specialists/implementor.md
   ```

2. **Extract Patterns**
   - Upstream: General implementation patterns, TDD flow, evidence requirements
   - Current: Forge-specific context, worktree management, task execution

3. **Merge Strategy**
   - Use upstream's structure (better organized)
   - Keep forge-specific commands (cargo test, pnpm check)
   - Integrate upstream's TDD patterns
   - Add forge-specific validation steps
   - Transform context: "genie features" → "forge features"

4. **Create New File**
   ```markdown
   # /implementor – Forge Feature Implementation Specialist

   [Upstream structure]
   + [Forge-specific context]
   + [Forge validation commands]
   + [Forge architecture patterns]
   ```

5. **Test Agent**
   - Verify agent can be invoked
   - Test with sample forge task
   - Validate output matches forge patterns

6. **Document Changes**
   - Note what was merged
   - Highlight forge-specific additions
   - Mark for review

**Repeat for each agent pair**

## Execution Phases

### ⚡ Phase 1: Critical Path (Week 1)
**Goal**: Core functionality working

- [ ] 1. Copy `.genie/agents/` structure (plan, wish, forge, review)
- [ ] 2. Merge `implementor.md` (forge-coder + upstream implementor)
- [ ] 3. Merge `tests.md` (forge-tests + upstream tests)
- [ ] 4. Copy `.genie/cli/` full implementation
- [ ] 5. Copy `./genie` executable and package.json
- [ ] 6. Test CLI: `./genie run implementor "test task"`
- [ ] 7. Update AGENTS.md with new framework sections
- [ ] 8. Update CLAUDE.md with new patterns

### 🔧 Phase 2: Specialist Completion (Week 2)
**Goal**: All specialists migrated

- [ ] 9. Merge `qa.md` (forge-qa-tester + upstream qa)
- [ ] 10. Merge `polish.md` (forge-quality + upstream polish)
- [ ] 11. Merge `self-learn.md` (forge-self-learn + upstream self-learn)
- [ ] 12. Integrate NEW specialists: bug-reporter, git-workflow, project-manager, sleepy, learn
- [ ] 13. Adapt `genie-qa.md` → `forge-qa.md`
- [ ] 14. Keep `forge-hooks.md` as-is (forge-specific)

### 🛠️ Phase 3: Utilities & Instructions (Week 3)
**Goal**: Full utility library available

- [ ] 15. Copy all utilities (analyze, twin, debug, etc.)
- [ ] 16. Adapt context for each utility
- [ ] 17. Copy `.genie/instructions/` (core + meta)
- [ ] 18. Adapt instruction context to forge
- [ ] 19. Copy `.genie/guides/getting-started.md`
- [ ] 20. Create `.genie/product/` directory with extracted docs

### 📦 Phase 4: Integration & Testing (Week 4)
**Goal**: Everything working together

- [ ] 21. Update all `.claude/commands/` to reference new structure
- [ ] 22. Update all `.claude/agents/` to use `@include` pattern
- [ ] 23. Test complete workflow: `/plan` → `/wish` → `/forge` → `/review`
- [ ] 24. Verify all CLI commands work
- [ ] 25. Review and merge `.genie/mcp/` patterns
- [ ] 26. Create `.genie/standards/code-style/` with extracted standards

### 🧹 Phase 5: Cleanup (Week 5)
**Goal**: Remove old structure, finalize

- [ ] 27. Test all agents thoroughly
- [ ] 28. Archive `.genie/agents.old/` → `.genie/archive/agents.old-backup/`
- [ ] 29. Remove archived agents if all working
- [ ] 30. Document migration in CHANGELOG
- [ ] 31. Update all existing wishes to reference new agent paths
- [ ] 32. Final integration test of complete system

## Context Transformation Checklist

For each file during migration, ensure:

- [ ] Replace "genie" with "forge" in context (not in framework names)
- [ ] Update tech stack references (add Rust, Axum, React, SQLx)
- [ ] Replace example commands with forge equivalents
- [ ] Update file paths to forge structure
- [ ] Preserve forge-specific patterns (worktrees, MCP tasks)
- [ ] Add forge-specific validation steps
- [ ] Update architecture references
- [ ] Maintain forge terminology

## Success Criteria

### ✅ Phase 1 Complete When:
- CLI working: `./genie --help` shows commands
- Core workflow agents loadable
- Can merge at least one agent pair successfully
- AGENTS.md updated with framework sections

### ✅ Phase 2 Complete When:
- All old agents have new counterparts
- All specialists accessible via CLI
- Forge-specific context preserved in all agents

### ✅ Phase 3 Complete When:
- All utilities available and adapted
- Instructions adapted to forge context
- Product documentation organized

### ✅ Phase 4 Complete When:
- Complete workflow executable: `/plan` → `/wish` → `/forge` → `/review`
- All `.claude/` integrations updated
- All agents tested with forge tasks

### ✅ Migration Complete When:
- Old agents archived/removed
- All tests passing
- Documentation updated
- Team trained on new structure
- No references to old agent paths

## Rollback Plan

If migration encounters critical issues:

1. **Preserve Old Structure**: Keep `.genie/agents.old/` until fully validated
2. **Git Branches**: Do migration work on `feat/genie-framework-migration`
3. **Incremental Testing**: Test each phase before proceeding
4. **Documentation**: Document any blocking issues immediately
5. **Fallback**: Can revert to old agents if new ones fail

## Notes & Decisions

### Key Decisions Made:
1. ✅ Bring full CLI implementation (including package.json, will clean later)
2. ✅ Intelligent merge of agents (not blind copy)
3. ✅ Transform context: genie dev → forge dev
4. ✅ Keep README.md as-is (no migration)
5. ✅ Archive agents.old/ at end (not during migration)

### Open Questions:
- [ ] How to handle MCP integration differences?
- [ ] Should we rename some utilities for clarity?
- [ ] Timeline for npm publish (when to clean package.json)?

## Next Immediate Actions

**Ready to start? Begin with:**

1. Create branch: `git checkout -b feat/genie-framework-migration`
2. Copy `.genie/agents/` structure from upstream
3. Read both `forge-coder.md` and `implementor.md`
4. Create first merged agent: `.genie/agents/specialists/implementor.md`
5. Test with: `./genie run implementor "test task"`

**Or tell me which phase/component to start with!**
