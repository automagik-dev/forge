# Wish: Genie Chat Widgets Integration

**Status:** DRAFT
**Created:** 2025-10-21
**Agent:** wish
**Project:** Automagik Forge
**Branch Strategy:** `feat/genie-chat-widgets`

---

## Vision

Transform the Automagik Forge Kanban board into a conversational orchestration interface where each column is augmented with its specialized agent (Genie sub-agents), creating an intuitive UX where users can interact with Wishh (Planner), Forge (Execution), and Review agents directly in context, plus access the master orchestrator Genie globally.

---

## Context

### Current State
- Kanban board with columns: To Do, In Progress, In Review, Done, Cancelled
- Tasks move through workflow stages manually
- No direct agent interaction within the board interface
- Genie MCP integration exists but requires external tooling

### Target State
- **Master Orchestrator (Genie)**: Global chat widget accessible from anywhere (bottom-right corner)
- **Column-Specific Sub-Genies**:
  - **Wishh (Planner)**: Attached to "To Do" column - discovers, plans, refines wishes
  - **Forge (Execution)**: Attached to "In Progress" column - manages execution, workflows, monitoring
  - **Review Agent**: Attached to "In Review" column - QA validation, feedback, approval flows
- **Workflow Integration**: Each sub-genie exposes its workflows as quick-action buttons
- **Skill Activation**: Toggle-able skills represented as contextual icons
- **Cross-Agent Workflows**: Git agent workflows appear in relevant contexts (e.g., "Create Branch" in Forge)

---

## Agent Hierarchy (CORRECTED)

### 🧞 Genie - Master Orchestrator
- **Role**: Global orchestration, cross-column commands, delegation to sub-genies
- **Location**: Persistent floating widget (bottom-right, global)
- **Capabilities**:
  - Execute commands across entire board ("Move all reviewed items to Done")
  - Delegate to sub-genies ("Wishh, prioritize high-urgency items")
  - Access to all workflows and skills
  - Session management for all sub-genies

### 🎯 Wishh - Planner Sub-Genie
- **Role**: Discovery, planning, wish refinement for "To Do" column
- **Location**: Column header icon/widget in "To Do"
- **Capabilities**:
  - Create new wishes from natural language
  - Refine requirements and acceptance criteria
  - Prioritize task queue
  - Analyze dependencies
- **Workflows**:
  - "Discover Ideas" - Extract actionable tasks from discussions
  - "Refine Requirement" - Clarify specifications
  - "Prioritize Queue" - Reorder based on criteria
  - "Analyze Dependencies" - Map task relationships

### ⚙️ Forge - Execution Sub-Genie
- **Role**: Execution management, status updates, workflow orchestration for "In Progress"
- **Location**: Column header icon/widget in "In Progress"
- **Capabilities**:
  - Monitor task progress
  - Execute builds/tests
  - Update status automatically
  - Manage worktree lifecycles
  - Coordinate with Git Agent
- **Workflows**:
  - "Start Build" - Trigger CI/build process
  - "Update Status" - Report progress
  - "Create Branch" (Git Agent) - Initialize feature branch
  - "Run Tests" - Execute test suite
  - "Monitor Execution" - Real-time progress tracking

### ✅ Review - QA Sub-Genie
- **Role**: Quality assurance, validation, feedback for "In Review"
- **Location**: Column header icon/widget in "In Review"
- **Capabilities**:
  - Run QA validation plans
  - Generate feedback reports
  - Approve/reject with evidence
  - Suggest fixes
- **Workflows**:
  - "Run QA Checklist" - Execute validation plan
  - "Generate Feedback" - Create detailed review
  - "Quick Validation" - Fast-track simple changes
  - "Request Changes" - Document required fixes

---

<spec_contract>

## Functional Requirements

### FR1: Master Orchestrator Widget (Genie)
- **FR1.1**: Persistent floating chat widget in bottom-right corner
- **FR1.2**: Always accessible across all pages
- **FR1.3**: Input supports natural language commands
- **FR1.4**: Command parsing and delegation to appropriate sub-genie
- **FR1.5**: Session history and conversation continuity
- **FR1.6**: Visual indicator when processing commands
- **FR1.7**: Minimizable/expandable state

