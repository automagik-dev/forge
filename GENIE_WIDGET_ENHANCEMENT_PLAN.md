# Genie Widget Enhancement Plan

**Date**: 2025-10-29
**Status**: Implementation Plan

---

## Overview

Enhance the Genie Widget with:
1. **Session Management** - Create, switch, and delete attempts
2. **History Navigation** - Browse and load previous sessions
3. **Maximize to Full View** - Open current session in main app
4. **Options Menu** - Executor changes, settings, export
5. **Multimodal Support** - Image uploads in chat

---

## 1. Header Layout Design

```
┌─────────────────────────────────────────────────────────────┐
│ 🏮 Genie      [+] [History▾] [...] [⛶] [✕]                 │
├─────────────────────────────────────────────────────────────┤
│ [Genie] [Wish] [Forge] [Review]                            │
└─────────────────────────────────────────────────────────────┘
```

**Icons** (left to right):
- `<SquarePlus />` - Create new session
- `<History />` - History dropdown
- `<Ellipsis />` - Options menu
- `<Maximize />` - Open full view
- `<X />` - Close widget

---

## 2. State Management Architecture

### Current Agent State

```typescript
interface AgentState {
  task: Task;
  currentAttempt: TaskAttempt | null;
  allAttempts: TaskAttempt[];
  isLoadingHistory: boolean;
}

// Widget State
const [masterGenie, setMasterGenie] = useState<AgentState | null>(null);
const [neurons, setNeurons] = useState<Record<'wish' | 'forge' | 'review', AgentState>>({
  wish: { task: null, currentAttempt: null, allAttempts: [], isLoadingHistory: false },
  forge: { task: null, currentAttempt: null, allAttempts: [], isLoadingHistory: false },
  review: { task: null, currentAttempt: null, allAttempts: [], isLoadingHistory: false },
});
```

### Active Agent Selector

```typescript
const getActiveAgent = (): AgentState | null => {
  if (activeTab === 'master') return masterGenie;
  return neurons[activeTab] || null;
};
```

---

## 3. Feature: New Session (SquarePlus Icon)

### Flow

1. User clicks `<SquarePlus />` icon
2. Detect current agent (Master or neuron)
3. Create new task attempt for that agent's task
4. Switch to the new (empty) attempt
5. User can start fresh conversation

### Implementation

```typescript
const handleNewSession = async () => {
  const agent = getActiveAgent();
  if (!agent?.task) return;

  setIsCreatingSession(true);
  try {
    // Get current branch and executor
    const baseBranch = currentBranch || 'main';
    const executorProfile = config?.executor_profile || {
      executor: BaseCodingAgent.CLAUDE_CODE,
      variant: activeTab === 'master' ? null : activeTab,
    };

    // Create new attempt
    const newAttempt = await subGenieApi.createMasterGenieAttempt(
      agent.task.id,
      baseBranch,
      executorProfile
    );

    // Update state
    if (activeTab === 'master') {
      setMasterGenie({
        ...agent,
        currentAttempt: newAttempt,
        allAttempts: [...agent.allAttempts, newAttempt],
      });
    } else {
      setNeurons({
        ...neurons,
        [activeTab]: {
          ...agent,
          currentAttempt: newAttempt,
          allAttempts: [...agent.allAttempts, newAttempt],
        },
      });
    }
  } catch (err) {
    console.error('Failed to create new session:', err);
    setError(err.message);
  } finally {
    setIsCreatingSession(false);
  }
};
```

### UI Feedback

- Disable button during creation
- Show spinner in button
- Toast: "New session created"

---

## 4. Feature: History Dropdown (History Icon)

### Flow

1. User clicks `<History />` icon
2. Dropdown opens with list of previous attempts
3. Shows formatted timestamps + status
4. User clicks an attempt → loads it
5. VirtualizedList refreshes with that attempt's logs

### Implementation

