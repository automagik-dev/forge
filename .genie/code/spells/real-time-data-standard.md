# Real-Time Data Performance Standard

**Purpose:** Establish canonical patterns for real-time data management in Forge to achieve blazing fast performance, zero manual refresh, and optimal network usage.

**Evidence:** Issue #160 (auto-refresh bug), Issue #150 (duplicate API calls), Issue #157 (backend performance)

---

## Core Principles

### 1. React Query for ALL Server State (Frontend)

**Rule:** Never use `useState` + `useEffect` for server data. Always use React Query hooks.

**Why:**
- Automatic cache management
- Built-in refetch on invalidation
- Deduplication (multiple components = single request)
- Loading/error states included
- Optimistic updates support

**Anti-Pattern (NEVER DO THIS):**
```typescript
// ❌ Manual state management
const [data, setData] = useState(null);

useEffect(() => {
  api.get(id).then(setData);
}, [id]); // Only runs on mount or ID change
```

**Correct Pattern:**
```typescript
// ✅ React Query hook
export function useEntity(id: string) {
  return useQuery({
    queryKey: ['entity', id],
    queryFn: () => api.get(id),
    enabled: !!id,
  });
}

// Component
const { data, isLoading, error } = useEntity(id);
```

---

### 2. WebSocket Streams for Live Updates

**Rule:** Use `useJsonPatchWsStream` pattern for real-time data that changes frequently.

**Why:**
- Push-based updates (no polling)
- Efficient (only sends deltas via JSON Patch)
- Automatic reconnection with exponential backoff
- Handles finished state gracefully

**Pattern:**
```typescript
// Hook: hooks/useEntityStream.ts
export function useEntityStream(id: string) {
  const endpoint = `/api/entities/stream/ws?id=${encodeURIComponent(id)}`;

  return useJsonPatchWsStream(
    endpoint,
    !!id, // enabled
    () => ({ entity: null }), // initialData
  );
}

// Backend: Rust WebSocket handler
async fn handle_entity_stream_ws(
    socket: WebSocket,
    deployment: DeploymentImpl,
    entity_id: Uuid,
) -> anyhow::Result<()> {
    let stream = deployment
        .events()
        .stream_entity_raw(entity_id)
        .await?;

    ws_broadcast_json_stream(socket, stream).await
}
```

---

### 3. Cache Invalidation Triggers Refetch

**Rule:** Mutations MUST invalidate relevant query keys. Never manually refetch.

**Why:**
- Declarative (describe WHAT changed, not HOW to update)
- Automatic (all hooks using invalidated keys refetch)
- Prevents missed updates

**Pattern:**
```typescript
export function useEntityMutations() {
  const queryClient = useQueryClient();

  const updateEntity = useMutation({
    mutationFn: (data) => api.update(data),
    onSuccess: (updatedEntity) => {
      // Invalidate queries - React Query handles refetch
      queryClient.invalidateQueries({ queryKey: ['entity', updatedEntity.id] });
      queryClient.invalidateQueries({ queryKey: ['entities'] }); // List views
    },
  });

  return { updateEntity };
}
```

---

### 4. Backend Optimization - No N+1 Patterns

**Rule:** Batch database queries. Never query inside loops.

**Why:**
- Scalability (O(1) vs O(N) queries)
- Performance (single DB roundtrip vs N roundtrips)
- Reduces backend load

**Anti-Pattern (NEVER DO THIS):**
```rust
// ❌ N+1 query pattern
for task in tasks {
    let is_agent: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM agents WHERE task_id = ?)"
    )
    .bind(task.id)
    .fetch_one(&db_pool) // N database calls!
    .await?;
}
```

**Correct Pattern:**
```rust
// ✅ Batch query + in-memory lookup
let agent_task_ids: HashSet<Uuid> = sqlx::query_scalar(
    "SELECT task_id FROM agents WHERE project_id = ?"
)
.bind(project_id)
.fetch_all(&db_pool) // 1 database call
.await?
.into_iter()
.collect();

// O(1) in-memory lookup
for task in tasks {
    let is_agent = agent_task_ids.contains(&task.id);
}
```

---

### 5. No Manual Refetching

**Rule:** Trust React Query. Don't call API directly for data that should be cached.

**Why:**
- Cache consistency
- Prevents duplicate requests
- Automatic loading states
- Optimistic updates work correctly

**Anti-Pattern (NEVER DO THIS):**
```typescript
// ❌ Manual refetch on button click
const handleRefresh = () => {
  api.get(id).then(setData); // Bypasses cache!
};
```

**Correct Pattern:**
```typescript
// ✅ Refetch via React Query
const { data, refetch } = useEntity(id);

const handleRefresh = () => {
  refetch(); // Uses cache, tracks loading state
};
```

---

## Architecture Patterns

### Pattern 1: REST Resource Hook

