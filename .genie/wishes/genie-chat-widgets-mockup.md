# Genie Chat Widgets - Visual Mockup & Interaction Flow

**Status**: Reference for Phase 1 implementation
**Created**: 2025-10-23

---

## Visual Layout: Kanban Board with Column Widgets

### Overview (Desktop)

```
KANBAN BOARD
═══════════════════════════════════════════════════════════════════════════════

[✨ Wish]        [🔨 Forge]      [🎯 Review]      [✅ Done]      [❌ Cancelled]
(5 items)        (3 items)       (2 items)        (12 items)     (0 items)
───────────────  ───────────────  ───────────────  ───────────────────────────

[Task A]         [Task D]         [Task G]         [Task J]
[Task B]         [Task E]         [Task H]         [Task K]
[Task C]         [Task F]                          [Task L]
                                                   [Task M]
                                                   ...
```

---

## Column Header Anatomy

### Wish Column Header
```
┌────────────────────────────────────────────┐
│ [✨ Wish]     (5)  [⋮ Menu]              │
│                                            │
│ When user clicks [✨ Wish]:                │
│ → Opens chat widget (or sidebar)          │
│                                            │
└────────────────────────────────────────────┘
```

### When Chat Widget is Expanded

```
┌────────────────────────────────────────────┐
│ [✨ Wish]     (5)  [⋮ Menu]              │
│ ┌──────────────────────────────────────┐  │
│ │        Wishh Sub-Genie Chat          │  │
│ ├──────────────────────────────────────┤  │
│ │ Ask Wishh about this column...       │  │
│ │                                      │  │
│ │ ┌─ Chat History (if persistent)    │  │
│ │ │ "User: refine task A"             │  │
│ │ │ "Wishh: Done! Here's the spec..." │  │
│ │ └─                                  │  │
│ │                                      │  │
│ │ [Textarea]: [Type your prompt...]   │  │
│ │              [Send ➔]               │  │
│ ├──────────────────────────────────────┤  │
│ │  Workflows (Quick Actions):          │  │
│ │  [Refine Spec] [Analyze Deps]       │  │
│ │  [Create from Idea] [More...]       │  │
│ ├──────────────────────────────────────┤  │
│ │  Skills:                             │  │
│ │  [⚡ Quick Analysis] [🎯 Auto-Tag]  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Tasks in column:                           │
│ [Task A] [Task B] [Task C] ...            │
│                                            │
└────────────────────────────────────────────┘
```

---

## Interaction Flow

### User Flow 1: Open Chat Widget

```
User sees Kanban board
       ↓
User clicks [✨ Wish] icon in column header
       ↓
Chat widget expands (inline or as sidebar)
       ↓
User sees chat box, workflows, and skills
       ↓
User can:
  - Type a prompt and send
  - Click a workflow button
  - Toggle a skill on/off
       ↓
Wishh responds via chat interface
```

### User Flow 2: Use Workflow Button

```
User clicks [Refine Spec] workflow button
       ↓
System sends to backend: POST /api/genie/wishh/workflow
  {
    "workflow": "refine_spec",
    "column": "todo",
    "context": { ... task context ... }
  }
       ↓
Wishh processes the workflow
       ↓
Result appears in chat widget or as notification
```

---

## Component Breakdown

### 1. Column Header Component

**Location**: Column title row
**Props**:
- `columnName`: string ("Wish", "Forge", "Review")
- `icon`: React component (Sparkles, Hammer, Target)
- `taskCount`: number
- `onIconClick`: () => void (expand/collapse widget)

**Behavior**:
- Icon is clickable (cursor: pointer)
- Icon may show "pulse" animation if there are pending agent actions
- Clicking toggles widget visibility

### 2. SubGenieWidget Component

**Location**: Inside or adjacent to column
**Props**:
- `genieName`: string ("Wishh", "Forge", "Review")
- `columnStatus`: TaskStatus ("todo", "inprogress", "inreview")
- `workflows`: WorkflowDefinition[]
- `skills`: SkillDefinition[]
- `isOpen`: boolean
- `onClose`: () => void
- `onWorkflowClick`: (workflowId: string) => void
- `onSkillToggle`: (skillId: string, enabled: boolean) => void
- `onSendMessage`: (message: string) => void

**Sections**:
1. **Chat Display Area**
   - Scrollable message history
   - Each message shows sender (User/Wishh) and timestamp

2. **Input Area**
   - Textarea with placeholder "Ask Wishh about this column..."
   - Send button (or keyboard shortcut: Cmd+Enter / Ctrl+Enter)

3. **Workflows Section**
   - Grid or list of workflow buttons
   - Each button shows icon + label
   - Buttons have loading state when clicked

4. **Skills Section**
   - Toggles or toggle-like icons
   - Tooltip showing skill name and description

### 3. WorkflowButton Component

**Props**:
- `label`: string
- `icon`: React component
- `isLoading`: boolean
- `onClick`: () => void

**Behavior**:
- Shows spinner while loading
- Disabled while loading
- Shows success/error state (optional)

### 4. SkillToggle Component

**Props**:
- `id`: string
- `name`: string
- `description`: string
- `isEnabled`: boolean
- `onChange`: (enabled: boolean) => void

**Behavior**:
- Toggle icon that changes color when enabled
- Tooltip on hover shows skill name and description

---

## Data Models

### Workflow Definition
```typescript
interface WorkflowDefinition {
  id: string;
  label: string;
  description: string;
  icon?: React.ComponentType<LucideProps>;
  genieType: "wishh" | "forge" | "review";
  columnStatus: TaskStatus;
  externalAgent?: string; // e.g., "git_agent", "test_agent"
}
```

