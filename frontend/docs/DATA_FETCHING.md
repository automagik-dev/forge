# Data Fetching Patterns

This document establishes patterns for real-time data fetching in the Forge frontend.

## Decision Framework

### When to Use WebSocket

Use WebSocket streaming when:
- Data changes **more than once per 10 seconds** during active use
- **Latency matters** - immediate feedback expected by users
- Backend WebSocket endpoint already exists
- Multiple clients need synchronized state

**Examples:**
- Task list (tasks created/updated frequently)
- Execution process status (changes rapidly during runs)
- Conversation logs (streaming output)
- File diffs (real-time changes)

### When to Use Polling (React Query)

Use polling when:
- Data changes **infrequently** (< 1x per 30 seconds)
- Adding WebSocket endpoint is more work than benefit
- Data benefits from React Query caching (stale-while-revalidate)
- Simple one-off fetches are sufficient

**Examples:**
- Branch status (changes only on git operations)
- Project settings (rarely changes)
- User preferences (static during session)

## WebSocket Patterns

### useJsonPatchWsStream

The base hook for consuming WebSocket streams that use RFC 6902 JSON Patch format.

```typescript
import { useJsonPatchWsStream } from '@/hooks/useJsonPatchWsStream';

// Usage pattern
const { data, isConnected, error } = useJsonPatchWsStream<StateType>(
  endpoint,        // '/api/tasks/stream/ws?project_id=xxx'
  enabled,         // boolean - whether to connect
  initialData      // () => ({ tasks: {} }) - factory function
);
```

**Message Format:**
```json
// Patch message
{ "JsonPatch": [{ "op": "add", "path": "/tasks/123", "value": {...} }] }

// Finished signal (terminal - no reconnect)
{ "finished": true }
```

**Features:**
- Exponential backoff reconnection (1s, 2s, 4s, 8s max)
- Automatic cleanup on unmount
- Deep clone state before mutations
- Terminal message handling

### Existing WebSocket Hooks

| Hook | Endpoint | Purpose |
|------|----------|---------|
| `useProjectTasks` | `/api/tasks/stream/ws?project_id={id}` | Task list with status |
| `useExecutionProcesses` | `/api/execution-processes/stream/ws` | Process status |
| `useDiffStream` | `/api/task-attempts/{id}/diff/ws` | File changes |
| `useConversationHistory` | Normalized/Raw logs endpoints | Conversation logs |
| `useDraftStream` | `/api/drafts/stream/ws?project_id={id}` | Follow-up drafts |

## Polling Patterns

### Smart Polling

Reduce polling frequency when tab is backgrounded:

```typescript
import { useQuery } from '@tanstack/react-query';

// Hook to detect tab visibility
const useDocumentVisible = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return isVisible;
};

// Smart polling example
function useBranchStatus(attemptId?: string) {
  const isVisible = useDocumentVisible();

  return useQuery({
    queryKey: ['branchStatus', attemptId],
    queryFn: () => fetchBranchStatus(attemptId!),
    enabled: !!attemptId,
    refetchInterval: isVisible ? 15000 : 60000,  // 15s active, 60s background
    staleTime: 5000,  // Consider data fresh for 5s
  });
}
```

### Mutation Invalidation

Immediately refresh data after mutations:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function usePush(attemptId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => attemptsApi.push(attemptId!),
    onSuccess: () => {
      // Immediately invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['branchStatus', attemptId] });
      queryClient.invalidateQueries({ queryKey: ['projectBranches'] });
    },
  });
}
```

## Memory Leak Prevention

### WebSocket Cleanup Checklist

1. **Track active controllers** - Use refs to track WebSocket controllers created in async operations
2. **Cleanup on unmount** - Close all controllers in useEffect cleanup
3. **Handle component remounting** - Clear stale state when dependencies change

```typescript
// Pattern for tracking WebSocket controllers
const activeControllersRef = useRef<Set<{ close: () => void }>>(new Set());

// In async function
const controller = createWebSocketController();
activeControllersRef.current.add(controller);

controller.onComplete = () => {
  activeControllersRef.current.delete(controller);
  controller.close();
};

// In cleanup effect
useEffect(() => {
  return () => {
    activeControllersRef.current.forEach(c => c.close());
    activeControllersRef.current.clear();
  };
}, []);
```

### Context Re-render Prevention

Use `use-context-selector` to avoid re-rendering all consumers when context changes:

```typescript
// In context file - uses use-context-selector library
import { createContext, useContextSelector } from 'use-context-selector';

const MyContext = createContext<ContextType | null>(null);

export const useMySelector = <T>(
  selector: (state: ContextType) => T
): T => {
  return useContextSelector(MyContext, (ctx) => {
    if (!ctx) throw new Error('Must be used within Provider');
    return selector(ctx);
  });
};

// Usage - only re-renders when selected value changes
const processStatus = useExecutionProcessSelector(
  ctx => ctx.processes[processId]?.status
);
```

**Why `use-context-selector`?**
- Standard React `useContext` triggers re-render on ANY context change
- `use-context-selector` only re-renders when the selected slice changes
- This prevents cascade re-renders in components that only need a subset of context

## Recommended Polling Intervals

| Data Type | Active Tab | Background Tab | Notes |
|-----------|------------|----------------|-------|
| Branch status | 15s | 60s | Changes only on git ops |
| Project list | 30s | 120s | Rarely changes |
| Task attempts | 5s | 30s | Consider WebSocket |
| User session | 60s | 300s | Auth refresh |

## Anti-Patterns

### ❌ Don't: Create WebSocket in Promise without cleanup

```typescript
// BAD - No cleanup tracking
async function loadData() {
  const ws = new WebSocket(url);
  ws.onmessage = handleMessage;
  // If component unmounts, this WebSocket stays open!
}
```

### ❌ Don't: Poll aggressively when tab is hidden

```typescript
// BAD - Wastes resources
useQuery({
  refetchInterval: 2000,  // 2s even when tab hidden
});
```

### ❌ Don't: Subscribe entire context for single value

```typescript
// BAD - Re-renders on any context change
const { processes } = useExecutionProcesses();
const myProcess = processes[processId];
```

### ✅ Do: Use appropriate data fetching method

```typescript
// GOOD - WebSocket for real-time, polling for slow-changing
const { tasks } = useProjectTasks(projectId);        // WebSocket
const { data } = useBranchStatus(attemptId);         // Smart polling
```