**Success Criteria:**
- Widget renders on all pages
- Commands are correctly routed to sub-genies
- Session state persists across page navigation
- Response time < 2s for command parsing

### FR2: Column Sub-Genie Widgets (Wishh, Forge, Review)
- **FR2.1**: Icon/button in column header to open sub-genie interface
- **FR2.2**: Click expands floating panel within column context
- **FR2.3**: Panel contains:
  - Chat interface for natural language prompts
  - Quick-action workflow buttons
  - Skill activation toggles
- **FR2.4**: Panel dismissible/collapsible
- **FR2.5**: Visual distinction between sub-genies (icon, color accent)

**Success Criteria:**
- Each column has visible sub-genie access point
- Panel opens/closes smoothly
- Workflows are contextually relevant to column
- Skills toggle correctly

### FR3: Workflow Integration
- **FR3.1**: Each sub-genie exposes 3-5 primary workflows
- **FR3.2**: Workflows rendered as action buttons in sub-genie panel
- **FR3.3**: External agent workflows (Git) injected into relevant sub-genies
- **FR3.4**: Workflow execution triggers backend actions
- **FR3.5**: Progress feedback during workflow execution
- **FR3.6**: Success/failure notifications

**Success Criteria:**
- All workflows listed in agent hierarchy are accessible
- Workflow buttons execute correct backend endpoints
- User receives feedback within 1s of workflow completion

### FR4: Skill Activation System
- **FR4.1**: Skills represented as toggle icons in sub-genie panel footer
- **FR4.2**: Toggle activates/deactivates skill mode
- **FR4.3**: Active skills modify agent behavior
- **FR4.4**: Visual indicator for active skills
- **FR4.5**: Skills persist per session

**Success Criteria:**
- Skills toggle on/off correctly
- Active skills affect agent responses
- Visual state reflects activation status

### FR5: Backend MCP Integration
- **FR5.1**: Chat messages routed to `mcp__genie__run` or `mcp__genie__resume`
- **FR5.2**: Session management via `mcp__genie__list_sessions`
- **FR5.3**: Workflow execution via MCP tools
- **FR5.4**: Real-time streaming of agent responses (SSE)
- **FR5.5**: Error handling and retry logic

**Success Criteria:**
- MCP calls succeed with <5% error rate
- Responses stream in real-time
- Sessions resume correctly after page reload

### FR6: UX/UI Design
- **FR6.1**: Consistent design language across all widgets
- **FR6.2**: Responsive layout (desktop primary, mobile graceful degradation)
- **FR6.3**: Accessibility (keyboard navigation, ARIA labels)
- **FR6.4**: Smooth animations for panel open/close
- **FR6.5**: Dark mode support

**Success Criteria:**
- Passes WCAG 2.1 AA compliance
- Animations run at 60fps
- Works on viewport widths ≥1024px

---

## Quality Gates

### QG1: Visual Design Review
- [ ] Mockups approved by product owner
- [ ] Design system components identified
- [ ] Color palette and iconography finalized

### QG2: Technical Architecture Review
- [ ] Component structure documented
- [ ] API endpoints defined
- [ ] State management strategy approved
- [ ] MCP integration pattern validated

### QG3: Implementation Validation
- [ ] All functional requirements met
- [ ] Unit tests for React components (>80% coverage)
- [ ] Integration tests for MCP flows
- [ ] E2E test for full workflow

### QG4: UX Validation
- [ ] User can complete workflow from each sub-genie
- [ ] Master orchestrator correctly delegates commands
- [ ] No UI regressions on existing Kanban board
- [ ] Accessibility audit passes

### QG5: Performance Validation
- [ ] Widget load time <500ms
- [ ] MCP response streaming <100ms latency
- [ ] No memory leaks after 1hr session
- [ ] Lighthouse score >90

---

## Evidence Requirements

All validation evidence stored in: `.genie/wishes/genie-chat-widgets/qa/`

### Required Artifacts
1. **Design Assets**: Mockups, component wireframes, icon sets
2. **API Documentation**: Endpoint specs, MCP integration flows
3. **Test Reports**: Unit test coverage, integration test results, E2E screenshots
4. **Performance Metrics**: Lighthouse reports, memory profiling, response time logs
5. **Accessibility Report**: WCAG compliance audit
6. **User Acceptance**: Demo recording, stakeholder sign-off