```typescript
const handleLoadHistory = async () => {
  const agent = getActiveAgent();
  if (!agent?.task) return;

  setIsLoadingHistory(true);
  try {
    // Fetch all attempts for this task
    const allAttempts = await subGenieApi.getTaskAttempts(projectId);
    const taskAttempts = allAttempts
      .filter(a => a.task_id === agent.task.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Update state with all attempts
    if (activeTab === 'master') {
      setMasterGenie({ ...agent, allAttempts: taskAttempts });
    } else {
      setNeurons({
        ...neurons,
        [activeTab]: { ...agent, allAttempts: taskAttempts },
      });
    }
  } catch (err) {
    console.error('Failed to load history:', err);
  } finally {
    setIsLoadingHistory(false);
  }
};

const handleSwitchAttempt = (attemptId: string) => {
  const agent = getActiveAgent();
  const selectedAttempt = agent.allAttempts.find(a => a.id === attemptId);

  if (!selectedAttempt) return;

  if (activeTab === 'master') {
    setMasterGenie({ ...agent, currentAttempt: selectedAttempt });
  } else {
    setNeurons({
      ...neurons,
      [activeTab]: { ...agent, currentAttempt: selectedAttempt },
    });
  }
};
```

### Dropdown UI

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm" disabled={isLoadingHistory}>
      <History className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuLabel>Session History</DropdownMenuLabel>
    <DropdownMenuSeparator />
    {agent.allAttempts.length === 0 ? (
      <DropdownMenuItem disabled>No previous sessions</DropdownMenuItem>
    ) : (
      agent.allAttempts.map((attempt, idx) => (
        <DropdownMenuItem
          key={attempt.id}
          onClick={() => handleSwitchAttempt(attempt.id)}
          className={attempt.id === agent.currentAttempt?.id ? 'bg-accent' : ''}
        >
          <div className="flex flex-col">
            <span className="font-medium">Session {agent.allAttempts.length - idx}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(attempt.created_at), { addSuffix: true })}
            </span>
          </div>
        </DropdownMenuItem>
      ))
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 5. Feature: Maximize (Maximize Icon)

### Flow

1. User clicks `<Maximize />` icon
2. Get current agent + attempt
3. Navigate to: `/projects/{projectId}/tasks/{taskId}/attempts/{attemptId}?view=diffs`
4. Widget closes automatically

### Implementation

```typescript
const handleMaximize = () => {
  const agent = getActiveAgent();
  if (!agent?.currentAttempt || !projectId) return;

  const url = `/projects/${projectId}/tasks/${agent.task.id}/attempts/${agent.currentAttempt.id}?view=diffs`;

  // Use router navigation (assuming React Router or Next.js)
  window.location.href = url;
  // OR: router.push(url);

  // Close widget
  onClose();
};
```

### Edge Cases

- No active attempt → disable button
- Show tooltip: "Open in full view"

---

## 6. Feature: Ellipsis Menu (Options)

### Menu Structure (✅ APPROVED)

```
┌─────────────────────────────┐
│ 🔧 Change Executor          │
│ 🗑️  Delete Session          │ (disabled if only 1)
│ ⚙️  Settings                │ (Branch preferences)
│ 📥 Export Chat              │ (.md format)
│ 🔄 Clear Chat               │ (Reset attempt)
└─────────────────────────────┘
```

### Options Detailed

#### 6.1. Change Executor

**Flow**:
1. User clicks "Change Executor"
2. Dialog opens with executor selector
3. User selects new executor (Claude, Gemini, etc.)
4. Saves to widget state (affects next session)

**Implementation**:
```typescript
const [preferredExecutor, setPreferredExecutor] = useState(config?.executor_profile);

const handleChangeExecutor = () => {
  setShowExecutorDialog(true);
};

const handleSaveExecutor = (newExecutor: ExecutorProfileId) => {
  setPreferredExecutor(newExecutor);
  setShowExecutorDialog(false);
  // Toast: "Executor updated for next session"
};
```

**Dialog UI**:
- Reuse `ExecutorProfileSelector` component
- Show current executor
- Save button

#### 6.2. Delete Session

**Flow**:
1. User clicks "Delete Session"
2. Confirm dialog: "Are you sure? This cannot be undone."
3. Delete current attempt via API
4. Switch to most recent remaining attempt
5. Update allAttempts array

