# 🧞📚 Learning Report: GitHub Issue Creator Agent

**Date:** 2025-01-11 15:30 UTC
**Type:** capability
**Severity:** medium
**Teacher:** User

---

## Teaching Input

User requested creation of an agent that can:
1. Use GitHub issue creation templates
2. Create comprehensive issues for API documentation and other features
3. Learn from creating a real issue (API Swagger implementation)
4. Automate future issue creation without lengthy prompts

---

## Analysis

### Type Identified
**Capability** - New specialist agent for GitHub issue creation

### Key Information Extracted
- **What:** GitHub issue creation specialist with template awareness
- **Why:** Automate comprehensive issue creation following best practices
- **Where:** New specialist agent at `.genie/agents/specialists/issue-creator.md`
- **How:** Analyze project, fetch templates from main branch, create detailed issues

### Affected Files
1. `.genie/agents/specialists/issue-creator.md` - New agent documentation (created)
2. `AGENTS.md` - Add to routing matrix and specialist list (updated)

---

## Changes Made

### File 1: `.genie/agents/specialists/issue-creator.md`

**Section:** New file
**Edit type:** Create

**Content:** Complete agent specification including:
- Template fetching protocol (from main branch when on different branch)
- Issue structure templates (feature, bug, planned-feature)
- Tech stack analysis methods
- API documentation specifics for different frameworks
- Label management
- GitHub CLI commands
- Best practices and validation checklist

**Reasoning:** Encapsulates all learnings from creating the Swagger API issue

### File 2: `AGENTS.md`

**Section:** Subagent Routing Matrix
**Edit type:** Insert

**Diff:**
```diff
 | Bug triage | `specialists/bug-reporter` | Captures reproduction details and routes to wish/forge flow |
+| GitHub issues | `specialists/issue-creator` | Creates comprehensive GitHub issues with template awareness |
 | Meta-learning updates | `specialists/self-learn` (plus `specialists/learn` for docs) | Applies behavioral corrections across prompts/docs |
```

**Reasoning:** Add new capability to routing matrix for discoverability

**Section:** Subagent Sessions list
**Edit type:** Update

**Diff:**
```diff
-specialists/implementor, specialists/tests, specialists/qa, specialists/polish, specialists/bug-reporter, specialists/git-workflow, specialists/project-manager, specialists/sleepy, specialists/learn
+specialists/implementor, specialists/tests, specialists/qa, specialists/polish, specialists/bug-reporter, specialists/issue-creator, specialists/git-workflow, specialists/project-manager, specialists/sleepy, specialists/learn
```

**Reasoning:** Include in specialist enumeration for MCP launch

---

## Validation

### How to Verify
1. Launch issue-creator agent: `mcp__genie__run` with agent `"specialists/issue-creator"`
2. Test with prompt: "Create issue for implementing user authentication"
3. Verify agent:
   - Fetches templates from main branch
   - Analyzes project structure
   - Creates comprehensive issue with proper structure
   - Returns issue URL

### Follow-up Actions
- [x] Created GitHub issue #27 for API Swagger implementation
- [x] Documented agent at `.genie/agents/specialists/issue-creator.md`
- [x] Updated AGENTS.md routing matrix
- [ ] Test agent with different issue types
- [ ] Consider creating issue templates if not present

---

## Evidence

### Before
No specialized agent for GitHub issue creation. Manual process requiring:
- Remembering to check templates
- Manually fetching from main branch
- Crafting comprehensive descriptions
- Understanding project context each time

### After
- Specialist agent available: `specialists/issue-creator`
- Automated template fetching from main branch
- Comprehensive issue structure templates
- Tech stack awareness for context-appropriate suggestions
- GitHub issue #27 created successfully: https://github.com/namastexlabs/automagik-forge/issues/27

---

## Key Learnings

### Technical Discoveries
1. **Template Location:** GitHub templates live on main branch, accessible via API even from other branches
2. **API Access:** `gh api repos/{owner}/{repo}/contents/.github/ISSUE_TEMPLATE` lists templates
3. **Content Fetching:** Template content needs base64 decoding: `--jq '.content' | base64 -d`
4. **Axum Documentation:** Best tool is `utoipa` crate with `utoipa-swagger-ui` for Rust/Axum projects
5. **Path Convention:** `/api/docs` respects existing API structure better than root `/docs`

### Process Patterns
1. **Project Analysis First:** Always analyze tech stack before suggesting solutions
2. **Template Awareness:** Check for existing templates and use their structure
3. **Comprehensive Detail:** Include problem, solution, alternatives, use cases, success criteria
4. **Code Examples:** Actual implementation snippets make issues actionable
5. **Multiple Personas:** Consider different user types (backend dev, frontend dev, DevOps, etc.)

### GitHub CLI Usage
```bash
# List templates via API
gh api repos/{owner}/{repo}/contents/.github/ISSUE_TEMPLATE --jq '.[].name'

# Create issue with labels (if they exist)
gh issue create --repo {owner}/{repo} --title "Title" --body "Content" --label "label1"

# Create without labels if they don't exist
gh issue create --repo {owner}/{repo} --title "Title" --body "Content"
```

---

## Meta-Notes

The issue-creator agent demonstrates the power of learning from actual tasks. By creating a real API documentation issue, we captured:
- Project-specific context (Axum/Rust backend)
- Template handling across branches
- Comprehensive issue structure
- Best practices for clarity

This agent can now help create future issues with the same level of detail and context-awareness, saving significant time and ensuring consistency.

---

**Learning absorbed and propagated successfully.** 🧞📚✅