For single entities fetched via GET:

```typescript
// hooks/useTask.ts
export function useTask(taskId?: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.getById(taskId!),
    enabled: !!taskId,
    staleTime: 30_000, // Consider fresh for 30s
  });
}
```

### Pattern 2: WebSocket Stream Hook

For frequently-changing data:

```typescript
// hooks/useProjectTasks.ts
export function useProjectTasks(projectId: string) {
  const endpoint = `/api/tasks/stream/ws?project_id=${encodeURIComponent(projectId)}`;

  const { data, isConnected, error } = useJsonPatchWsStream(
    endpoint,
    !!projectId,
    () => ({ tasks: {} }),
  );

  const tasks = Object.values(data?.tasks ?? {});
  return { tasks, isConnected, error };
}
```

### Pattern 3: Mutation with Invalidation

For create/update/delete operations:

```typescript
// hooks/useTaskMutations.ts
export function useTaskMutations(projectId?: string) {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: (data: CreateTask) => tasksApi.create(data),
    onSuccess: (createdTask) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['task', createdTask.id] });
    },
  });

  return { createTask };
}
```

### Pattern 4: Dependent Queries

For data that depends on other queries:

```typescript
// hooks/useTaskWithAttempts.ts
export function useTaskWithAttempts(taskId?: string) {
  const { data: task } = useTask(taskId);

  const { data: attempts = [] } = useQuery({
    queryKey: ['task-attempts', taskId],
    queryFn: () => attemptsApi.getAll(taskId!),
    enabled: !!task, // Only fetch when task exists
  });

  return { task, attempts };
}
```

---

## Performance Targets

### Frontend

- **Initial render:** <100ms from navigation to first paint
- **Data fetch:** <200ms from query to display
- **WebSocket reconnect:** <500ms from disconnect to reconnected
- **Cache hit:** <10ms (instant from cache)
- **UI update:** <16ms (60fps) for state changes

### Backend

- **REST API:** <50ms p95 response time
- **WebSocket upgrade:** <100ms connection establishment
- **Stream initial snapshot:** <200ms to first message
- **Database queries:** <10ms p95 (single query), <50ms p95 (complex join)
- **Batch operations:** O(1) database calls, not O(N)

---

## Code Review Checklist

- [ ] All server state uses React Query hooks (no manual useState + useEffect)
- [ ] Mutations invalidate appropriate query keys
- [ ] WebSocket streams use useJsonPatchWsStream pattern
- [ ] No N+1 database query patterns in backend
- [ ] No manual API calls that bypass cache
- [ ] Loading/error states handled properly
- [ ] Optimistic updates used where appropriate

---

## Examples from Forge Codebase

### ✅ Correct Patterns

**useProjectTasks** - WebSocket stream with React Query integration:
- `frontend/src/hooks/useProjectTasks.ts`
- Uses `useJsonPatchWsStream`
- Returns normalized data (array + map)
- Auto-reconnects on disconnect

**useTaskMutations** - Mutations with cache invalidation:
- `frontend/src/hooks/useTaskMutations.ts`
- Calls `invalidateQueries` on success
- Navigates after cache updated
- Tracks analytics properly

### ❌ Anti-Patterns to Fix

**TaskPanel** - Manual state management (Issue #160):
- `frontend/src/components/panels/TaskPanel.tsx:42-77`
- Uses `useState` + `useEffect` for parent/children tasks
- Doesn't refetch when cache invalidates
- Requires F5 to see updates

**ProjectList** - Bypasses React Query (Issue #150):
- `frontend/src/components/projects/project-list.tsx:32-77`
- Manual `projectsApi.getAll()` instead of `useProjects()`
- N+1 pattern (fetches tasks for each project)
- Duplicate API calls

**Backend WebSocket** - N+1 database queries:
- `forge-app/src/router.rs:727-830`
- Queries DB for each task in stream
- Should batch into single query + in-memory lookup
- Causes delays in WebSocket establishment

---

## Success Criteria

When this standard is fully implemented:

✅ Zero manual refresh (F5) needed anywhere in app
✅ All data updates in <100ms (WebSocket) or <200ms (REST)
✅ No duplicate API requests
✅ No stale data displayed to users
✅ Backend scales to 1000+ concurrent tasks without degradation
✅ All components use React Query hooks (no manual state management)
✅ All mutations invalidate cache correctly
✅ All real-time data uses WebSocket streams

---

## Related Documentation

- **React Query:** https://tanstack.com/query/latest
- **WebSocket Hook:** `frontend/src/hooks/useJsonPatchWsStream.ts`
- **Mutation Pattern:** `frontend/src/hooks/useTaskMutations.ts`

## Related Issues

- #160 - Auto-refresh bug (manual state management)
- #150 - Duplicate API calls (bypassing React Query)
- #157 - Backend performance (N+1 queries, memory leaks)
