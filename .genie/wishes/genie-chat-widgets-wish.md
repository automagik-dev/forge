# Wish: Genie Chat Widgets on Kanban Board

**Status**: 🟡 Planning
**Created**: 2025-10-23
**Updated**: 2025-10-23
**Owner**: GENIE (Wish Manager)
**Tracking ID**: GCW-001

---

## Executive Summary

Integrate AI agent orchestrators (Genie and Sub-Genies) as specialized chat widgets into the Kanban board. Each column will have its own sub-genie (Wishh, Forge, Review) that manages that column's responsibilities. Workflows and skills can be triggered from the widget UI, making agent orchestration a first-class feature of the board.

---

## Discovery Phase

### Current State
- Kanban board with columns: **To Do**, **In Progress (Doing)**, **In Review**, **Done**, **Cancelled**
- No agent integration on the board UI
- Agent orchestration happens externally (CLI, chat interfaces)

### Desired State
- **Genie Master Orchestrator**: Global chat widget (persistent, bottom-right) for cross-board commands
- **Sub-Genies** (context-aware orchestrators):
  - **Wishh** (Planner): Controls "To Do" column
  - **Forge** (Executor): Controls "In Progress/Doing" column
  - **Review**: Controls "In Review" column
- **Column Integration**:
  - Each column header has a sub-genie icon/avatar
  - Clicking expands a widget panel with:
    - **Chat interface** for conversational prompts
    - **Workflows** (action buttons): Pre-configured sequences
    - **Skills** (toggles/icons): Optional features that enhance orchestration
- **External Agent Workflows**: Git Agent and other specialists can inject their workflows into columns
- **Seamless UX**: Widgets feel like part of the column, not floating overlays

### Key Concepts Clarified

#### Genie Hierarchy
```
Genie (Master Orchestrator)
├── Wishh (Sub-Genie) → "To Do" Column Owner
├── Forge (Sub-Genie) → "In Progress" Column Owner
├── Review (Sub-Genie) → "In Review" Column Owner
└── External Agents (Git, Tests, etc.) → Workflows injected contextually
```

#### Workflows vs. Skills
- **Workflows**: Sequences of actions tied to a sub-genie or external agent
  - Example: Wishh's "Refine Requirement" workflow
  - Example: Git Agent's "Create Feature Branch" workflow
- **Skills**: Optional, toggleable features that enhance a sub-genie
  - Example: "Quick Validation" skill for Review agent
  - Activated/deactivated from skill icons

#### Role of Each Sub-Genie
| Sub-Genie | Column | Responsibilities | Workflows Example |
|-----------|--------|------------------|--------------------|
| **Wishh** | To Do | Discover tasks, refine requirements, prioritize | "Analyze Dependencies", "Refine Spec", "Create from Idea" |
| **Forge** | In Progress | Manage execution, track progress, inject Git workflows | "Start Build", "Update Status", "Create Branch", "Run Tests" |
| **Review** | In Review | QA, validation, feedback, approval | "Run QA Suite", "Generate Summary", "Request Changes" |

---

## Spec Contract

### In Scope ✅
1. **Genie Master Widget**
   - Persistent chat widget (bottom-right corner)
   - Receives global commands ("list high-priority reviews", "move approved items to Done")
   - Delegates to sub-genies or executes cross-board actions

2. **Sub-Genie Column Widgets**
   - Icon/avatar in each column header (Wishh, Forge, Review)
   - Click to expand panel within the column area
   - Panel contains:
     - Chat interface (textarea + send button)
     - Workflows list (buttons)
     - Skills toggles (small icons)

3. **Workflow Integration**
   - Workflows are pre-configured action buttons
   - Each button triggers a sub-genie action or workflow
   - External agent workflows (e.g., Git) can be injected into columns
   - Workflow buttons show loading state and results

4. **Skills System**
   - Small toggle icons below workflows
   - Enable/disable optional features for that sub-genie
   - Example: "High-Speed Validation" toggle for Review agent

5. **Visual Design**
   - Mockups/wireframes showing widget placement and interaction flow
   - Responsive design that works on desktop (mobile out of scope)
   - Consistent with existing Kanban board UI

### Out of Scope ❌
- Actual backend agent implementation (assumed to exist)
- Backend API changes (assumed endpoint support exists)
- Mobile responsiveness (desktop only)
- Real-time agent execution (UI only, no agent logic)
- Database migrations or data model changes
- Authentication/authorization logic
- Persistence of widget state (localStorage or backend)

---

## Success Metrics

| Metric | Definition | How to Validate |
|--------|-----------|-----------------|
| **Visual Clarity** | Users can identify which sub-genie owns each column at a glance | Mockup review shows clear icons/labels |
| **Accessibility** | Clicking a sub-genie icon opens/closes its panel without confusion | Storybook interactive demo works smoothly |
| **Workflow Integration** | Pre-configured workflows appear as buttons and are clickable | Component tests confirm buttons render and trigger callbacks |
| **Skills Activation** | Skills can be toggled on/off visually | Toggle icons respond to clicks with visual feedback |
| **Responsive Layout** | Widget panels don't break the column layout, resizable/collapsible | Desktop view shows panels fitting within column bounds |
| **Code Quality** | Components follow Automagik Forge standards (naming, structure, tests) | Linting + type checks pass, tests cover new components |

---

## Orchestration Strategy

### Phases

#### Phase 1: Planning & Design (Mockup)
**Agent**: `specialists/implementor` (design/mockup focus)
**Deliverable**: Figma mockup or high-fidelity wireframes
**Tasks**:
- Create Genie Master widget mockup (bottom-right chat bubble)
- Create Sub-Genie column widget mockups (icon → expanded panel)
- Show workflow buttons and skills toggles
- Define interaction flow (click → expand, type → send, button click → action)

