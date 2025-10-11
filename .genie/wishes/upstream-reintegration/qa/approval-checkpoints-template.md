# Approval Checkpoints Template for Wishes

## Purpose

Approval checkpoints ensure human oversight at critical decision points during wish implementation. This prevents costly rework and aligns technical execution with business requirements.

## When to Use Approval Checkpoints

Define approval checkpoints for:

1. **Architectural Changes** - Before modifying system architecture or dependencies
2. **Database Migrations** - Before creating/modifying database schema
3. **Breaking Changes** - Before implementing changes that affect existing APIs or behavior
4. **Resource-Intensive Work** - Before starting work that requires significant time investment
5. **Security-Sensitive Changes** - Before implementing authentication, authorization, or data access changes

## Checkpoint Template

Add this section to the wish document **before** the Implementation Status section:

```markdown
## Approval Checkpoints

### Checkpoint 1: [Name] - [Status: PENDING|APPROVED|BLOCKED]
**Requires approval from:** [Role/Person]
**Decision needed:** [Clear description of what needs approval]
**Context:** [Why this decision matters]
**Options:**
1. [Option A with tradeoffs]
2. [Option B with tradeoffs]

**Approval date:** [Date when approved]
**Decision:** [What was decided and why]

---

### Checkpoint 2: [Name] - [Status: PENDING|APPROVED|BLOCKED]
...
```

## Example: Upstream Reintegration Approval Checkpoints

### Checkpoint 1: Architecture Migration Approach - APPROVED
**Requires approval from:** Tech Lead
**Decision needed:** Choose between fork-and-sync vs path-dependency approach
**Context:** Determines long-term maintenance burden and upgrade path
**Options:**
1. **Fork upstream** - Copy code, manage merge conflicts manually (HIGH maintenance)
2. **Use path dependencies** - Reference upstream directly, minimal Forge code (LOW maintenance)

**Approval date:** 2025-10-07
**Decision:** Path dependencies approved - keeps codebase lean and upstream upgrades simple

---

### Checkpoint 2: Database Migration Strategy - APPROVED
**Requires approval from:** Tech Lead
**Decision needed:** Separate database vs shared schema with Forge tables
**Context:** Impacts data management, backup, and migration complexity
**Options:**
1. **Separate database** - Forge-only DB with sync logic (COMPLEX)
2. **Shared schema with Forge tables** - Upstream schema + 3 Forge tables (SIMPLE)

**Approval date:** 2025-10-08
**Decision:** Shared schema approved - single migration file with 3 Omni tables

---

### Checkpoint 3: Customization Scope - APPROVED
**Requires approval from:** Product Owner, Tech Lead
**Decision needed:** Which upstream behaviors should Forge override?
**Context:** More overrides = more maintenance debt
**Options:**
1. **Minimal overrides** - Only branch prefix + Omni (RECOMMENDED)
2. **Extensive overrides** - Branch templates, custom executors, UI changes (HIGH RISK)

**Approval date:** 2025-10-08
**Decision:** Minimal overrides approved - branch prefix in router + Omni in extensions

---

## Checkpoint Workflow

1. **Define checkpoints** during wish planning phase
2. **Mark status as PENDING** when checkpoint is reached
3. **Present options** with evidence (code examples, diagrams, tradeoffs)
4. **Obtain approval** via chat, issue comment, or meeting
5. **Update wish** with approval date and decision rationale
6. **Mark status as APPROVED** before proceeding with implementation

## Anti-Patterns (What NOT to Do)

❌ **Skip checkpoints** - "I'll just do it and ask for forgiveness"
❌ **Vague decisions** - "Approve the thing" without context
❌ **Approval after implementation** - Retroactive approval wastes time if rejected
❌ **Missing options** - Present only one approach without alternatives
❌ **Approval from wrong person** - Security changes approved by frontend dev

## Benefits

✅ **Prevents rework** - Catch architectural issues early
✅ **Shared ownership** - Team participates in critical decisions
✅ **Documentation** - Decision history preserved in wish
✅ **Risk reduction** - Human oversight at high-risk points
✅ **Learning** - Junior devs see how experienced engineers evaluate tradeoffs

## Integration with Review Agent

When `/review` evaluates a wish, it checks:

- Are approval checkpoints defined? (+2 pts Discovery)
- Are all checkpoints resolved before implementation? (+3 pts Discovery)
- Is approval rationale documented? (+1 pt Verification)

Missing checkpoints result in score deductions in the Discovery Phase evaluation.