### Skill Definition
```typescript
interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<LucideProps>;
  genieType: "wishh" | "forge" | "review";
  isEnabled: boolean;
}
```

### Chat Message
```typescript
interface ChatMessage {
  id: string;
  sender: "user" | "wishh" | "forge" | "review";
  content: string;
  timestamp: string;
  metadata?: {
    workflowId?: string;
    status?: "sent" | "processing" | "error";
  };
}
```

---

## Workflow Examples

### Wishh Workflows (To Do / Wish column)

| Workflow | Description | Triggered Action |
|----------|-------------|------------------|
| **Refine Spec** | Wishh refines the task spec and requirements | POST `/api/genie/wishh/refine-spec` |
| **Analyze Dependencies** | Identify task dependencies and blockers | POST `/api/genie/wishh/analyze-deps` |
| **Create from Idea** | Convert a rough idea into a structured task | POST `/api/genie/wishh/create-from-idea` |
| **Prioritize** | Reorder tasks by priority | POST `/api/genie/wishh/prioritize` |

### Forge Workflows (In Progress / Forge column)

| Workflow | Description | Triggered Action |
|----------|-------------|------------------|
| **Start Build** | Initiate code generation or build process | POST `/api/genie/forge/start-build` |
| **Run Tests** | Execute test suite | POST `/api/genie/forge/run-tests` |
| **Update Status** | Get execution status and logs | POST `/api/genie/forge/status` |
| **Create Branch** | (Git Agent) Create feature branch | POST `/api/genie/forge/git/create-branch` |
| **Sync Branch** | (Git Agent) Sync with main | POST `/api/genie/forge/git/sync` |

### Review Workflows (In Review / Review column)

| Workflow | Description | Triggered Action |
|----------|-------------|------------------|
| **Run QA Suite** | Execute quality assurance tests | POST `/api/genie/review/run-qa` |
| **Generate Summary** | Auto-generate code review summary | POST `/api/genie/review/generate-summary` |
| **Approve & Move** | Approve task and move to Done | POST `/api/genie/review/approve` |
| **Request Changes** | Flag issues for rework | POST `/api/genie/review/request-changes` |

---

## Skills Examples

### Wishh Skills

- **⚡ Quick Analysis**: Fast mode (skip deep analysis)
- **🎯 Auto-Tag**: Automatically tag tasks by type
- **📊 Complexity Estimate**: Auto-estimate task complexity

### Forge Skills

- **🚀 Fast Mode**: Skip non-essential checks, build faster
- **🔍 Verbose Logs**: Show all build output
- **🔄 Auto-Retry**: Retry on failure up to N times

### Review Skills

- **⚡ Express Review**: Fast-track approval for low-risk changes
- **📋 Detailed Report**: Generate comprehensive review report
- **🤖 Auto-Approve**: Auto-approve if tests pass

---

## Responsiveness

### Desktop (1200px+)
- Widget can be a sidebar (15-20% width) or inline expansion
- Workflows displayed as grid (3-4 per row)

### Tablet (768px-1199px)
- Widget as overlay panel (50% width, slide from right)
- Workflows as single column

### Mobile (< 768px)
- Out of scope for Phase 1 (board may be minimal on mobile anyway)

---

## Icon Library Decision

**Using Lucide React** (already in project):
- Sparkles: `<Sparkles />`
- Hammer: `<Hammer />`
- Target: `<Target />`
- CheckCircle2: `<CheckCircle2 />`
- XCircle: `<XCircle />`
- Plus many more for workflows and skills

**Alternative**: If shadcn/ui has icon library preferences, use those instead.

---

## State Management

### Local State (per widget instance)
- `isOpen`: boolean (expanded/collapsed)
- `chatHistory`: ChatMessage[]
- `skillsEnabled`: Record<string, boolean>
- `isLoadingWorkflow`: boolean

### Shared State (via React Query or Zustand)
- `subGenieLogs`: ChatMessage[] (persisted per column)
- `workflowResults`: WorkflowResult[]
- `taskFilters`: Include/exclude agent status

---

## API Endpoints (Expected Backend)

### Chat Interface
```
POST /api/genie/{genie}/send-message
  Body: { message: string, column: TaskStatus }
  Response: { response: string, action?: string }
```

### Workflows
```
POST /api/genie/{genie}/workflow/{workflowId}
  Body: { columnStatus: TaskStatus, context?: object }
  Response: { status: "queued" | "processing" | "done", result?: object }
```

### Skills
```
POST /api/genie/{genie}/skill/{skillId}
  Body: { enabled: boolean }
  Response: { skillId: string, enabled: boolean }
```

---

## Accessibility & Best Practices

- **Keyboard Navigation**: Tab through buttons, Enter to activate
- **ARIA Labels**: Buttons have descriptive labels for screen readers
- **Color**: Don't rely on color alone (e.g., for status); use icons + labels
- **Loading States**: Clear visual feedback (spinner, disabled state)
- **Error States**: Display error messages in chat interface
- **Tooltips**: Hover over skill icons to see full description

---

## Testing Checklist

- [ ] Widget opens/closes on icon click
- [ ] Chat message sends and displays in history
- [ ] Workflow buttons trigger callbacks
- [ ] Skills toggle on/off
- [ ] Widget layout responsive (desktop/tablet)
- [ ] No layout shift when widget opens
- [ ] All icons render correctly from Lucide
- [ ] Keyboard navigation works (Tab, Enter)

---

**Next Phase**: Implement components and wire to API endpoints.