---

## Out of Scope

- ❌ Mobile-first responsive design (graceful degradation only)
- ❌ Voice input for chat widgets
- ❌ Multi-user collaborative chat
- ❌ Chat history export/import
- ❌ Custom agent creation UI
- ❌ Integration with external chat platforms (Slack, Discord)

---

</spec_contract>

## Orchestration Strategy

### Phase 1: Discovery & Design (Group A)
**Agent:** Wishh + Twin (design validation)

**Tasks:**
1. Create UX mockups for all widget states (collapsed, expanded, active)
2. Define component hierarchy and state management approach
3. Map MCP endpoints to widget actions
4. Document accessibility requirements

**Evidence:** Mockups, component tree diagram, API contract, a11y checklist

**Approval Gate:** Human reviews mockups and approves design direction

---

### Phase 2: Backend Integration (Group B)
**Agent:** Implementor + Tests

**Tasks:**
1. Create API endpoints for widget state management
2. Implement MCP proxy layer for chat routing
3. Add SSE endpoints for streaming responses
4. Create session management service
5. Write integration tests for MCP flows

**Evidence:** API test results, MCP integration logs, session state validation

**Approval Gate:** Backend validation passes, integration tests green

---

### Phase 3: Frontend Components (Group C)
**Agent:** Implementor + Tests

**Tasks:**
1. Build `GenieWidget` component (master orchestrator)
2. Build `SubGeniePanel` component (reusable for all sub-genies)
3. Build `WorkflowButton` component
4. Build `SkillToggle` component
5. Integrate with Kanban board columns
6. Add state management (Zustand/Context)
7. Write component unit tests

**Evidence:** Storybook stories, unit test coverage report, component screenshots

**Approval Gate:** Component library complete, unit tests >80% coverage

---

### Phase 4: Integration & Workflows (Group D)
**Agent:** Implementor + Git-Workflow

**Tasks:**
1. Connect widgets to MCP backend
2. Implement workflow execution logic
3. Add skill activation/deactivation
4. Implement session persistence
5. Add error handling and retry logic
6. Wire up Git Agent workflows into Forge sub-genie

**Evidence:** Integration test results, workflow execution logs, error handling test cases

**Approval Gate:** All workflows executable, error handling robust

---

### Phase 5: Polish & Accessibility (Group E)
**Agent:** Polish + QA

**Tasks:**
1. Run ESLint/Prettier on all new code
2. Add ARIA labels and keyboard navigation
3. Test with screen reader (NVDA/JAWS)
4. Optimize animations and transitions
5. Add dark mode support
6. Fix any visual regressions

**Evidence:** Lint reports, a11y audit results, dark mode screenshots

**Approval Gate:** WCAG 2.1 AA compliance, Lighthouse score >90

---

### Phase 6: QA & Validation (Group F)
**Agent:** QA + Review

**Tasks:**
1. Execute full QA checklist from spec_contract
2. Run E2E tests for complete workflows
3. Performance testing (memory, response time)
4. User acceptance demo
5. Create Done Report with evidence

**Evidence:** QA checklist (completed), E2E test recordings, performance logs, demo video

**Approval Gate:** All quality gates passed, human approves for merge

---

## Risks & Mitigations

### Risk 1: MCP Integration Complexity
**Impact:** High
**Probability:** Medium
**Mitigation:** Create MCP proxy layer early (Group B), validate with integration tests before frontend work

### Risk 2: UX Complexity (Too Many Widgets)
**Impact:** Medium
**Probability:** High
**Mitigation:** Start with minimal viable widgets, iterate based on user feedback, use Twin agent for UX validation

### Risk 3: Performance Degradation (Streaming)
**Impact:** Medium
**Probability:** Medium
**Mitigation:** Implement efficient SSE handling, add performance tests to Group F, monitor memory leaks

### Risk 4: Accessibility Overlooked
**Impact:** Low
**Probability:** Medium
**Mitigation:** Include a11y requirements in Group A design, dedicated testing in Group E

### Risk 5: Session State Management Bugs
**Impact:** High
**Probability:** Medium
**Mitigation:** Extensive session persistence tests in Group D, use proven state management library