#### Phase 2: Frontend Components
**Agents**: `specialists/implementor`, `specialists/tests`
**Deliverable**: React components in `frontend-forge/src/components/`
**Tasks**:
- Build `GenieMasterWidget` component (persistent chat)
- Build `SubGenieColumnWidget` component (icon + expanded panel)
- Build `WorkflowButton` component
- Build `SkillsToggle` component
- Storybook stories for all components
- Unit tests for interactions

#### Phase 3: Integration & Polish
**Agents**: `specialists/implementor`, `specialists/polish`
**Deliverable**: Integrated widgets on the Kanban board
**Tasks**:
- Wire widgets to Kanban columns
- Connect to mock API endpoints (or real endpoints if available)
- Test responsiveness and layout
- Polish animations and styling
- Run linting and type checks

#### Phase 4: QA & Validation
**Agent**: `specialists/qa`
**Deliverable**: QA report and evidence
**Tasks**:
- Validate workflow buttons trigger expected actions
- Validate skills toggles persist state (if applicable)
- Cross-browser testing (Chrome, Firefox, Safari)
- Accessibility review (keyboard navigation, ARIA labels)

---

## Evidence Requirements

### Discovery Phase Evidence
- [ ] This wish document (you're reading it!)
- [ ] Clarified hierarchy diagram (Genie → Sub-Genies → Columns)
- [ ] Workflow matrix (which workflows per sub-genie)

### Mockup/Design Evidence
- [ ] Figma link or image files of mockups
- [ ] Interaction flow diagram (click → expand, type → send)
- [ ] Decision log: why this placement and not another

### Component Evidence
- [ ] React component files in `frontend-forge/src/components/`
- [ ] Storybook stories (`.stories.tsx` files)
- [ ] Unit test files (`.test.tsx`)
- [ ] Type definitions (`.types.ts`)
- [ ] TypeScript compilation passes (`pnpm run check`)
- [ ] Linting passes (`pnpm run lint`)

### Integration Evidence
- [ ] Screenshots of widgets on the Kanban board
- [ ] Video walkthrough of user interactions
- [ ] Test results (unit tests passing)

### QA Evidence
- [ ] QA report (validation matrix, bug list, resolved)
- [ ] Accessibility checklist
- [ ] Browser compatibility matrix

---

## Blockers & Assumptions

### Assumptions
1. Genie agent backend already supports the orchestration logic (sub-genies, workflows, skills)
2. Kanban board component exists and can be extended
3. API endpoints exist (or will be mocked) for:
   - `/api/genie/master` (global commands)
   - `/api/genie/wishh` (Wishh sub-genie)
   - `/api/genie/forge` (Forge sub-genie)
   - `/api/genie/review` (Review sub-genie)
4. Project uses React 18+ and TypeScript (confirmed by tech stack)

### Potential Blockers
- **Unknown API Contract**: If API endpoints don't match expected shape, integration will fail
  - **Mitigation**: Clarify API endpoints early (Phase 1)
- **Design System Alignment**: If widgets don't match existing Kanban design, they'll look out of place
  - **Mitigation**: Review with design team during mockup phase
- **Performance**: If workflows trigger heavy backend operations, UI might feel sluggish
  - **Mitigation**: Add loading states and debounce workflow button clicks

---

## Branch Strategy

**Base Branch**: `main`
**Feature Branch**: `forge/genie-chat-widgets`
**Subdirectory**: `frontend-forge/src/components/genie-widgets/`

---

## Success Evaluation Matrix (100 Points)

### Discovery Phase (30 pts)
- [ ] Context & Clarity (10 pts): Genie hierarchy, workflows, skills clearly defined
- [ ] Scope Definition (10 pts): In-scope vs. out-of-scope items explicit
- [ ] Evidence Planning (10 pts): Clear evidence requirements per phase

### Implementation Phase (40 pts)
- [ ] Component Quality (15 pts): Components follow Forge standards, TypeScript strict, clean abstractions
- [ ] Test Coverage (10 pts): Unit tests cover happy path and edge cases
- [ ] Storybook Stories (5 pts): Interactive stories showcase all component states
- [ ] Integration (10 pts): Widgets appear on board, workflows trigger, no layout breaks

### Verification Phase (30 pts)
- [ ] Design Validation (10 pts): Mockups approved, interaction flow smooth
- [ ] QA Evidence (10 pts): All validation commands pass, bugs resolved
- [ ] Code Quality (5 pts): Linting, type checks, formatting all pass
- [ ] Documentation (5 pts): Component README, usage examples, inline comments

---

## Next Steps

1. **Wish Approval**: You (the human) review and approve/iterate this wish
2. **Forge Execution**: Once approved, I'll use Forge to generate task files (`.genie/wishes/genie-chat-widgets/task-*.md`)
3. **Agent Delegation**: Phase 1 (Design) goes to `specialists/implementor`, etc.
4. **Tracking**: Updates logged in this wish and in Done Reports

---

## Notes

- This wish focuses on **UX and frontend integration**, not backend orchestration logic
- Each workflow button will eventually trigger backend actions; that logic is out of scope
- Skills are toggles; their actual behavior depends on backend support
- The Genie Master widget is always visible; column widgets expand/collapse on demand

---

**Questions for You:**
1. Does the hierarchy and workflow matrix match your vision?
2. Should the Genie Master widget be a chat bubble (like Zendesk) or a panel?
3. Do you have existing Kanban board component we should extend, or build from scratch?
4. Are there specific workflows or skills you want prioritized?