**Implementation**:
```typescript
const handleDeleteSession = async () => {
  const agent = getActiveAgent();
  if (!agent?.currentAttempt || agent.allAttempts.length <= 1) return;

  const confirmed = await confirmDialog({
    title: 'Delete Session',
    message: 'This will permanently delete this session. Continue?',
  });

  if (!confirmed) return;

  try {
    // Delete via API
    await subGenieApi.deleteAttempt(agent.currentAttempt.id);

    // Remove from array
    const updatedAttempts = agent.allAttempts.filter(
      a => a.id !== agent.currentAttempt.id
    );

    // Switch to most recent
    const nextAttempt = updatedAttempts[0];

    if (activeTab === 'master') {
      setMasterGenie({
        ...agent,
        currentAttempt: nextAttempt,
        allAttempts: updatedAttempts,
      });
    } else {
      setNeurons({
        ...neurons,
        [activeTab]: {
          ...agent,
          currentAttempt: nextAttempt,
          allAttempts: updatedAttempts,
        },
      });
    }

    toast.success('Session deleted');
  } catch (err) {
    console.error('Failed to delete session:', err);
    toast.error('Failed to delete session');
  }
};
```

**Disabled State**:
- If `allAttempts.length === 1` → disable + tooltip: "Cannot delete last session"

#### 6.3. Settings (Branch Preferences)

**Options**:
- Default branch for new sessions
- Auto-load branch from current project
- Branch selector dropdown

**Implementation**:
```typescript
const [preferredBranch, setPreferredBranch] = useState<string | null>(null);

const handleOpenSettings = () => {
  setShowSettingsDialog(true);
};
```

**Dialog UI**:
- Reuse `BranchSelector` component
- Save preference to local storage or user config

#### 6.4. Export Chat (.md)

**Flow**:
1. User clicks "Export Chat"
2. Fetches current attempt's conversation
3. Formats as Markdown
4. Downloads as `.md` file

**Implementation**:
```typescript
const handleExportChat = async () => {
  const agent = getActiveAgent();
  if (!agent?.currentAttempt) return;

  // Fetch entries (conversation messages)
  const entries = await fetchAttemptEntries(agent.currentAttempt.id);

  // Format as Markdown
  const markdown = entries.map(entry => {
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const role = entry.role === 'user' ? '**You**' : '**Genie**';
    return `### ${role} (${timestamp})\n\n${entry.message}\n\n---\n`;
  }).join('\n');

  const header = `# Genie Chat Export\n\n**Session ID**: ${agent.currentAttempt.id}\n**Date**: ${new Date().toLocaleDateString()}\n\n---\n\n`;

  // Download
  const blob = new Blob([header + markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `genie-chat-${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);

  toast.success('Chat exported');
};
```

#### 6.5. Clear Chat (Reset Attempt)

**Flow**:
1. User clicks "Clear Chat"
2. Confirm dialog: "This will clear all messages. Continue?"
3. Check backend capabilities:
   - **Option A**: API endpoint to delete messages: `DELETE /api/task-attempts/{id}/messages`
   - **Option B**: No backend support → create new attempt instead
4. Refresh chat view

**Implementation (Option A - if backend supports)**:
```typescript
const handleClearChat = async () => {
  const agent = getActiveAgent();
  if (!agent?.currentAttempt) return;

  const confirmed = await confirmDialog({
    title: 'Clear Chat',
    message: 'This will delete all messages in this session. Continue?',
  });

  if (!confirmed) return;

  try {
    // Try to clear messages via API
    await subGenieApi.clearAttemptMessages(agent.currentAttempt.id);

    // Force reload of VirtualizedList
    // (This depends on how entries are fetched - may need to trigger re-fetch)

    toast.success('Chat cleared');
  } catch (err) {
    console.error('Failed to clear chat:', err);
    toast.error('Failed to clear chat');
  }
};
```

**Implementation (Option B - fallback to new session)**:
```typescript
const handleClearChat = async () => {
  const confirmed = await confirmDialog({
    title: 'Clear Chat',
    message: 'This will create a new session. Continue?',
  });

  if (!confirmed) return;

  await handleNewSession(); // Reuse new session logic
  toast.success('New session created');
};
```

**Backend Check**:
We need to verify if the backend supports message deletion. If not, we'll use Option B.

#### 6.5. Delete Session

**Flow**:
1. User clicks "Delete Session"
2. Confirm dialog: "Are you sure? This cannot be undone."
3. Delete current attempt via API
4. Switch to most recent remaining attempt
5. Update allAttempts array

**Implementation**:
```typescript
const handleDeleteSession = async () => {
  const agent = getActiveAgent();
  if (!agent?.currentAttempt || agent.allAttempts.length <= 1) return;

  const confirmed = await confirmDialog({
    title: 'Delete Session',
    message: 'This will permanently delete this session. Continue?',
  });

  if (!confirmed) return;

  try {
    // Delete via API
    await subGenieApi.deleteAttempt(agent.currentAttempt.id);

    // Remove from array
    const updatedAttempts = agent.allAttempts.filter(
      a => a.id !== agent.currentAttempt.id
    );

    // Switch to most recent
    const nextAttempt = updatedAttempts[0];

    if (activeTab === 'master') {
      setMasterGenie({
        ...agent,
        currentAttempt: nextAttempt,
        allAttempts: updatedAttempts,
      });
    } else {
      setNeurons({
        ...neurons,
        [activeTab]: {
          ...agent,
          currentAttempt: nextAttempt,
          allAttempts: updatedAttempts,
        },
      });
    }

    toast.success('Session deleted');
  } catch (err) {
    console.error('Failed to delete session:', err);
    toast.error('Failed to delete session');
  }
};
```

**Disabled State**:
- If `allAttempts.length === 1` → disable + tooltip: "Cannot delete last session"

#### 6.6. Help

Opens modal with:
- Keyboard shortcuts
- Link to documentation
- Tips for using Genie

---

## 7. Feature: Multimodal Support (Image Upload)

### Flow

1. User clicks image icon in chat input
2. File picker opens
3. User selects image(s)
4. Thumbnails appear below textarea
5. User types message + clicks Send
6. Message + images sent together

### Implementation

#### 7.1. Add Image Button

```tsx
// In TaskFollowUpSection or GenieMasterWidget
<div className="flex items-center gap-2">
  <Textarea value={message} onChange={...} />

  <div className="flex gap-1">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => fileInputRef.current?.click()}
      disabled={isSending}
    >
      <Image className="h-4 w-4" />
    </Button>

    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={handleImageSelect}
    />

    <Button onClick={handleSendWithImages} disabled={!message.trim() || isSending}>
      <Send className="h-4 w-4" />
    </Button>
  </div>
</div>
```

#### 7.2. Handle Image Selection

```typescript
const [attachedImages, setAttachedImages] = useState<File[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);

const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);

  // Validate size (max 10MB per image)
  const validFiles = files.filter(file => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is too large (max 10MB)`);
      return false;
    }
    return true;
  });

  setAttachedImages(prev => [...prev, ...validFiles]);
};