---

## Tracker Plan

### Forge MCP Task Groups
1. **Group A**: Discovery & Design → `task-a.md`
2. **Group B**: Backend Integration → `task-b.md`
3. **Group C**: Frontend Components → `task-c.md`
4. **Group D**: Integration & Workflows → `task-d.md`
5. **Group E**: Polish & Accessibility → `task-e.md`
6. **Group F**: QA & Validation → `task-f.md`

### Dependencies
- Group B independent (can start immediately)
- Group C depends on Group A (design approval)
- Group D depends on Group B + Group C (backend + components ready)
- Group E depends on Group D (integration complete)
- Group F depends on Group E (polish complete)

### Parallel Execution Opportunities
- Group A + Group B can run in parallel
- Within Group C, individual components can be built in parallel

---

## Evaluation Matrix (100 Points)

### Discovery Phase (30 pts)
- **Context Completeness (10 pts):**
  - [ ] Agent hierarchy clearly documented (3 pts)
  - [ ] UX mockups cover all widget states (4 pts)
  - [ ] MCP integration patterns identified (3 pts)

- **Scope Clarity (10 pts):**
  - [ ] All functional requirements have success criteria (4 pts)
  - [ ] Out-of-scope items explicitly listed (3 pts)
  - [ ] Component boundaries defined (3 pts)

- **Evidence Planning (10 pts):**
  - [ ] Validation commands documented per group (4 pts)
  - [ ] Artifact storage paths defined (3 pts)
  - [ ] Approval checkpoints identified (3 pts)

### Implementation Phase (40 pts)
- **Code Quality (15 pts):**
  - [ ] Follows Automagik Forge React/TypeScript standards (5 pts)
  - [ ] Component composition is clean and reusable (5 pts)
  - [ ] State management is predictable (5 pts)

- **Test Coverage (10 pts):**
  - [ ] Unit tests >80% coverage (5 pts)
  - [ ] Integration tests for MCP flows (3 pts)
  - [ ] E2E test for full workflow (2 pts)

- **Documentation (5 pts):**
  - [ ] Component API documented (2 pts)
  - [ ] MCP integration guide updated (2 pts)
  - [ ] Storybook stories added (1 pt)

- **Execution Alignment (10 pts):**
  - [ ] All functional requirements implemented (5 pts)
  - [ ] No scope creep beyond spec_contract (3 pts)
  - [ ] Dependencies honored (2 pts)

### Verification Phase (30 pts)
- **Validation Completeness (15 pts):**
  - [ ] All quality gates executed (5 pts)
  - [ ] Evidence artifacts captured (5 pts)
  - [ ] Edge cases tested (5 pts)

- **Evidence Quality (10 pts):**
  - [ ] Command outputs (failures → fixes) documented (4 pts)
  - [ ] Screenshots/videos captured (3 pts)
  - [ ] Performance metrics logged (3 pts)

- **Review Thoroughness (5 pts):**
  - [ ] Human approval at all gates (3 pts)
  - [ ] All blockers resolved (2 pts)

---

## Status Log

**2025-10-21 (Initial Draft):**
- Wish created based on user discussion
- Agent hierarchy corrected (Genie = master, Wishh/Forge/Review = sub-genies)
- UX approach defined (global widget + column widgets)
- Functional requirements documented
- 6 execution groups planned

**Pending Actions:**
- [ ] Human reviews and approves wish
- [ ] Forge breaks down into task files
- [ ] Project Manager coordinates group execution

---

## Human Follow-Ups

### Immediate Questions
1. **Design Approval**: Should we start with mockups or go straight to implementation?
2. **Widget Library**: Prefer shadcn/ui components or custom-built widgets?
3. **MCP Session Strategy**: Single session per sub-genie or session-per-interaction?
4. **Priority**: Which sub-genie to implement first (Wishh/Forge/Review)?

### Future Considerations
1. Add more skills to sub-genies based on usage patterns
2. Explore voice input integration (out of scope now, but valuable later)
3. Consider mobile-first redesign after desktop validation
4. Evaluate multi-user collaborative chat features

---

**Done Report Path (After Completion):** `.genie/reports/done-review-genie-chat-widgets-<timestamp>.md`
