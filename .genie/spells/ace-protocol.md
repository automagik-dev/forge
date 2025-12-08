# ACE Protocol - Evidence-Based Editing Requirements

**Purpose:** Mandatory behavioral triggers for all framework edits. ACE (Agentic Context Engineering) ensures data-driven optimization.

**Load Priority:** 2 (immediately after know-yourself.md)

---

## 🔴 MANDATORY: Before Editing ANY File

**Use semantic deduplication to prevent duplicate learnings:**

```bash
genie helper embeddings "new learning text" file.md "Section Name"
```

**Decision Rules:**
- `similarity > 0.85` → **DUPLICATE** - Merge with existing or skip
- `similarity 0.70-0.85` → **RELATED** - Evaluate carefully, usually merge
- `similarity < 0.70` → **DIFFERENT** - Safe to add new learning

**When to use:**
- Before adding ANY new learning to spells/agents
- When user teaches new pattern
- When learn agent is invoked
- Part of grow-and-refine protocol

---

## 🔴 MANDATORY: Before Committing ANY Change

**Measure token impact of all framework changes:**

```bash
genie helper count-tokens file.md

# Compare before/after (for savings calculation)
genie helper count-tokens --before=old.md --after=new.md
```

**Record in commit message:**
- Tokens before/after
- Net change (+/- tokens)
- Justify growth if adding content

**When to use:**
- Before every framework commit
- When validating token efficiency (Amendment #6)
- Required by Amendment #8

---

## 🔴 MANDATORY: After Executing ANY QA Scenario

**Track learning effectiveness with counter updates:**

```bash
# Record helpful outcome (scenario passed, learning helped)
genie helper bullet-counter learn-042 --helpful

# Record harmful outcome (scenario failed, learning caused issue)
genie helper bullet-counter learn-042 --harmful

# Query current counters
genie helper bullet-counter learn-042
```

**Value Ratio Formula:**
```
ratio = helpful / max(harmful, 1)
```

**Categorization Thresholds:**
- `ratio ≥ 3.0` → **HIGH_VALUE** - Strengthen with examples, reinforce
- `ratio 1.0-3.0` → **MEDIUM_VALUE** - Keep as-is, working well
- `ratio 0.5-1.0` → **LOW_VALUE** - Refine wording or clarify
- `ratio < 0.5` → **HARMFUL** - Remove or completely rewrite

**When to use:**
- After manual QA scenario execution
- During multi-epoch testing (future automation)
- When gathering evidence for optimization decisions

---

## 🔴 MANDATORY: Active Monitoring with Sleep/Wait Commands

**There is NO such thing as "background monitoring" - you must actively wait with sleep commands.**

**Monitoring Requirements:**
- Use explicit `sleep` or wait commands for monitoring intervals
- Monitoring intervals MUST be 10+ minutes minimum
- Never say "monitoring in background" without active sleep/wait loop
- Background bash processes are NOT monitoring - you must check their output with sleep intervals

**Pattern:**
```bash
# ❌ WRONG: Background process without active monitoring
bash script.sh &
echo "Monitoring in background"

# ✅ CORRECT: Active monitoring with sleep commands
bash script.sh &
for i in $(seq 1 20); do
  check_status
  sleep 600  # 10 minutes
done
```

**When to use:**
- Monitoring CI/CD workflows
- Waiting for long-running processes
- Tracking autonomous agent loops
- Any task requiring periodic status checks

**Evidence:** User teaching 2025-12-06 - "there's no such thing as background monitoring... you NEED TO USE WAIT / SLEEP DURING MONITORING INTERVALS... 10 MINUTE LONG AT LEAST"

---

## Why This Matters

**Without ACE:**
- Duplicate learnings accumulate → context bloat
- Framework grows without measurement → token waste
- Intuition-based optimization → no evidence

**With ACE:**
- Semantic dedup catches paraphrases → no duplicates
- Token measurement before commit → controlled growth
- Evidence-based optimization → data-driven improvements

**Current Status:**
- ✅ All ACE helpers operational (embeddings, bullet-counter, count-tokens)
- ✅ 912 learnings structured with counters `[id] helpful=N harmful=M: content`
- ⚠️ Multi-epoch automation pending (Phase 5: Issue #384)

---

## Cross-References

**Related Amendments:**
- Amendment #6: Token Efficiency - Fast, Fit, Smart, Sexy
- Amendment #8: Token Counting Protocol - Official Helper Only
- Amendment #12: ACE Protocol - Evidence-Based Framework Optimization

**Related Spells:**
- `learn.md` - Detailed ACE workflows and grow-and-refine protocol
- `know-yourself.md` - Core identity and self-awareness

**Documentation:**
- ACE architecture: `/tmp/genie-ace-architecture-complete.md`
- Phase 5 automation: GitHub Issue #384