const handleRemoveImage = (index: number) => {
  setAttachedImages(prev => prev.filter((_, i) => i !== index));
};
```

#### 7.3. Display Thumbnails

```tsx
{attachedImages.length > 0 && (
  <div className="flex gap-2 p-2 border-t">
    {attachedImages.map((file, idx) => (
      <div key={idx} className="relative">
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="h-16 w-16 object-cover rounded"
        />
        <Button
          variant="destructive"
          size="sm"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
          onClick={() => handleRemoveImage(idx)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    ))}
  </div>
)}
```

#### 7.4. Send with Images

```typescript
const handleSendWithImages = async () => {
  if (!message.trim()) return;

  setIsSending(true);
  try {
    // Convert images to base64
    const imageAttachments = await Promise.all(
      attachedImages.map(async (file) => ({
        type: 'image' as const,
        content: await fileToBase64(file),
        name: file.name,
        mimeType: file.type,
      }))
    );

    // Send message with attachments
    await subGenieApi.sendFollowUp(
      currentAttempt.id,
      message.trim(),
      imageAttachments
    );

    // Clear inputs
    setMessage('');
    setAttachedImages([]);
  } catch (err) {
    console.error('Failed to send message:', err);
    toast.error('Failed to send message');
  } finally {
    setIsSending(false);
  }
};

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

#### 7.5. API Update

Update `subGenieApi.sendFollowUp()`:

```typescript
async sendFollowUp(
  attemptId: string,
  message: string,
  attachments?: Array<{
    type: 'image' | 'file';
    content: string; // base64
    name: string;
    mimeType: string;
  }>
): Promise<{ success: boolean; attempt_id: string }> {
  const response = await fetch(`${this.baseUrl}/task-attempts/${attemptId}/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: message,
      attachments: attachments || [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send follow-up: ${response.status}`);
  }

  const { data } = await response.json();
  return data;
}
```

---

## 8. Backend API Requirements

### New Endpoints

1. **Delete Attempt**:
   - `DELETE /api/task-attempts/{attemptId}`
   - Returns: `{ success: boolean }`

2. **Update Follow-Up** (already exists, needs enhancement):
   - `POST /api/task-attempts/{attemptId}/follow-up`
   - Body: `{ prompt: string, attachments?: Attachment[] }`

---

## 9. Implementation Phases

### Phase 1: Header Icons + Basic Actions ✅
- Add SquarePlus, History, Ellipsis, Maximize icons
- Implement Maximize (redirect)
- Implement New Session
- **Files**: `GenieMasterWidget.tsx`

### Phase 2: History Management 🔄
- Fetch all attempts
- Build History dropdown
- Implement attempt switching
- **Files**: `GenieMasterWidget.tsx`, `subGenieApi.ts`

### Phase 3: Ellipsis Menu 🔄
- Create menu structure
- Implement Delete Session
- Implement Change Executor dialog
- Add Export Logs
- **Files**: `GenieMasterWidget.tsx`, new dialog components

### Phase 4: Multimodal Support 🔄
- Add image upload button
- Handle file selection + validation
- Display thumbnails
- Update API to send images
- **Files**: `GenieMasterWidget.tsx`, `TaskFollowUpSection.tsx`, `subGenieApi.ts`

### Phase 5: Polish + I18n 🔄
- Add keyboard shortcuts
- Add loading states
- Add error handling
- Translate new strings to pt-BR
- **Files**: `common.json` (en + pt-BR)

---

## 10. UI/UX Guidelines

### Spacing
- Header icons: gap-1 (4px)
- Icon size: h-4 w-4 (16px)
- Button padding: p-1 or p-2

### Colors
- SquarePlus: primary
- History: default
- Ellipsis: default
- Maximize: default
- Close: ghost

### Tooltips
- All icon buttons need tooltips
- Show on hover after 500ms

### Loading States
- Disable buttons during actions
- Show spinners in buttons
- Show skeleton for history dropdown

### Error Handling
- Toast for errors
- Confirm dialogs for destructive actions
- Retry buttons where applicable

---

## 11. Accessibility

### Keyboard Shortcuts
- `Ctrl+N` / `Cmd+N` - New session
- `Ctrl+H` / `Cmd+H` - Open history
- `Ctrl+M` / `Cmd+M` - Maximize
- `Escape` - Close widget/dialog

### ARIA Labels
- All icon buttons: `aria-label`
- Dropdowns: `aria-expanded`
- Disabled states: `aria-disabled`

### Screen Readers
- Announce when switching sessions
- Announce when creating/deleting sessions
- Announce image uploads

---

## 12. Testing Checklist

- [ ] Create new session
- [ ] Switch between sessions via history
- [ ] Delete session (with >1 sessions)
- [ ] Delete disabled when only 1 session
- [ ] Maximize opens correct URL
- [ ] Change executor persists
- [ ] Export logs downloads file
- [ ] Upload single image
- [ ] Upload multiple images
- [ ] Remove image before sending
- [ ] Image size validation
- [ ] Send message with images
- [ ] All features work for Master Genie
- [ ] All features work for neurons
- [ ] i18n strings correct (en + pt-BR)
- [ ] Keyboard shortcuts work
- [ ] Tooltips appear

---

## 13. Dependencies

**NPM Packages** (check if already installed):
- `date-fns` - for `formatDistanceToNow`
- `react-hot-toast` or existing toast system
- Existing: `@radix-ui/react-dropdown-menu`
- Existing: `lucide-react` for icons

**Components to Reuse**:
- `ExecutorProfileSelector` - for Change Executor dialog
- `BranchSelector` - for Settings
- `ConfirmDialog` - for Delete Session

---

## Summary

This enhancement transforms the Genie Widget from a simple chat interface into a full session management tool with:

1. **Multi-session support** - Create, switch, delete
2. **Full integration** - Maximize to main app
3. **Flexibility** - Change executors on the fly
4. **Rich communication** - Multimodal with images
5. **User control** - Export, settings, help

**Estimated Complexity**: Medium-High
**Estimated Time**: 2-3 days of focused development
**Priority Order**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
