# Forge Frontend Complete Inventory
## Comprehensive Mobile Redesign Foundation Document

**Date:** 2025-11-11  
**Purpose:** Complete frontend architecture mapping for native Android mobile app development  
**Scope:** All routes, views, components, data flows, and interactions

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Architecture](#application-architecture)
3. [Complete Route Mapping](#complete-route-mapping)
4. [View Modes & Layouts](#view-modes--layouts)
5. [Core Panels & Components](#core-panels--components)
6. [Interactive Features](#interactive-features)
7. [Data Flow Architecture](#data-flow-architecture)
8. [Current Mobile Support](#current-mobile-support)
9. [Component Inventory](#component-inventory)
10. [Technical Stack](#technical-stack)
11. [Mobile Pain Points](#mobile-pain-points)
12. [Recommendations](#recommendations)

---

## Executive Summary

**Total Components:** 164 TSX files (140 in components directory)  
**Primary Framework:** React 18 + TypeScript + Vite  
**State Management:** React Query (TanStack Query) + Context API  
**Real-time:** WebSocket (JSON Patch) + SSE streams  
**Responsive Breakpoint:** 1280px (xl:) - binary mobile/desktop split  
**Current Mobile Support:** ⚠️ Limited - single breakpoint, no touch optimization

### Key Findings

1. **Desktop-first architecture** - XL breakpoint (1280px) determines mobile vs desktop
2. **Complex nested layouts** - 4-level view mode system (chat, preview, diffs, kanban)
3. **Real-time heavy** - WebSocket streams for tasks, diffs, logs, drafts
4. **Keyboard-first** - Extensive hotkey system not mobile-friendly
5. **Resizable panels** - Desktop-optimized drag handles, poor touch support
6. **Rich interactions** - Code review, diff viewing, follow-up chat require rethinking for mobile

---

## Application Architecture

### Provider Hierarchy (Root → Children)

```
BrowserRouter
└─ UserSystemProvider (config, profiles, analytics)
   └─ ClickedElementsProvider (preview click tracking)
      └─ ProjectProvider (current project context)
         └─ HotkeysProvider (keyboard shortcuts - 7 scopes)
            └─ SubGenieProvider (Genie widget state)
               └─ NiceModal.Provider (modal management)
                  └─ ThemeProvider (dark/light/system)
                     └─ SearchProvider (global search state)
                        └─ [Per-Route Providers]
                           ├─ ExecutionProcessesProvider (task execution)
                           ├─ ReviewProvider (code review comments)
                           ├─ EntriesProvider (conversation history)
                           ├─ RetryUiProvider (retry state)
                           └─ ApprovalFormProvider (approval flows)
```

### File Structure

```
frontend/src/
├── pages/                          # Top-level routes (4 files)
│   ├── projects.tsx                # Project list
│   ├── project-tasks.tsx           # Main task/kanban view ★
│   ├── full-attempt-logs.tsx       # VS Code logs embed
│   ├── release-notes.tsx           # Release notes page
│   └── settings/                   # Settings pages (4 files)
│       ├── GeneralSettings.tsx
│       ├── ProjectSettings.tsx
│       ├── AgentSettings.tsx
│       └── McpSettings.tsx
│
├── components/
│   ├── panels/                     # Main content panels (7 files) ★★★
│   ├── tasks/                      # Task components (17 files) ★★★
│   ├── dialogs/                    # Modal dialogs (8 subdirs) ★★
│   ├── logs/                       # Log viewers
│   ├── NormalizedConversation/     # Chat messages (9 files) ★★★
│   ├── layout/                     # Layout components ★★
│   ├── ui/                         # shadcn/ui primitives (50+ files)
│   └── [8 more directories]
│
├── hooks/                          # 50+ custom hooks ★★★
│   ├── follow-up/                  # Follow-up specific (7 hooks)
│   ├── useProjectTasks.ts          # Task streaming
│   ├── useJsonPatchWsStream.ts     # WebSocket JSON Patch
│   ├── useDiffStream.ts            # Diff streaming
│   ├── useLogStream.ts             # Log streaming
│   ├── useMediaQuery.ts            # Responsive breakpoints
│   └── [40+ more hooks]
│
├── contexts/                       # 12 React contexts
├── keyboard/                       # Keyboard shortcut system (5 files)
├── lib/                            # API clients, utilities
└── types/                          # TypeScript definitions
```

---

## Complete Route Mapping

### Route Table

| Path | Component | View | Data Required | Mobile Status |
|------|-----------|------|---------------|---------------|
| `/` | `<Projects />` | Project list grid | Projects stream | ✅ Works |
| `/projects` | `<Projects />` | Project list grid | Projects stream | ✅ Works |
| `/projects/:projectId` | `<Projects />` | Project detail | Single project | ✅ Works |
| `/projects/:projectId/tasks` | `<ProjectTasks />` | Kanban board | Tasks stream | ⚠️ Horizontal scroll |
| `/projects/:projectId/tasks/:taskId` | `<ProjectTasks />` | Task detail | Task + attempts | ⚠️ Panel overlay |
| `/projects/:projectId/tasks/:taskId/attempts/:attemptId` | `<ProjectTasks />` | Attempt detail | Attempt + logs | ⚠️ Complex layout |
| `/projects/:projectId/tasks/:taskId/attempts/:attemptId/full` | `<FullAttemptLogsPage />` | Full-page logs | Attempt logs | ✅ Full screen |
| `/settings/general` | `<GeneralSettings />` | Settings form | User config | ✅ Works |
| `/settings/projects` | `<ProjectSettings />` | Settings form | Project config | ✅ Works |
| `/settings/agents` | `<AgentSettings />` | Settings form | Agent profiles | ⚠️ Complex JSON editor |
| `/settings/mcp` | `<McpSettings />` | Settings form | MCP servers | ⚠️ Complex JSON editor |
| `/release-notes` | `<ReleaseNotesPage />` | Release notes | Static content | ✅ Works |

### Route Parameters

```typescript
// Main task route params
interface ProjectTasksParams {
  projectId: string;      // Required - UUID
  taskId?: string;        // Optional - UUID or 'agent' for Master Genie
  attemptId?: string;     // Optional - UUID or 'latest'
}

// Query parameters
interface TasksQueryParams {
  view?: 'chat' | 'preview' | 'diffs' | 'kanban';  // View mode
  // (search params preserved across navigation)
}
```

### Navigation Hierarchy

```
Home
├─ Projects (/projects)
│  ├─ Project Detail (/projects/:id)
│  └─ Project Tasks (/projects/:id/tasks) ★ PRIMARY VIEW
│     ├─ Task Detail (/projects/:id/tasks/:taskId)
│     └─ Attempt Detail (/projects/:id/tasks/:taskId/attempts/:attemptId)
│        ├─ ?view=chat      → Chat only
│        ├─ ?view=kanban    → Chat + Kanban (default)
│        ├─ ?view=preview   → Chat + Preview iframe
│        └─ ?view=diffs     → Chat + Code diffs
│
└─ Settings (/settings)
   ├─ General (/settings/general)
   ├─ Projects (/settings/projects)
   ├─ Agents (/settings/agents)
   └─ MCP (/settings/mcp)
```

---

## View Modes & Layouts

### Layout Architecture: TasksLayout Component

**File:** `components/layout/TasksLayout.tsx`  
**Purpose:** Orchestrates all view mode transitions and panel arrangements

#### Desktop Layout Modes (xl:1280px+)

```typescript
type LayoutMode = 'chat' | 'preview' | 'diffs' | 'kanban' | null;

// Mode behaviors:
// - null: Same as 'kanban' (Chat LEFT | Kanban RIGHT)
// - 'chat': Full-screen chat (no split)
// - 'kanban': Chat LEFT | Kanban RIGHT (default when task selected)
// - 'preview': Chat LEFT | Preview iframe RIGHT
// - 'diffs': Chat LEFT | Diffs RIGHT
```

**Desktop Layout Patterns:**

1. **No Task Selected** → Kanban only (full width)
2. **Task Selected, mode=null or 'kanban'** → Split view (Chat | Kanban)
   - Resizable panels with `react-resizable-panels`
   - Default split: 34% chat | 66% kanban
   - Saved to localStorage: `tasksLayout.desktop.v2.attemptAux`
3. **Task Selected, mode='chat'** → Chat only (full width)
4. **Task Selected, mode='preview'** → Split view (Chat | Preview)
5. **Task Selected, mode='diffs'** → Split view (Chat | Diffs)

**View Mode Cycling:**
- Keyboard: `Cmd/Ctrl+Enter` cycles forward, `Cmd/Ctrl+Shift+Enter` cycles backward
- Order: kanban → preview → diffs → chat → kanban
- Analytics tracking: `view_mode_switched` event

#### Mobile Layout (< 1280px)

**Current Implementation:**

```typescript
// Mobile uses CSS Grid with animated column widths
const columns = isPanelOpen 
  ? ['0fr', '1fr', '0fr']    // Only chat visible
  : ['1fr', '0fr', '0fr'];   // Only kanban visible

// Transition: 250ms cubic-bezier(0.2, 0, 0, 1)
```

**Mobile Behavior:**
- ❌ Binary view: Either kanban OR chat (never both)
- ❌ No preview/diffs modes on mobile
- ❌ No resizing (fixed full-width panels)
- ❌ Gesture navigation limited

#### Responsive Breakpoints

**Tailwind Config:**

```javascript
// Only ONE meaningful breakpoint: xl:1280px
screens: {
  "2xl": "1400px",  // Only for container centering
}

// Binary split:
// - < 1280px = Mobile (single panel)
// - >= 1280px = Desktop (resizable dual panels)
```

**Media Query Usage:**

```typescript
// Single query determines entire UX:
const isXL = useMediaQuery('(min-width: 1280px)');
const isMobile = !isXL;

// Components using this:
// - project-tasks.tsx (main layout)
// - TasksLayout.tsx (panel rendering)
// - ResponsiveTwoPane.tsx (deprecated)
```

---

## Core Panels & Components

### 1. TaskAttemptPanel (Chat/Conversation Panel)

**File:** `components/panels/TaskAttemptPanel.tsx`  
**Purpose:** Main execution panel - shows logs, conversation, follow-up

**Structure:**

```typescript
interface TaskAttemptPanelProps {
  attempt: TaskAttempt | undefined;
  task: TaskWithAttemptStatus | null;
  isInChatView?: boolean;  // For Master Genie (agent tasks)
  taskIdFromUrl?: string;
  projectId?: string;
  children: (sections: { logs: ReactNode; followUp: ReactNode }) => ReactNode;
}
```

**Render Pattern:**

```
TaskAttemptPanel (Wrapper)
├─ EntriesProvider (conversation state)
└─ RetryUiProvider (retry handling)
   └─ children({ logs, followUp })
      ├─ logs: <VirtualizedList />        ← Conversation history
      └─ followUp: <TaskFollowUpSection /> ← Chat input + controls
```

**Special Cases:**

1. **Agent Tasks (Master Genie):**
   - `task.status === 'agent'`
   - No attempt initially (first message creates it)
   - Shows welcome message until first interaction
   - Navigates to new task/attempt on creation

2. **Regular Tasks:**
   - Requires `attempt` object
   - Streams logs via WebSocket
   - Follow-up requires draft state

**Children Rendering:**

```tsx
// Parent (project-tasks.tsx) provides layout:
<TaskAttemptPanel>
  {({ logs, followUp }) => (
    <>
      <ChatPanelActions />  {/* Header actions */}
      <div className="flex-1">{logs}</div>  {/* Scrollable logs */}
      <div className="border-t"><TodoPanel /></div>
      <div className="border-t">{followUp}</div>  {/* Sticky input */}
    </>
  )}
</TaskAttemptPanel>
```

### 2. VirtualizedList (Conversation History)

**File:** `components/logs/VirtualizedList.tsx`  
**Library:** `@virtuoso.dev/message-list` (React Virtuoso)  
**Purpose:** Efficiently render thousands of conversation entries

**Architecture:**

```typescript
// Data flow:
useConversationHistory (hook)
  → Fetches historical entries (SSE stream)
  → Converts to PatchTypeWithKey[]
  → Feeds to VirtualizedList

// Entry types:
type PatchTypeWithKey = 
  | { type: 'STDOUT', content: string }
  | { type: 'STDERR', content: string }
  | { type: 'NORMALIZED_ENTRY', content: ConversationEntry, ... }

// Rendering:
<VirtuosoMessageList>
  ItemContent={(entry) => (
    <DisplayConversationEntry entry={entry} />
  )}
</VirtuosoMessageList>
```

**Key Features:**
- Auto-scroll to bottom on new messages (smooth)
- Initial load: scroll to last item
- Virtualization: Only renders visible items
- License key: `VITE_PUBLIC_REACT_VIRTUOSO_LICENSE_KEY`

**Conversation Entry Types:**

```typescript
// DisplayConversationEntry handles:
- text (user/assistant messages)
- thinking (Claude thinking blocks)
- tool_use (function calls, with approval UI)
- tool_result (outputs, edits, file operations)
- file_change (edit diffs, syntax highlighted)
- next_action (agent planning cards)
- retry (inline retry editor)
```

### 3. TaskFollowUpSection (Chat Input)

**File:** `components/tasks/TaskFollowUpSection.tsx`  
**Size:** 815 lines (largest component)  
**Purpose:** Main interaction area - chat input, images, executor selection

**Complexity Highlights:**

```typescript
// State management (29 different pieces of state):
- followUpMessage (draft text)
- images (uploaded images)
- selectedProfile (executor + variant)
- isQueued (auto-send when ready)
- isSending, isStopping, isQueuing, isUnqueuing, ...
- conflictResolutionInstructions (derived)
- reviewMarkdown (from review comments)
- clickedMarkdown (from preview clicks)
```

**Major Sub-Components:**

1. **FollowUpEditorCard** (Rich text editor)
   - File tagging with `@filename`
   - File search/autocomplete
   - Paste image handling
   - Markdown formatting

2. **ExecutorProfileSelector** (Provider/Agent selection)
   - Dropdown: CLAUDE_CODE, ANTHROPIC, etc.
   - Variant selector: DEFAULT, Architect, Reviewer, etc.
   - Keyboard shortcut: `Shift+Tab` to cycle variants
   - Disabled when processes running (can't change mid-execution)

3. **ImageUploadSection** (Image management)
   - Drag & drop files
   - Paste from clipboard
   - Preview thumbnails
   - Upload to `/api/images` endpoint
   - Insert markdown: `![Image](image://uuid)`

4. **FollowUpStatusRow** (Status indicators)
   - Draft save status: "Saved", "Saving...", "Error"
   - Queue status: "Queued ✓", "Queuing..."
   - Draft loaded indicator

**Interaction Modes:**

| Agent Status | User Can | Button Shows | Keyboard |
|-------------|---------|-------------|----------|
| Idle | Type & Send | "Send ⏎" | Enter → Send |
| Running | Type & Queue | "Queue for Next Turn ⏎" | Enter → Queue |
| Running + Queued | View queued draft | "Edit (unqueue)" | Enter → Unqueue |
| Retry Active | - (disabled) | - | - |
| Pending Approval | - (disabled) | - | - |
| PR Merged | - (disabled) | - | - |

**Draft Autosave:**

```typescript
// useDraftAutosave hook
// - Debounced save (500ms)
// - Server endpoint: PUT /api/attempts/:id/follow-up-draft
// - Syncs: prompt, variant, image_ids
// - Status: 'saved' | 'saving' | 'error' | 'idle'
```

**Follow-Up Send Logic:**

```typescript
// useFollowUpSend hook handles TWO flows:

// 1. Regular tasks (attempt exists):
POST /api/attempts/:attemptId/follow-up
{
  prompt: string,
  variant: string | null,
  image_ids: string[],
  conflict_markdown: string | null,
  review_markdown: string | null,
  clicked_markdown: string | null
}

// 2. Master Genie (first message, no attempt):
POST /api/forge/master-genie/create-and-start
{
  prompt: string,
  variant: string | null,
  image_ids: string[],
  project_id: string
}
→ Returns { task_id, attempt_id }
→ Navigates to new task/attempt
```

**Conflict Resolution:**

```typescript
// When git conflicts detected:
1. FollowUpConflictSection shows:
   - Conflict file list
   - "Resolve Conflicts" button
   - "Abort" button (to undo operation)

2. Conflict markdown auto-appended to prompt:
   ```
   Please resolve the following conflicts:
   - file1.ts (12 conflicts)
   - file2.tsx (3 conflicts)
   
   Conflicted files:
   <<<<<<< HEAD
   [current code]
   =======
   [incoming code]
   >>>>>>> branch-name
   ```

3. Agent receives prompt + conflict markdown
4. Agent edits files to resolve conflicts
5. User reviews and sends follow-up
```

**Review Comments Integration:**

```typescript
// From ReviewProvider context:
const { comments, generateReviewMarkdown, clearComments } = useReview();

// Comments collected from DiffCard components
// Format:
```
<!-- Code Review Comments -->
File: path/to/file.ts
Line 42: Please add error handling here
Line 56: Consider using async/await

File: path/to/other.ts
Line 12: This could be extracted to a helper
```

// Appended to follow-up prompt
// "Clear Review Comments" button to discard
```

**Clicked Elements Integration:**

```typescript
// From ClickedElementsProvider:
const { generateMarkdown, clearElements } = useClickedElements();

// User clicks elements in preview iframe
// Format:
```
<!-- Clicked Elements -->
Component: Button (line 42 in components/Button.tsx)
Component: Header (line 12 in components/Header.tsx)
```

// Agent can navigate to these locations
```

**Keyboard Shortcuts:**

```typescript
// Scopes (from react-hotkeys-hook):
enum Scope {
  FOLLOW_UP = 'follow-up',          // When textarea focused
  FOLLOW_UP_READY = 'follow-up-ready' // When ready to send
}

// Shortcuts:
- Shift+Tab → Cycle executor variant
- Enter → Send/Queue (when FOLLOW_UP_READY)
- Esc → (handled by parent - close panel)
```

### 4. PreviewPanel (Dev Server Preview)

**File:** `components/panels/PreviewPanel.tsx`  
**Purpose:** Live preview of app in iframe, with click-to-component tracking

**Architecture:**

```
PreviewPanel
├─ Dev Server Management
│  ├─ useDevServer (start/stop/status)
│  ├─ useLogStream (real-time logs)
│  └─ useDevserverBuildState (parsing logs for status)
│
├─ URL Detection
│  ├─ useDevserverUrlFromLogs (auto-detect from logs)
│  └─ useManualPreviewUrl (user override)
│
├─ Preview State Machine
│  └─ useDevserverPreview (URL validation, polling)
│
└─ Click Tracking
   └─ ClickToComponentListener (postMessage bridge)
```

**Preview States:**

| State | Display | Actions Available |
|-------|---------|------------------|
| `noServer` | "No dev server running" | Start, Manual URL |
| `searching` | Spinner + Logs | Stop |
| `building` | Blue alert + Logs | Stop |
| `idle/error` | Red alert + Troubleshoot | Stop |
| `ready` | Iframe + Toolbar | Refresh, Copy URL, Stop |

**Dev Server Flow:**

```typescript
// 1. User clicks "Start Dev Server"
POST /api/attempts/:attemptId/dev-server/start
→ Creates ExecutionProcess
→ Runs project.dev_script (e.g., "npm run dev")

// 2. Log streaming starts
WebSocket: /api/execution-processes/:processId/logs
→ Parses logs for URL patterns:
   - "Local:   http://localhost:3000"
   - "ready started server on 0.0.0.0:3000"
   - etc.

// 3. URL detected → Preview shows iframe
<iframe src="http://localhost:3000" />

// 4. Click-to-component:
// - Preview injects forge-inspector package
// - User Alt+Clicks element
// - postMessage to parent window
// - ClickToComponentListener receives payload
// - Adds to ClickedElementsProvider
// - Shows in ClickedElementsBanner
// - User can append to follow-up
```

**Toolbar:**

```tsx
<PreviewToolbar>
  <Button>← Back</Button>
  <Button>→ Forward</Button>
  <Button>↻ Refresh</Button>
  <Input value={url} onChange={setManualUrl} />  {/* Manual URL override */}
  <Button>📋 Copy URL</Button>
  <Button variant="destructive">⏹ Stop</Button>
</PreviewToolbar>
```

**Build State Detection:**

```typescript
// useDev serverBuildState hook
// Parses logs for patterns:

type BuildState = 'idle' | 'building' | 'error';

// Building indicators:
- "[vite] connecting..."
- "compiling..."
- "wait - compiling ..."

// Success indicators:
- "compiled successfully"
- "✓ ready in"
- URL detected

// Error indicators:
- "Failed to compile"
- "ERROR in"
- "✘ [ERROR]"
```

**Manual URL Override:**

```typescript
// User can override auto-detected URL
// Use case: Expo Go, tunnels, custom ports
localStorage.setItem(`manualPreviewUrl:${projectId}`, url);

// Reset button clears override
// Toolbar shows different color when manual
```

**Mobile Considerations:**

- ⚠️ Iframe may not work on mobile (cross-origin, gestures)
- 🔴 Click-to-component requires browser desktop features
- ⚠️ Toolbar cramped on small screens
- 🔴 No mobile dev server (can't run npm on phone)

### 5. DiffsPanel (Code Changes View)

**File:** `components/panels/DiffsPanel.tsx`  
**Purpose:** Show git diffs for all changed files in the attempt

**Architecture:**

```
DiffsPanel
├─ useDiffStream (WebSocket stream of diffs)
├─ useDiffSummary (totals: files, +lines, -lines)
└─ Virtuoso (virtualized diff list)
   └─ DiffCard[] (one per file)
```

**Diff Streaming:**

```typescript
// useDiffStream hook
WebSocket: /api/attempts/:attemptId/diffs/stream

// Message format:
{ 
  change: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied',
  oldPath: string | null,
  newPath: string | null,
  hunks: DiffHunk[]  // Unified diff format
}

// Hunks structure:
{
  oldStart: number,
  oldLines: number,
  newStart: number,
  newLines: number,
  lines: string[]  // Each line: ' ' | '+' | '-' prefix
}
```

**DiffCard Component:**

```tsx
<DiffCard>
  <DiffCardHeader>
    <FileIcon />
    <Collapse/Expand Button>
    <FilePath>src/components/Button.tsx</FilePath>
    <Badge>+42 -12</Badge>
  </DiffCardHeader>
  
  {expanded && (
    <DiffCardContent>
      <DiffViewSwitch />  {/* Split | Unified */}
      {viewMode === 'split' ? (
        <SplitView oldLines={...} newLines={...} />
      ) : (
        <UnifiedView lines={...} />
      )}
    </DiffCardContent>
  )}
</DiffCard>
```

**Syntax Highlighting:**

```typescript
// Uses shiki for syntax highlighting
// Language detection from file extension
import { extToLanguage } from '@/utils/extToLanguage';

// Supported: ts, tsx, js, jsx, json, css, html, py, go, rs, ...
// Fallback: 'text' (no highlighting)
```

**Collapse Behavior:**

```typescript
// Default collapsed: deleted, renamed, copied, permissionChange
// Always expanded: added, modified

// User can toggle individual files
// "Collapse All" / "Expand All" button in toolbar
```

**Git Operations Integration:**

```tsx
{gitOps && (
  <GitOperations
    selectedAttempt={attempt}
    projectId={projectId}
    branchStatus={branchStatus}
    branches={branches}
    isAttemptRunning={isRunning}
  />
)}

// Shows:
// - Current branch
// - Target branch selector
// - "Create PR" button
// - "Rebase" button
// - "Push" button
// - Conflict indicators
```

**Mobile Considerations:**

- ⚠️ Diffs very wide (need horizontal scroll)
- 🔴 Split view unusable on small screens
- ⚠️ Touch gestures not optimized
- ⚠️ Syntax highlighting may be slow

### 6. TaskKanbanBoard (Project Tasks View)

**File:** `components/tasks/TaskKanbanBoard.tsx`  
**Purpose:** Kanban board with drag-and-drop task cards

**Structure:**

```tsx
<DndContext onDragEnd={handleDragEnd}>
  <div className="flex gap-4">  {/* Horizontal layout */}
    {TASK_STATUSES.map(status => (
      <KanbanColumn status={status}>
        <ColumnHeader>{status} ({count})</ColumnHeader>
        <SortableContext items={tasks}>
          {tasks.map(task => (
            <TaskCard 
              task={task}
              onClick={() => onViewTaskDetails(task)}
              selected={task.id === selectedTask?.id}
            />
          ))}
        </SortableContext>
      </KanbanColumn>
    ))}
  </div>
</DndContext>
```

**Columns:**

1. **Todo** (gray)
2. **In Progress** (blue, spinner)
3. **In Review** (purple)
4. **Done** (green, checkmark)
5. **Cancelled** (red, X)

**TaskCard Component:**

```tsx
<Card 
  className={cn(
    "cursor-pointer",
    selected && "ring-2 ring-primary",
    isDragging && "opacity-50"
  )}
>
  <CardHeader>
    <TaskRelationshipBreadcrumb />  {/* Parent task links */}
    <TaskRelationshipBadges />      {/* Child count, agent icon */}
    <Title>{task.title}</Title>
  </CardHeader>
  <CardContent>
    <Description>{task.description}</Description>
    <Tags>{task.tags.map(tag => <Badge />)}</Tags>
    <Metadata>
      <LastAttemptStatus />  {/* running, complete, failed */}
      <Timestamp />
    </Metadata>
  </CardContent>
</Card>
```

**Drag & Drop:**

```typescript
// Library: @dnd-kit/core + @dnd-kit/sortable

// On drop:
async function handleDragEnd(event: DragEndEvent) {
  const taskId = event.active.id;
  const newStatus = event.over.id;
  
  // Optimistic update (not implemented - would require local state)
  // API call:
  await tasksApi.update(taskId, { status: newStatus });
  
  // Analytics:
  posthog.capture('kanban_task_dragged', {
    from_status, to_status, tasks_in_source, tasks_in_target
  });
}
```

**Mobile Considerations:**

- 🔴 Horizontal scroll required (5 columns)
- ⚠️ Drag-and-drop requires long-press on mobile
- ⚠️ Cards small, hard to tap
- 🔴 No vertical stacking mode

### 7. DisplayConversationEntry (Message Rendering)

**File:** `components/NormalizedConversation/DisplayConversationEntry.tsx`  
**Size:** 24,082 bytes (largest single component)  
**Purpose:** Render every type of conversation entry

**Entry Type Dispatch:**

```typescript
// Main entry types:
switch (entry.entry_type.type) {
  case 'text':
    return <UserMessage /> || <AssistantMessage />;
  
  case 'thinking':
    return <ThinkingBlock />;  // Claude's reasoning
  
  case 'tool_use':
    if (entry.entry_type.status === 'pending_approval') {
      return <PendingApprovalEntry />;  // Approval UI
    }
    return <ToolUseCard />;  // Function call display
  
  case 'tool_result':
    if (entry.entry_type.content_type === 'file_change') {
      return <FileChangeRenderer />;  // Edit diff
    }
    if (entry.entry_type.content_type === 'edit_diff') {
      return <EditDiffRenderer />;  // Search/replace diff
    }
    return <ToolResultCard />;  // Generic result
  
  case 'next_action':
    return <NextActionCard />;  // Agent planning
  
  case 'retry':
    return <RetryEditorInline />;  // Inline retry UI
}
```

**Sub-Components:**

1. **UserMessage** - User's text + images
2. **AssistantMessage** - Agent response (markdown rendered)
3. **ThinkingBlock** - Collapsible thinking
4. **PendingApprovalEntry** - Approve/Reject UI with form
5. **ToolUseCard** - Function call details
6. **FileChangeRenderer** - Edit diff with syntax highlighting
7. **EditDiffRenderer** - Search/replace visualization
8. **NextActionCard** - Agent's next steps
9. **RetryEditorInline** - Edit and retry failed step

**Approval Flow:**

```tsx
// When agent requests approval:
<PendingApprovalEntry>
  <ApprovalFormProvider>  {/* Form state management */}
    <Card>
      <Header>
        <ToolIcon />
        <ToolName>bash</ToolName>
        <Badge>Pending Approval</Badge>
      </Header>
      
      <Content>
        <ToolInput>
          {/* JSON form rendered by @rjsf/core */}
          <Form 
            schema={jsonSchema}
            uiSchema={uiSchema}
            formData={formData}
            onChange={handleChange}
          />
        </ToolInput>
      </Content>
      
      <Actions>
        <Button onClick={handleApprove}>✓ Approve</Button>
        <Button onClick={handleReject} variant="destructive">
          ✗ Reject
        </Button>
      </Actions>
    </Card>
  </ApprovalFormProvider>
</PendingApprovalEntry>

// On approve:
POST /api/approvals/:approvalId/respond
{ response: 'approved', edited_input: {...} }

// On reject:
POST /api/approvals/:approvalId/respond
{ response: 'rejected', reason: 'User rejected' }
```

**Retry Flow:**

```tsx
// When step fails, show retry editor:
<RetryEditorInline>
  <Card>
    <Header>
      <AlertCircle />
      <Title>Step Failed - Retry Available</Title>
      <Badge variant="destructive">failed</Badge>
    </Header>
    
    <Content>
      <ErrorDetails>{error.message}</ErrorDetails>
      
      <Tabs>
        <Tab value="guided">Guided Retry</Tab>
        <Tab value="custom">Custom Instructions</Tab>
      </Tabs>
      
      {mode === 'guided' ? (
        <GuidedRetryForm>
          <Checkbox>Fix the error</Checkbox>
          <Checkbox>Try a different approach</Checkbox>
          <Checkbox>Skip this step</Checkbox>
          <Textarea>Additional context...</Textarea>
        </GuidedRetryForm>
      ) : (
        <Textarea
          value={customInstructions}
          placeholder="Describe what to do differently..."
        />
      )}
    </Content>
    
    <Actions>
      <Button onClick={handleRetry}>🔄 Retry with Instructions</Button>
      <Button onClick={handleSkip}>⏭ Skip Step</Button>
    </Actions>
  </Card>
</RetryEditorInline>

// On retry:
POST /api/execution-processes/:processId/retry
{
  retry_instructions: string,
  execution_variant: string | null
}

// Creates new sub-process with retry context
// Hooks back into ExecutionProcessesProvider
// Real-time logs stream to VirtualizedList
```

**File Change Rendering:**

```tsx
// For edit tool results:
<FileChangeRenderer change={...}>
  <Card>
    <Header>
      <FileIcon />
      <FilePath>src/components/Button.tsx</FilePath>
      <Badge>Modified</Badge>
    </Header>
    
    <DiffView>
      {/* Unified or split diff */}
      <SyntaxHighlightedDiff
        oldContent={before}
        newContent={after}
        language={language}
        viewMode={viewMode}
      />
    </DiffView>
    
    <Actions>
      <Button onClick={() => openInEditor(file, line)}>
        Open in Editor
      </Button>
    </Actions>
  </Card>
</FileChangeRenderer>
```

**Mobile Considerations:**

- ⚠️ Nested cards can be cramped
- ⚠️ Diffs need horizontal scroll
- ⚠️ Forms may be hard to interact with
- ⚠️ Approval buttons need better spacing

---

## Interactive Features

### 1. Follow-Up Chat Input

**Location:** `TaskFollowUpSection` component  
**Complexity:** High (815 lines, 29 state variables)

**Features:**

1. **Rich Text Editor**
   - File tagging with `@`
   - Markdown formatting
   - Image paste/drag-drop
   - Auto-save draft (500ms debounce)

2. **Image Management**
   - Upload: POST `/api/images`
   - Preview thumbnails
   - Delete before send
   - Markdown insertion: `![](image://uuid)`

3. **Executor Selection**
   - Provider dropdown (CLAUDE_CODE, ANTHROPIC, etc.)
   - Variant selector (DEFAULT, Architect, etc.)
   - Keyboard cycle: Shift+Tab
   - Disabled when running

4. **Queue System**
   - Type follow-up while agent running
   - Auto-send when agent completes
   - Edit button to unqueue
   - Visual indicator: "Queued ✓"

5. **Draft Persistence**
   - Auto-save to server
   - Syncs across tabs
   - Status: "Saved" / "Saving..."
   - Restored on page reload

**State Machine:**

```
Idle
├─ User typing → Autosave draft
├─ User sends → Sending → Execution starts → Running
└─ User exits → Draft saved

Running
├─ User types → Queue for next turn → Queued
├─ Agent completes → Auto-send queued draft
└─ User stops → Idle

Queued (while running)
├─ User edits → Unqueue → Running (can type)
└─ Agent completes → Auto-send → New execution
```

### 2. Code Review System

**Location:** `ReviewProvider` context + `DiffCard` components

**User Flow:**

```
1. User views diffs in DiffsPanel
2. User clicks "+ Add Comment" on any line
3. Inline comment editor appears:
   ┌────────────────────────────────┐
   │ Line 42:                       │
   │ ┌──────────────────────────┐  │
   │ │ Enter review comment...  │  │
   │ └──────────────────────────┘  │
   │ [Cancel] [Add Comment]         │
   └────────────────────────────────┘
4. Comment stored in ReviewProvider context
5. Comment appears in FollowUpSection (read-only preview)
6. User sends follow-up
7. Comments formatted as markdown and appended to prompt
8. Agent receives instructions to address comments
9. Comments cleared after send
```

**Review Comment Format:**

```markdown
<!-- Code Review Comments -->

File: src/components/Button.tsx
Line 42: Please add error handling here
Line 56: Consider using async/await

File: src/utils/helpers.ts
Line 12: This could be extracted to a helper function
Line 25: Add JSDoc comment
```

**Implementation:**

```typescript
// ReviewProvider context
interface ReviewComment {
  file: string;
  line: number;
  comment: string;
  id: string;
}

const ReviewProvider = ({ children }) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  
  const addComment = (file, line, comment) => {
    setComments(prev => [...prev, { file, line, comment, id: uuid() }]);
  };
  
  const removeComment = (id) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };
  
  const clearComments = () => {
    setComments([]);
  };
  
  const generateReviewMarkdown = () => {
    // Group by file, sort by line, format as markdown
    const grouped = groupBy(comments, 'file');
    return Object.entries(grouped)
      .map(([file, comments]) => {
        const sorted = sortBy(comments, 'line');
        return `File: ${file}\n${sorted.map(c => `Line ${c.line}: ${c.comment}`).join('\n')}`;
      })
      .join('\n\n');
  };
  
  return (
    <ReviewContext.Provider value={{ 
      comments, 
      addComment, 
      removeComment, 
      clearComments,
      generateReviewMarkdown 
    }}>
      {children}
    </ReviewContext.Provider>
  );
};
```

### 3. Clicked Elements Tracking

**Location:** `ClickedElementsProvider` + `ClickToComponentListener`

**User Flow:**

```
1. User starts dev server (Preview mode)
2. App loads in iframe with forge-inspector injected
3. User Alt+Clicks an element (button, header, etc.)
4. forge-inspector sends postMessage to parent:
   {
     type: 'genie:open-in-editor',
     file: 'src/components/Button.tsx',
     line: 42,
     column: 8,
     name: 'Button'
   }
5. ClickToComponentListener receives message
6. Adds to ClickedElementsProvider context
7. ClickedElementsBanner appears:
   ┌─────────────────────────────────────┐
   │ 🎯 2 clicked elements               │
   │ • Button (line 42)                  │
   │ • Header (line 12)                  │
   │ [Clear] [Add to Follow-up]          │
   └─────────────────────────────────────┘
8. User clicks "Add to Follow-up"
9. Markdown appended to follow-up prompt
10. Agent navigates to these components
```

**Clicked Elements Format:**

```markdown
<!-- Clicked Elements -->

Component: Button (line 42 in src/components/Button.tsx)
Component: Header (line 12 in src/components/layout/Header.tsx)
```

**Implementation:**

```typescript
// ClickToComponentListener utility
class ClickToComponentListener {
  constructor(callbacks: {
    onOpenInEditor: (payload) => void;
    onReady: () => void;
  }) {
    this.callbacks = callbacks;
  }
  
  start() {
    window.addEventListener('message', this.handleMessage);
  }
  
  stop() {
    window.removeEventListener('message', this.handleMessage);
  }
  
  private handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'genie:open-in-editor') {
      this.callbacks.onOpenInEditor(event.data);
    }
    if (event.data.type === 'genie:inspector-ready') {
      this.callbacks.onReady();
    }
  };
}

// ClickedElementsProvider
const ClickedElementsProvider = ({ attempt, children }) => {
  const [elements, setElements] = useState<ClickedElement[]>([]);
  
  const addElement = (payload) => {
    setElements(prev => [...prev, {
      id: uuid(),
      file: payload.file,
      line: payload.line,
      name: payload.name,
      timestamp: Date.now()
    }]);
  };
  
  const clearElements = () => {
    setElements([]);
  };
  
  const generateMarkdown = () => {
    return elements
      .map(el => `Component: ${el.name} (line ${el.line} in ${el.file})`)
      .join('\n');
  };
  
  return (
    <ClickedElementsContext.Provider value={{
      elements,
      addElement,
      clearElements,
      generateMarkdown
    }}>
      {children}
    </ClickedElementsContext.Provider>
  );
};
```

**forge-inspector Package:**

```typescript
// Injected into preview iframe
// Adds Alt+Click listener to all elements
// Uses React DevTools fiber tree to find component source
// Falls back to DOM introspection
// Sends postMessage to parent window
```

### 4. Task Creation & Editing

**Location:** `openTaskForm()` function + `TaskFormDialog`

**Task Form Fields:**

```typescript
interface CreateTask {
  title: string;              // Required
  description?: string;       // Optional (markdown)
  status: TaskStatus;        // Default: 'todo'
  parent_task_attempt?: string;  // Optional parent link
  image_ids?: string[];      // Optional images
}
```

**Form Dialog:**

```tsx
<TaskFormDialog mode="create" | "edit">
  <Form>
    <Input label="Title" required />
    <Textarea label="Description" rows={5} />
    <ImageUploadSection />
    <Select label="Status">
      <Option value="todo">To Do</Option>
      <Option value="inprogress">In Progress</Option>
      <Option value="inreview">In Review</Option>
      <Option value="done">Done</Option>
      <Option value="cancelled">Cancelled</Option>
    </Select>
    <Button type="submit">Create Task</Button>
  </Form>
</TaskFormDialog>
```

**Keyboard Shortcut:**

- `n` (in kanban scope) → Opens create task dialog
- Analytics: `keyboard_shortcut_used` event

### 5. Git Operations

**Location:** `GitOperations` component in `DiffsPanel`

**Available Actions:**

1. **Change Target Branch**
   ```tsx
   <BranchSelector
     branches={branches}
     currentBranch={targetBranch}
     onSelect={handleChangeTarget}
   />
   ```

2. **Create Pull Request**
   ```tsx
   <Button onClick={openCreatePRDialog}>
     Create PR
   </Button>
   
   // Opens CreatePRDialog:
   <Dialog>
     <Input label="PR Title" />
     <Textarea label="PR Description" rows={10} />
     <Checkbox label="Draft PR" />
     <Button onClick={handleCreatePR}>Create</Button>
   </Dialog>
   
   // API:
   POST /api/attempts/:attemptId/github/pr
   {
     title: string,
     body: string,
     draft: boolean
   }
   ```

3. **Rebase onto Target**
   ```tsx
   <Button 
     onClick={openRebaseDialog}
     disabled={isConflicted}
   >
     Rebase
   </Button>
   
   // Opens RebaseDialog:
   <Dialog>
     <Alert>
       This will rebase {attemptBranch} onto {targetBranch}
     </Alert>
     <Button onClick={handleRebase}>Rebase</Button>
   </Dialog>
   
   // API:
   POST /api/attempts/:attemptId/rebase
   {
     target_branch: string
   }
   ```

4. **Push to Remote**
   ```tsx
   <Button onClick={handlePush}>
     Push
   </Button>
   
   // API:
   POST /api/attempts/:attemptId/git-push
   ```

**Conflict Handling:**

```
1. User performs git operation (rebase, merge, etc.)
2. Server returns conflict status via BranchStatus
3. FollowUpConflictSection appears:
   ┌──────────────────────────────────────┐
   │ ⚠️ Git Conflicts Detected           │
   │                                      │
   │ Conflicted files:                    │
   │ • src/components/Button.tsx (12)    │
   │ • src/utils/helpers.ts (3)          │
   │                                      │
   │ [View Diffs] [Resolve] [Abort]     │
   └──────────────────────────────────────┘
4. User clicks "Resolve"
5. Conflict resolution markdown auto-generated
6. Agent receives instructions to resolve conflicts
7. Agent edits files to resolve
8. Conflict banner disappears when resolved
```

### 6. Execution Process Management

**Location:** `useExecutionProcesses` hook + `ExecutionProcessesProvider`

**Process Lifecycle:**

```
Created → Running → (Paused) → Complete | Failed

// User actions:
- View logs (always available)
- Stop (when running)
- Retry (when failed)
- View in full-page (opens /full route)
```

**Process Types:**

1. **Main Execution** - Primary task execution
2. **Dev Server** - `npm run dev` or similar
3. **Retry** - Retrying a failed step
4. **Sub-execution** - Nested execution (rare)

**ViewProcessesDialog:**

```tsx
<Dialog>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Status</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Started</TableHead>
        <TableHead>Duration</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {processes.map(process => (
        <TableRow>
          <TableCell>
            <Badge variant={statusVariant}>
              {process.status}
            </Badge>
          </TableCell>
          <TableCell>{process.type}</TableCell>
          <TableCell>{formatTimestamp(process.started_at)}</TableCell>
          <TableCell>{formatDuration(process.duration)}</TableCell>
          <TableCell>
            <Button onClick={() => viewLogs(process)}>
              View Logs
            </Button>
            {process.status === 'failed' && (
              <Button onClick={() => retryProcess(process)}>
                Retry
              </Button>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Dialog>
```

---

## Data Flow Architecture

### Real-Time Streaming

Forge heavily uses **WebSocket** and **SSE (Server-Sent Events)** for real-time updates.

#### WebSocket Streams (JSON Patch)

**Pattern:** `useJsonPatchWsStream` hook

```typescript
// Generic hook for WebSocket streams using JSON Patch (RFC 6902)
const { data, isConnected, error } = useJsonPatchWsStream(
  endpoint,    // WebSocket URL
  enabled,     // Enable/disable stream
  initialData, // Initial data factory
  {
    injectInitialEntry,    // Called once on start
    deduplicatePatches     // Filter redundant patches
  }
);

// How it works:
// 1. Connects to ws://... endpoint
// 2. Receives messages: { JsonPatch: Operation[] }
// 3. Applies patches to data using rfc6902 library
// 4. Re-renders component with updated data
// 5. Reconnects on disconnect (exponential backoff)
// 6. Terminates on { finished: true }
```

**WebSocket Endpoints:**

| Endpoint | Hook | Purpose | Data Shape |
|----------|------|---------|------------|
| `/api/attempts/:id/diffs/stream` | `useDiffStream` | Code changes | `Diff[]` |
| `/api/execution-processes/:id/logs` | `useLogStream` | Process logs | `LogEntry[]` |
| `/api/attempts/:id/follow-up-draft` | `useDraftStream` | Follow-up draft | `Draft` |

**JSON Patch Example:**

```json
// Initial data:
{ "diffs": [] }

// Patch message 1:
{ "JsonPatch": [
  { "op": "add", "path": "/diffs/0", "value": { "file": "a.ts", ... } }
] }

// Result:
{ "diffs": [{ "file": "a.ts", ... }] }

// Patch message 2:
{ "JsonPatch": [
  { "op": "add", "path": "/diffs/1", "value": { "file": "b.ts", ... } }
] }

// Result:
{ "diffs": [{ "file": "a.ts", ... }, { "file": "b.ts", ... }] }

// Finished:
{ "finished": true }
```

#### SSE Streams

**Pattern:** `useConversationHistory` hook

```typescript
// SSE for conversation history (logs, messages, tool calls)
const { entries, loading } = useConversationHistory({ attempt });

// Endpoint: GET /api/attempts/:id/logs (Accept: text/event-stream)

// Event types:
// - data: { ... }         → Initial data or full update
// - json_patch: [...]     → JSON Patch operations
// - finished: true        → Stream complete
// - error: { ... }        → Error occurred
```

**SSE vs WebSocket:**

- **SSE:** Conversation history (complex nested data, historical events)
- **WebSocket:** Simpler streams (diffs, logs, drafts)
- Both use JSON Patch for incremental updates

### Task Streaming

**Hook:** `useProjectTasks`

```typescript
// Streams all tasks for a project
const { tasks, tasksById, isLoading, error } = useProjectTasks(projectId);

// Endpoint: GET /api/projects/:projectId/tasks (Accept: text/event-stream)

// Returns:
// - tasks: TaskWithAttemptStatus[]  (array for rendering)
// - tasksById: Record<string, Task>  (object for quick lookup)

// Auto-updates when:
// - New task created
// - Task status changed
// - Task deleted
// - Attempt status changed
```

**TaskWithAttemptStatus:**

```typescript
interface TaskWithAttemptStatus extends Task {
  // Last attempt info (for card rendering):
  last_attempt_status: 'running' | 'complete' | 'failed' | null;
  last_attempt_id: string | null;
  last_attempt_started_at: string | null;
  
  // Relationship counts:
  child_task_count: number;
  parent_task_id: string | null;
}
```

### Diff Streaming

**Hook:** `useDiffStream`

```typescript
const { diffs, error } = useDiffStream(attemptId, enabled);

// WebSocket: /api/attempts/:attemptId/diffs/stream

// Returns: Diff[] (array of file changes)

interface Diff {
  change: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'permissionChange';
  oldPath: string | null;
  newPath: string | null;
  hunks: DiffHunk[];
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];  // Each line: ' ' | '+' | '-' prefix
}
```

### Log Streaming

**Hook:** `useLogStream`

```typescript
const { logs, error } = useLogStream(executionProcessId);

// WebSocket: /api/execution-processes/:processId/logs

// Returns: LogEntry[] (array of log lines)

interface LogEntry {
  timestamp: string;
  content: string;
  level: 'stdout' | 'stderr';
}
```

### Draft Streaming

**Hook:** `useDraftStream`

```typescript
const { draft, isDraftLoaded } = useDraftStream(attemptId, taskId);

// WebSocket: /api/attempts/:attemptId/follow-up-draft

// Returns: Draft (follow-up draft state)

interface Draft {
  prompt: string;
  variant: string | null;
  image_ids: string[];
  queued: boolean;
  sending: boolean;
  updated_at: string;
}
```

### API Endpoints (REST)

**Base URL:** `http://localhost:3000/api` (configurable)

**Projects:**
```
GET    /api/projects                      → List projects (SSE stream)
GET    /api/projects/:id                  → Get project
POST   /api/projects                      → Create project
PATCH  /api/projects/:id                  → Update project
DELETE /api/projects/:id                  → Delete project
GET    /api/projects/:id/branches         → List git branches
```

**Tasks:**
```
GET    /api/projects/:projectId/tasks     → List tasks (SSE stream)
GET    /api/tasks/:id                     → Get task
POST   /api/tasks                         → Create task
PATCH  /api/tasks/:id                     → Update task
DELETE /api/tasks/:id                     → Delete task
GET    /api/tasks/:id/relationships       → Get parent/child tasks
```

**Attempts:**
```
GET    /api/tasks/:taskId/attempts        → List attempts
POST   /api/tasks/:taskId/attempts        → Create attempt
GET    /api/attempts/:id                  → Get attempt
GET    /api/attempts/:id/logs             → Stream logs (SSE)
POST   /api/attempts/:id/follow-up        → Send follow-up
POST   /api/attempts/:id/stop             → Stop execution
```

**Follow-Up:**
```
GET    /api/attempts/:id/follow-up-draft  → Get draft (WebSocket)
PUT    /api/attempts/:id/follow-up-draft  → Save draft
POST   /api/attempts/:id/follow-up-draft/queue   → Queue draft
POST   /api/attempts/:id/follow-up-draft/unqueue → Unqueue draft
```

**Diffs:**
```
GET    /api/attempts/:id/diffs/stream     → Stream diffs (WebSocket)
GET    /api/attempts/:id/diffs/summary    → Get summary (+/- counts)
```

**Git Operations:**
```
POST   /api/attempts/:id/github/pr        → Create PR
POST   /api/attempts/:id/rebase           → Rebase attempt
POST   /api/attempts/:id/git-push         → Push to remote
POST   /api/attempts/:id/change-target-branch → Change target
GET    /api/attempts/:id/branch-status    → Get branch status
```

**Dev Server:**
```
POST   /api/attempts/:id/dev-server/start → Start dev server
POST   /api/attempts/:id/dev-server/stop  → Stop dev server
GET    /api/dev-server/status             → Get status
```

**Images:**
```
POST   /api/images                        → Upload image
DELETE /api/images/:id                    → Delete image
GET    /api/images/:id                    → Get image (binary)
```

**Approvals:**
```
POST   /api/approvals/:id/respond         → Approve/reject
```

**Config:**
```
GET    /api/config                        → Get user config
PUT    /api/config                        → Update config
```

**Auth:**
```
POST   /api/auth/device/start             → Start GitHub device flow
POST   /api/auth/device/poll              → Poll device flow
GET    /api/auth/check-token              → Check token validity
POST   /api/auth/logout                   → Logout
```

---

## Current Mobile Support

### Responsive Strategy

Forge uses a **binary responsive strategy** with a single breakpoint:

```typescript
// Breakpoint: 1280px (xl:)
const isXL = useMediaQuery('(min-width: 1280px)');
const isMobile = !isXL;

// Two completely different UX:
// - Desktop (xl:): Resizable dual panels, all features
// - Mobile (<xl:): Single panel at a time, limited features
```

### What Works on Mobile

✅ **Projects Page** - Grid layout, works well  
✅ **Settings Pages** - Forms work, some cramping  
✅ **Task List (Kanban)** - Horizontal scroll, usable  
✅ **Task Detail (Chat only)** - Full screen chat, good  
✅ **Full-Page Logs** - Dedicated route, excellent  
✅ **Release Notes** - Static content, perfect  

### What Doesn't Work on Mobile

🔴 **Kanban + Chat Side-by-Side** - Binary view (either/or)  
🔴 **Preview Mode** - Not available on mobile  
🔴 **Diffs Mode** - Not available on mobile  
🔴 **Resizable Panels** - Desktop drag handles don't work  
🔴 **Keyboard Shortcuts** - None work on mobile  
🔴 **Diff Viewing** - Requires horizontal scroll, poor UX  
🔴 **Code Review** - Inline comments hard to tap  
🔴 **Click-to-Component** - Preview feature desktop-only  
🔴 **Drag-and-Drop Tasks** - Requires long-press, janky  
🔴 **Split Diff View** - Too narrow, unreadable  
🔴 **Multi-Column Kanban** - Horizontal scroll required  

### Mobile-Specific Code

**TasksLayout Mobile Implementation:**

```tsx
// Mobile: CSS Grid with animated column widths
if (isMobile) {
  const columns = isPanelOpen 
    ? ['0fr', '1fr', '0fr']    // Only chat visible
    : ['1fr', '0fr', '0fr'];   // Only kanban visible
    
  return (
    <div 
      style={{
        gridTemplateColumns: `minmax(0, ${columns[0]}) minmax(0, ${columns[1]}) minmax(0, ${columns[2]})`,
        transition: 'grid-template-columns 250ms cubic-bezier(0.2, 0, 0, 1)'
      }}
    >
      <div>{kanban}</div>
      <div>{attempt}</div>
      <div>{aux}</div>  {/* Never visible on mobile */}
    </div>
  );
}
```

**Problems with Current Approach:**

1. **No Preview/Diffs on Mobile** - aux panel never rendered
2. **No Side-by-Side** - Can't see kanban while chatting
3. **Jarring Transitions** - Full panel swap, no context
4. **No Touch Gestures** - No swipe to navigate
5. **No Mobile-Specific UI** - Desktop components scaled down

### Responsive Utilities

```typescript
// Only utility: useMediaQuery
const isXL = useMediaQuery('(min-width: 1280px)');

// No utilities for:
// - Touch detection
// - Gesture handling
// - Mobile-specific layouts
// - Adaptive components
// - Orientation changes
```

---

## Component Inventory

### By Category

#### Navigation Components (5)

1. **NormalLayout** - Main app layout with header/footer
2. **Breadcrumb** - Navigation breadcrumbs (project → task → attempt)
3. **ProjectSelector** - Dropdown to switch projects
4. **Sidebar** - Settings sidebar navigation
5. **Footer** - App footer with version, links

#### Task Components (17)

1. **TaskKanbanBoard** - Kanban board container
2. **TaskCard** - Individual task card
3. **TaskPanel** - Task detail panel (no attempt)
4. **TaskAttemptPanel** - Attempt detail panel ★★★
5. **TaskFollowUpSection** - Follow-up chat input ★★★
6. **TaskRelationshipBreadcrumb** - Parent task navigation
7. **TaskRelationshipBadges** - Child/agent badges
8. **TaskRelationshipCard** - Related task card
9. **TaskRelationshipViewer** - All relationships view
10. **TodoPanel** - TODO list for attempt
11. **BranchSelector** - Git branch dropdown
12. **VariantSelector** - Executor variant dropdown
13. **FollowUpStatusRow** - Draft/queue status
14. **ConflictBanner** - Git conflict warning
15. **ClickedElementsBanner** - Preview clicked elements
16. **FollowUpConflictSection** - Conflict resolution UI
17. **FollowUpEditorCard** - Rich text editor

#### Conversation Components (9)

1. **DisplayConversationEntry** - Message dispatcher ★★★
2. **UserMessage** - User text + images
3. **AssistantMessage** - Agent markdown response
4. **PendingApprovalEntry** - Approval form ★★
5. **NextActionCard** - Agent planning card
6. **FileChangeRenderer** - Edit diff display
7. **EditDiffRenderer** - Search/replace diff
8. **FileContentView** - File content viewer
9. **RetryEditorInline** - Retry UI ★★

#### Panel Components (7)

1. **TaskPanel** - Task-level details
2. **TaskAttemptPanel** - Attempt-level details ★★★
3. **PreviewPanel** - Dev server preview ★★
4. **DiffsPanel** - Code diffs ★★
5. **ChatPanelActions** - Chat header actions
6. **AttemptHeaderActions** - Attempt header actions
7. **TaskPanelHeaderActions** - Task header actions

#### Layout Components (8)

1. **TasksLayout** - Main task/attempt layout ★★★
2. **ResponsiveTwoPane** - Deprecated dual-pane layout
3. **NormalLayout** - App shell layout
4. **SettingsLayout** - Settings page layout
5. **ProjectsLayout** - Projects page layout
6. **GridLayout** - Utility grid layout
7. **SplitView** - Desktop split panels
8. **MobileStack** - Mobile stacked views (not implemented)

#### Dialog Components (40+)

**Task Dialogs (13):**
- CreateAttemptDialog ★
- TaskFormDialog ★★
- CreatePRDialog
- RebaseDialog
- ChangeTargetBranchDialog
- DeleteTaskConfirmationDialog
- EditorSelectionDialog
- GitActionsDialog
- RestoreLogsDialog
- TagEditDialog
- ViewProcessesDialog
- ViewRelatedTasksDialog

**Global Dialogs (7):**
- OnboardingDialog
- DisclaimerDialog
- GitHubLoginDialog
- PrivacyOptInDialog
- ReleaseNotesDialog
- KeyboardShortcutsDialog

**Settings Dialogs (3):**
- ExecutorProfileDialog
- McpServerDialog
- ProjectSettingsDialog

**Shared Dialogs (5):**
- ConfirmDialog
- AlertDialog
- InputDialog
- SelectDialog
- FormDialog

#### Form Components (15+)

1. **ExecutorProfileSelector** - Provider + variant dropdowns ★
2. **ImageUploadSection** - Image upload + preview ★
3. **FollowUpEditorCard** - Rich text editor ★
4. **TagInput** - Tag creation input
5. **FileSelector** - File browser/search
6. **BranchSelector** - Git branch dropdown
7. **VariantSelector** - Executor variant dropdown
8. **JsonSchemaForm** - @rjsf/core wrapper
9. **MarkdownEditor** - Markdown WYSIWYG
10. **CodeEditor** - Monaco code editor
11. **SearchInput** - Search with suggestions
12. **DatePicker** - Date selection
13. **TimePicker** - Time selection
14. **ColorPicker** - Color selection
15. **MultiSelect** - Multiple selection

#### Log Components (5)

1. **VirtualizedList** - Conversation history ★★★
2. **LogViewer** - Terminal-style logs
3. **DevServerLogsView** - Dev server logs
4. **ProcessLogsView** - Process logs
5. **FullAttemptLogsPage** - Full-page logs

#### Diff Components (5)

1. **DiffCard** - File diff card ★
2. **DiffViewSwitch** - Split/unified toggle
3. **SplitDiffView** - Side-by-side diff
4. **UnifiedDiffView** - Unified diff
5. **SyntaxHighlighter** - Code highlighting

#### Settings Components (10)

1. **GeneralSettings** - User preferences ★
2. **ProjectSettings** - Project config ★
3. **AgentSettings** - Executor profiles ★★
4. **McpSettings** - MCP servers ★★
5. **ThemeSelector** - Dark/light/system
6. **EditorSelector** - VSCode/Cursor/etc.
7. **LanguageSelector** - i18n (future)
8. **AnalyticsSettings** - Privacy controls
9. **KeyboardShortcutsSettings** - Hotkey config
10. **AdvancedSettings** - Debug options

#### UI Primitives (50+)

*From shadcn/ui:*
- Button, Input, Textarea, Select, Checkbox, Radio
- Card, Badge, Avatar, Tooltip, Popover, Dialog
- Alert, Toast, Loader, Spinner, Progress, Skeleton
- Accordion, Tabs, Separator, ScrollArea
- DropdownMenu, ContextMenu, MenuBar, Collapsible
- Calendar, DatePicker, Slider, Switch, Toggle
- Table, DataTable, Pagination, Command, Combobox
- Form, Label, FormField, FormMessage
- Sheet, HoverCard, AlertDialog, Breadcrumb
- ResizablePanel, PanelGroup, PanelResizeHandle

---

## Technical Stack

### Core Framework

- **React:** 18.3.1
- **TypeScript:** 5.5.3
- **Vite:** 5.4.1 (build tool, dev server)
- **React Router:** 6.26.0 (routing)

### State Management

- **TanStack Query (React Query):** 5.52.0 (server state, caching)
- **React Context API** (global UI state)
- **Zustand:** Not used (could be added for complex local state)

### Real-Time Communication

- **Native WebSocket API** (JSON Patch streams)
- **EventSource API** (SSE streams)
- **rfc6902:** 5.1.1 (JSON Patch library)

### UI Libraries

- **shadcn/ui** (Radix UI + Tailwind components)
- **Radix UI:** primitives (Dialog, Select, Dropdown, etc.)
- **Tailwind CSS:** 3.4.10 (utility-first CSS)
- **@tailwindcss/container-queries:** 0.1.1
- **tailwindcss-animate:** 1.0.7

### Forms & Validation

- **react-hook-form:** 7.53.0 (form state)
- **@rjsf/core:** 5.19.3 (JSON Schema forms)
- **@rjsf/validator-ajv8:** 5.19.3 (validation)
- **zod:** Could be added (type-safe validation)

### Rich Text & Markdown

- **@tiptap/react:** 2.6.6 (WYSIWYG editor)
- **@tiptap/starter-kit:** 2.6.6 (Tiptap extensions)
- **@tiptap/suggestion:** 2.6.6 (@ mentions, autocomplete)
- **react-markdown:** 9.0.1 (markdown rendering)
- **remark-gfm:** 4.0.0 (GitHub Flavored Markdown)

### Code Display

- **shiki:** 1.15.2 (syntax highlighting)
- **react-diff-view:** 3.2.1 (diff rendering)
- **prism-react-renderer:** Could be added (alternative highlighter)

### Virtualization

- **@virtuoso.dev/message-list:** 0.2.0 (conversation list ★)
- **react-virtuoso:** 4.10.1 (generic virtualization)
- **@tanstack/react-virtual:** Could be added (alternative)

### Drag & Drop

- **@dnd-kit/core:** 6.1.0 (DnD primitives)
- **@dnd-kit/sortable:** 8.0.0 (sortable lists)
- **@dnd-kit/utilities:** 3.2.2 (helpers)
- **react-resizable-panels:** 2.1.0 (panel resizing)

### Keyboard

- **react-hotkeys-hook:** 4.5.1 (hotkey management)
- Custom scope system (7 scopes: global, kanban, dialog, etc.)

### Analytics

- **posthog-js:** 1.160.1 (product analytics)
- **@sentry/react:** 8.27.0 (error tracking)

### Modals

- **@ebay/nice-modal-react:** 1.2.13 (modal management)
- Custom integration with React Router

### Icons

- **lucide-react:** 0.438.0 (icon library, 1000+ icons)

### Internationalization

- **react-i18next:** 15.0.1 (i18n framework)
- **i18next:** 23.14.0 (i18n core)
- Currently only English, ready for multi-language

### Date/Time

- **date-fns:** Could be added (date formatting)
- Currently using native `Date` + `Intl`

### Testing (Not Used)

- **Vitest:** Could be added (unit tests)
- **@testing-library/react:** Could be added (component tests)
- **Playwright:** Could be added (E2E tests)

### Mobile (Missing)

- **react-spring:** Could be added (gesture animations)
- **use-gesture:** Could be added (swipe, pinch, etc.)
- **framer-motion:** ALREADY USED (but only for fade transitions)
- **react-swipeable:** Could be added (swipe gestures)

---

## Mobile Pain Points

### 1. Single Breakpoint Binary UX

**Problem:** One breakpoint (1280px) determines EVERYTHING  
**Impact:** Mobile gets desktop UI scaled down, not mobile-first design

**Current:**
```typescript
const isMobile = !useMediaQuery('(min-width: 1280px)');
if (isMobile) {
  // Show either kanban OR chat (never both)
  // No preview, no diffs, no side-by-side
}
```

**Should Be:**
```typescript
// Multiple breakpoints for different devices:
const isPhone = useMediaQuery('(max-width: 640px)');      // < 640px
const isTablet = useMediaQuery('(max-width: 1024px)');    // 640-1024px
const isDesktop = useMediaQuery('(min-width: 1024px)');   // >= 1024px

// Different UX for each:
if (isPhone) {
  // Stack views, swipe navigation, bottom sheets
} else if (isTablet) {
  // Split screen (portrait/landscape aware), slideover panels
} else {
  // Desktop UX (resizable panels, keyboard shortcuts)
}
```

### 2. No Touch Gestures

**Problem:** All interactions keyboard/mouse-first  
**Impact:** Mobile users can't navigate efficiently

**Missing:**
- Swipe to go back/forward
- Swipe between views (kanban ↔ chat)
- Pull to refresh tasks
- Long-press for context menus
- Pinch to zoom diffs
- Two-finger scroll for nested scrollables

**Should Add:**
```typescript
import { useSwipeable, useLongPress } from 'react-use-gesture';

// Swipe between views:
const bind = useSwipeable({
  onSwipedLeft: () => nextView(),
  onSwipedRight: () => prevView(),
  trackMouse: false  // Touch only
});

// Long-press for card actions:
const longPress = useLongPress({
  onLongPress: () => showContextMenu(),
  threshold: 500
});
```

### 3. Horizontal Scroll Required

**Problem:** Kanban, diffs, code all require horizontal scroll  
**Impact:** Poor UX, content hidden off-screen

**Current:**
- Kanban: 5 columns side-by-side (horizontal scroll)
- Diffs: Wide code lines (horizontal scroll)
- Split diff view: Unusable (too narrow)

**Should Be:**
- Kanban: Tabs or carousel for columns
- Diffs: Vertical stacking, syntax-aware wrapping
- Split diff: Hidden on mobile (unified only)

### 4. Resizable Panels Desktop-Only

**Problem:** `react-resizable-panels` uses drag handles  
**Impact:** Mobile gets fixed layouts, can't adjust

**Should Be:**
- Snap points instead of drag
- Preset layouts (70/30, 50/50, 30/70)
- Double-tap to toggle full-width

### 5. No Bottom Sheets

**Problem:** Modals use centered overlays  
**Impact:** Poor mobile UX, hard to dismiss, scrolling issues

**Should Be:**
- Bottom sheets for mobile (iOS/Android pattern)
- Swipe down to dismiss
- Backdrop click to close
- Handle indicator at top

### 6. No Orientation Handling

**Problem:** No landscape vs portrait adaptations  
**Impact:** Landscape wastes space, portrait cramps content

**Should Be:**
```typescript
const isLandscape = useMediaQuery('(orientation: landscape)');

if (isMobile && isLandscape) {
  // Show side-by-side (kanban + chat)
  // Horizontal toolbar
} else if (isMobile && !isLandscape) {
  // Stack views
  // Vertical navigation
}
```

### 7. Keyboard Shortcuts Non-Functional

**Problem:** 50+ keyboard shortcuts, none work on mobile  
**Impact:** Power users can't be productive on mobile

**Should Be:**
- On-screen floating action button (FAB)
- Quick actions menu
- Voice commands (future)
- Gesture shortcuts (double-tap, swipe patterns)

### 8. No Offline Support

**Problem:** Requires constant connection  
**Impact:** Can't work on train, plane, poor connection

**Should Add:**
- Service worker for caching
- IndexedDB for offline storage
- Queue actions when offline
- Sync when reconnected

### 9. No Native Features

**Problem:** PWA-only, no native APIs  
**Impact:** Can't use camera, notifications, background sync

**Should Be (Native App):**
- Camera for image upload
- Push notifications for task updates
- Background sync for drafts
- File system access
- Share target (share to Forge)

### 10. Performance Issues

**Problem:** Desktop-optimized rendering  
**Impact:** Slow on low-end mobile devices

**Issues:**
- Virtuoso license (rendering large lists)
- Shiki syntax highlighting (CPU intensive)
- Multiple WebSocket connections (battery drain)
- Large bundle size (slow load)

**Should Optimize:**
- Code splitting (lazy load routes)
- Image optimization (WebP, lazy load)
- Reduce JavaScript bundle
- Debounce/throttle expensive operations

---

## Recommendations for Mobile Redesign

### Phase 1: Foundation (Weeks 1-2)

1. **Breakpoint System**
   ```typescript
   // New breakpoints:
   const breakpoints = {
     xs: '(max-width: 480px)',     // Small phones
     sm: '(max-width: 640px)',     // Large phones
     md: '(max-width: 768px)',     // Tablets portrait
     lg: '(max-width: 1024px)',    // Tablets landscape
     xl: '(min-width: 1280px)',    // Desktop (existing)
   };
   ```

2. **Touch Gesture Library**
   - Install: `use-gesture`, `react-spring`
   - Implement: swipe, long-press, pull-to-refresh
   - Test on real devices

3. **Mobile-First Components**
   - Bottom sheet component
   - Mobile navbar (bottom tabs)
   - Mobile toolbar (sticky top)
   - Mobile-optimized cards

4. **Layout System**
   - Stack-based navigation (React Navigation pattern)
   - Slide-in panels
   - Modal sheets (bottom/full-screen)
   - Adaptive layouts (portrait/landscape)

### Phase 2: Core Views (Weeks 3-5)

5. **Mobile Kanban**
   - Tabs for columns (swipe between)
   - Vertical card list (no horizontal scroll)
   - Pull-to-refresh tasks
   - FAB for create task

6. **Mobile Chat**
   - Full-height conversation
   - Sticky input at bottom
   - Image picker from bottom sheet
   - Executor selector as bottom sheet
   - Voice input button

7. **Mobile Diffs**
   - Vertical file list (no grid)
   - Unified view only (no split)
   - Syntax-aware line wrapping
   - Expandable cards
   - Swipe to collapse/expand

8. **Mobile Preview**
   - Native WebView (not iframe)
   - Zoom/pan controls
   - Rotate to landscape for larger view
   - Screenshot button
   - Share button

### Phase 3: Advanced Features (Weeks 6-8)

9. **Native Camera**
   - Photo capture
   - QR code scanning (future)
   - Image editing (crop, rotate)

10. **Push Notifications**
    - Task complete
    - Approval required
    - PR created/merged
    - Agent errors

11. **Offline Mode**
    - Service worker
    - IndexedDB storage
    - Queue API calls
    - Background sync

12. **Performance**
    - Code splitting
    - Image optimization
    - Virtual scrolling
    - Lazy loading
    - Bundle size reduction

### Phase 4: Polish (Weeks 9-10)

13. **Animations**
    - Page transitions
    - Gesture animations
    - Loading states
    - Success/error feedback

14. **Accessibility**
    - Screen reader support
    - Font size scaling
    - High contrast mode
    - Touch target sizes (48x48dp min)

15. **Testing**
    - Real device testing (iOS/Android)
    - Different screen sizes
    - Different Android versions
    - Performance profiling
    - Battery usage

### Technology Recommendations

**Navigation:**
- ✅ Keep React Router (web parity)
- ✅ Add stack-based navigation helper

**Gestures:**
- ✅ `use-gesture` (swipe, pinch, drag)
- ✅ `react-spring` (smooth animations)

**Bottom Sheets:**
- ✅ `react-spring-bottom-sheet` or custom

**Virtualization:**
- ✅ Keep Virtuoso (works well)
- ✅ Optimize for mobile (smaller items)

**State Management:**
- ✅ Keep React Query (excellent)
- ✅ Keep Context API (simple)

**Offline:**
- ✅ `workbox` (service worker)
- ✅ `idb` (IndexedDB wrapper)

**Native Features:**
- ✅ Capacitor (camera, notifications, etc.)
- ✅ PWA APIs (share, file system)

### UI/UX Patterns

**Mobile-First Patterns:**
1. **Bottom Navigation** (Home, Tasks, Settings)
2. **Floating Action Button** (Create task)
3. **Bottom Sheets** (Forms, settings, filters)
4. **Pull to Refresh** (Task list, conversation)
5. **Swipe Actions** (Delete, archive, share)
6. **Long Press** (Context menus)
7. **Sticky Headers** (Section headers)
8. **Snap Points** (Panel sizes)

**Responsive Patterns:**
1. **Stack → Split** (Mobile stack, tablet/desktop split)
2. **Tabs → Sidebar** (Mobile tabs, desktop sidebar)
3. **Bottom Sheet → Modal** (Mobile sheet, desktop centered)
4. **FAB → Toolbar** (Mobile FAB, desktop toolbar button)

### Performance Targets

- **First Contentful Paint:** < 1.5s (mobile 3G)
- **Time to Interactive:** < 3s (mobile 3G)
- **Bundle Size:** < 500KB gzipped
- **Lighthouse Score:** > 90 (mobile)
- **Frame Rate:** 60fps (gestures, scrolling)
- **Battery:** < 5% drain per hour (idle)

### Testing Matrix

| Device | Screen | Android | Priority |
|--------|--------|---------|----------|
| Pixel 7 | 1080x2400 | 13 | High |
| Samsung S21 | 1080x2400 | 12 | High |
| Xiaomi Redmi | 1080x2340 | 11 | Medium |
| OnePlus 9 | 1080x2400 | 11 | Medium |
| Old Device | 720x1280 | 9 | Low |

---

## Appendix: Key Files Reference

### Pages
- `src/pages/project-tasks.tsx` (785 lines) ★★★★★
- `src/pages/projects.tsx` (506 lines)
- `src/pages/full-attempt-logs.tsx` (3006 lines)

### Panels
- `src/components/panels/TaskAttemptPanel.tsx` (144 lines) ★★★
- `src/components/panels/PreviewPanel.tsx` (248 lines) ★★★
- `src/components/panels/DiffsPanel.tsx` (246 lines) ★★★

### Tasks
- `src/components/tasks/TaskFollowUpSection.tsx` (815 lines) ★★★★★
- `src/components/tasks/TaskKanbanBoard.tsx` (1771 lines)

### Logs
- `src/components/logs/VirtualizedList.tsx` (145 lines) ★★★
- `src/components/NormalizedConversation/DisplayConversationEntry.tsx` (24,082 bytes) ★★★★★

### Layout
- `src/components/layout/TasksLayout.tsx` (328 lines) ★★★★

### Hooks
- `src/hooks/useJsonPatchWsStream.ts` (197 lines) ★★★
- `src/hooks/useConversationHistory.ts` (18,971 bytes) ★★★★
- `src/hooks/useProjectTasks.ts` (data streaming)
- `src/hooks/useDiffStream.ts` (diff streaming)
- `src/hooks/useLogStream.ts` (log streaming)
- `src/hooks/follow-up/useDraftStream.ts` (draft streaming)

### Contexts
- `src/contexts/project-context.tsx` (project state)
- `src/contexts/ExecutionProcessesContext.tsx` (process state)
- `src/contexts/ReviewProvider.tsx` (review comments)
- `src/contexts/ClickedElementsProvider.tsx` (preview clicks)
- `src/contexts/EntriesContext.tsx` (conversation entries)

### API
- `src/lib/api.ts` (REST endpoints)
- `src/lib/forge-api.ts` (Forge-specific endpoints)

### Config
- `tailwind.config.js` (Tailwind configuration)
- `vite.config.ts` (Vite configuration)
- `tsconfig.json` (TypeScript configuration)

---

## Conclusion

Forge is a **complex, desktop-first application** with:
- ✅ Rich real-time features (WebSocket, SSE)
- ✅ Excellent code quality (TypeScript, modular)
- ✅ Comprehensive feature set (tasks, chat, diffs, preview, review)
- ⚠️ Limited mobile support (single breakpoint)
- 🔴 No touch gestures
- 🔴 No native features

**Mobile redesign requires:**
1. ✨ New breakpoint system
2. ✨ Touch gesture support
3. ✨ Mobile-first layouts
4. ✨ Bottom sheets, FABs, tabs
5. ✨ Orientation handling
6. ✨ Performance optimization
7. ✨ Native features (camera, notifications)
8. ✨ Offline support

**Estimated effort:** 8-10 weeks for MVP native mobile app

**Key insight:** Don't port the desktop UI - redesign for mobile-first, then add tablet/desktop as larger screen sizes.

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Next Steps:** Detailed wireframes for each mobile view
