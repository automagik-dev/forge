# Migration Strategy: Desktop to Mobile

**Purpose:** Step-by-step strategy for migrating from desktop-first to mobile-first architecture  
**Status:** 📋 Planning Complete  
**Last Updated:** 2025-11-11

---

## Table of Contents

1. [Overview](#overview)
2. [Migration Phases](#migration-phases)
3. [Component Migration](#component-migration)
4. [Routing Migration](#routing-migration)
5. [State Management Migration](#state-management)
6. [API Integration Migration](#api-integration-migration)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)

---

## 1. Overview

### 1.1 Current State

**Desktop-First Architecture:**
- Responsive design with breakpoints
- Desktop-optimized layouts (sidebars, multi-column)
- Mouse/keyboard interactions
- Modal dialogs
- Desktop navigation patterns

**Key Files:**
```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Desktop layout
│   │   ├── Sidebar.tsx            # Desktop sidebar
│   │   └── TopBar.tsx             # Desktop top bar
│   ├── tasks/
│   │   ├── TasksKanban.tsx        # Desktop kanban
│   │   └── TaskCard.tsx           # Desktop card
│   └── ui/
│       └── dialog.tsx             # Desktop modals
├── pages/
│   ├── project-tasks.tsx          # Desktop tasks page
│   └── full-attempt-logs.tsx      # Desktop logs page
└── App.tsx                        # Desktop routing
```

### 1.2 Target State

**Mobile-First Architecture:**
- Mobile-optimized layouts (single column, bottom nav)
- Touch interactions (swipe, long-press, pinch)
- Bottom sheets instead of modals
- Mobile navigation patterns (bottom nav, FAB)
- Offline-first data fetching
- Native features (camera, haptics, notifications)

**New Structure:**
```
frontend/src/
├── components/
│   ├── mobile/                    # NEW: Mobile components
│   │   ├── BottomNavigation.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── MobileHeader.tsx
│   │   └── FAB.tsx
│   ├── tasks/
│   │   ├── TasksKanban.tsx        # UPDATED: Mobile-responsive
│   │   └── TaskCard.tsx           # UPDATED: Touch-friendly
│   └── ui/
│       └── dialog.tsx             # UPDATED: Mobile sheets
├── lib/
│   ├── native/                    # NEW: Native features
│   ├── offline/                   # NEW: Offline support
│   ├── gestures.ts                # NEW: Gesture handling
│   └── platform.ts                # NEW: Platform detection
├── pages/
│   ├── mobile/                    # NEW: Mobile-specific pages
│   └── project-tasks.tsx          # UPDATED: Mobile layout
└── App.tsx                        # UPDATED: Mobile routing
```

### 1.3 Migration Principles

1. **Incremental Migration** - Migrate one component at a time
2. **Backward Compatible** - Desktop functionality remains intact
3. **Feature Flags** - Toggle mobile features on/off
4. **Progressive Enhancement** - Start with core features, add advanced later
5. **Test Continuously** - Test on real devices throughout migration

---

## 2. Migration Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Setup mobile infrastructure

**Tasks:**
- [ ] Install Capacitor and plugins
- [ ] Create mobile component library
- [ ] Setup platform detection
- [ ] Configure mobile breakpoints
- [ ] Add safe area handling
- [ ] Create bottom navigation
- [ ] Create bottom sheet components
- [ ] Setup gesture library

**Deliverables:**
- Capacitor configured
- Mobile components ready
- Platform utilities available
- Mobile theme applied

**Risk Level:** Low  
**Impact:** Foundation for all future work

---

### Phase 2: Core Views (Weeks 3-5)
**Goal:** Migrate main views to mobile

**Tasks:**
- [ ] Migrate Kanban view
  - [ ] Horizontal scroll columns
  - [ ] Touch-friendly cards
  - [ ] Swipe actions
  - [ ] Pull to refresh
- [ ] Migrate Chat view
  - [ ] Full-screen conversation
  - [ ] Bottom input bar
  - [ ] Swipe to context
  - [ ] Voice input
- [ ] Migrate Diff view
  - [ ] Horizontal file navigation
  - [ ] Pinch to zoom
  - [ ] Inline comments
- [ ] Migrate Preview view
  - [ ] Full-screen preview
  - [ ] Gesture controls

**Deliverables:**
- Mobile-optimized Kanban
- Mobile-optimized Chat
- Mobile-optimized Diffs
- Mobile-optimized Preview

**Risk Level:** Medium  
**Impact:** Core user experience

---

### Phase 3: Advanced Features (Weeks 6-8)
**Goal:** Add mobile-specific features

**Tasks:**
- [ ] Implement offline support
  - [ ] IndexedDB setup
  - [ ] Offline queue
  - [ ] Sync manager
- [ ] Add native features
  - [ ] Camera integration
  - [ ] Push notifications
  - [ ] Haptic feedback
  - [ ] Share functionality
- [ ] Optimize performance
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Image optimization
  - [ ] Bundle size reduction

**Deliverables:**
- Offline-first data fetching
- Native features integrated
- Performance optimized

**Risk Level:** High  
**Impact:** Mobile-specific value

---

### Phase 4: Polish & Testing (Weeks 9-10)
**Goal:** Final polish and validation

**Tasks:**
- [ ] UI/UX polish
  - [ ] Animations
  - [ ] Transitions
  - [ ] Loading states
  - [ ] Error states
- [ ] Comprehensive testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Device testing
- [ ] Performance validation
  - [ ] Lighthouse audits
  - [ ] Bundle size checks
  - [ ] Memory profiling
- [ ] Documentation
  - [ ] User guide
  - [ ] Developer docs
  - [ ] API docs

**Deliverables:**
- Polished mobile experience
- Comprehensive test coverage
- Performance validated
- Documentation complete

**Risk Level:** Low  
**Impact:** Quality and maintainability

---

## 3. Component Migration

### 3.1 Migration Pattern

**Step 1: Identify Component**
```typescript
// Current: Desktop-only component
export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="p-4 border rounded">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
    </div>
  );
}
```

**Step 2: Add Platform Detection**
```typescript
import { Platform } from '@/lib/platform';

export function TaskCard({ task }: { task: Task }) {
  const isMobile = Platform.isNative() || window.innerWidth < 768;
  
  if (isMobile) {
    return <MobileTaskCard task={task} />;
  }
  
  return <DesktopTaskCard task={task} />;
}
```

**Step 3: Create Mobile Variant**
```typescript
function MobileTaskCard({ task }: { task: Task }) {
  const swipe = useSwipeGesture({
    onSwipeLeft: () => handleDelete(task.id),
    onSwipeRight: () => handleArchive(task.id)
  });
  
  return (
    <div 
      {...swipe()}
      className="p-4 border rounded touch-target-comfortable"
    >
      <h3 className="mobile-text-lg">{task.title}</h3>
      <p className="mobile-text-sm">{task.description}</p>
    </div>
  );
}
```

**Step 4: Refactor Desktop Variant**
```typescript
function DesktopTaskCard({ task }: { task: Task }) {
  return (
    <div className="p-4 border rounded hover:shadow-lg">
      <h3 className="text-lg">{task.title}</h3>
      <p className="text-sm">{task.description}</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => handleDelete(task.id)}>Delete</button>
        <button onClick={() => handleArchive(task.id)}>Archive</button>
      </div>
    </div>
  );
}
```

### 3.2 Component Migration Checklist

For each component:

**Analysis:**
- [ ] Identify mobile-specific requirements
- [ ] List desktop-only features
- [ ] Identify shared logic
- [ ] Plan mobile interactions

**Implementation:**
- [ ] Add platform detection
- [ ] Create mobile variant
- [ ] Update desktop variant
- [ ] Extract shared logic
- [ ] Add mobile styles
- [ ] Add touch interactions
- [ ] Add haptic feedback (if applicable)

**Testing:**
- [ ] Test on desktop
- [ ] Test on mobile web
- [ ] Test on Android
- [ ] Test touch interactions
- [ ] Test gestures
- [ ] Test offline behavior

**Documentation:**
- [ ] Update component docs
- [ ] Add usage examples
- [ ] Document mobile-specific props
- [ ] Document gestures

### 3.3 Priority Components

**High Priority (Week 3):**
1. TaskCard - Core task display
2. TasksKanban - Main task view
3. ConversationView - Chat interface
4. TaskFollowUpSection - Input area

**Medium Priority (Week 4):**
5. DiffViewer - Code review
6. FileTree - File navigation
7. LogsView - Execution logs
8. SettingsPanel - Configuration

**Low Priority (Week 5):**
9. ProjectSelector - Project switching
10. ExecutorSelector - Agent selection
11. BranchSelector - Git branches
12. SearchBar - Global search

---

## 4. Routing Migration

### 4.1 Current Routing

```typescript
// Current: Desktop routing
<Routes>
  <Route path="/" element={<AppLayout />}>
    <Route path="projects/:projectId/tasks" element={<ProjectTasks />} />
    <Route path="tasks/:taskId" element={<TaskDetail />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>
```

### 4.2 Mobile Routing

```typescript
// New: Mobile-aware routing
<Routes>
  <Route path="/" element={
    Platform.isNative() ? <MobileLayout /> : <AppLayout />
  }>
    {/* Mobile routes */}
    {Platform.isNative() && (
      <>
        <Route path="projects/:projectId/tasks" element={<MobileTasksView />} />
        <Route path="tasks/:taskId/chat" element={<MobileChatView />} />
        <Route path="tasks/:taskId/diffs" element={<MobileDiffsView />} />
        <Route path="settings" element={<MobileSettings />} />
      </>
    )}
    
    {/* Desktop routes */}
    {!Platform.isNative() && (
      <>
        <Route path="projects/:projectId/tasks" element={<ProjectTasks />} />
        <Route path="tasks/:taskId" element={<TaskDetail />} />
        <Route path="settings" element={<Settings />} />
      </>
    )}
  </Route>
</Routes>
```

### 4.3 Layout Migration

**Step 1: Create Mobile Layout**

```typescript
// MobileLayout.tsx
export function MobileLayout() {
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: <LayoutGrid />, path: '/tasks' },
    { id: 'chat', label: 'Chat', icon: <MessageSquare />, path: '/chat' },
    { id: 'new', label: 'New', icon: <PlusCircle />, onClick: openNewSheet },
    { id: 'me', label: 'Me', icon: <User />, path: '/settings' }
  ];

  return (
    <div className="h-screen-mobile flex flex-col">
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16">
        <Outlet />
      </main>
      
      {/* Bottom navigation */}
      <BottomNavigation tabs={tabs} />
      
      {/* Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
```

**Step 2: Update App.tsx**

```typescript
// App.tsx
function App() {
  const isMobile = Platform.isNative() || window.innerWidth < 768;
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isMobile ? <MobileLayout /> : <AppLayout />}>
            {/* Routes */}
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

## 5. State Management Migration

### 5.1 Current State Management

**React Query for API data:**
```typescript
// Current: Desktop-only
const { data: tasks } = useQuery({
  queryKey: ['tasks', projectId],
  queryFn: () => api.tasks.list(projectId)
});
```

### 5.2 Offline-First State Management

**New: Offline-first with React Query:**
```typescript
// New: Offline-first
const { data: tasks } = useQuery({
  queryKey: ['tasks', projectId, 'offline'],
  queryFn: () => OfflineFetch.getTasks(projectId),
  staleTime: isOnline ? 5 * 60 * 1000 : Infinity,
  gcTime: Infinity
});
```

### 5.3 Migration Steps

**Step 1: Add Offline Fetch Layer**
```typescript
// Before
const tasks = await api.tasks.list(projectId);

// After
const tasks = await OfflineFetch.getTasks(projectId);
```

**Step 2: Update Query Keys**
```typescript
// Before
queryKey: ['tasks', projectId]

// After
queryKey: ['tasks', projectId, 'offline']
```

**Step 3: Add Optimistic Updates**
```typescript
const mutation = useMutation({
  mutationFn: (task: Task) => api.tasks.create(projectId, task),
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['tasks', projectId]);
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks', projectId]);
    
    // Optimistically update
    queryClient.setQueryData(['tasks', projectId], (old: Task[]) => [
      ...old,
      { ...newTask, id: 'temp-' + Date.now() }
    ]);
    
    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks', projectId], context.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['tasks', projectId]);
  }
});
```

---

## 6. API Integration Migration

### 6.1 Current API Client

```typescript
// Current: Direct API calls
export const api = {
  tasks: {
    list: (projectId: string) => 
      fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()),
    
    create: (projectId: string, task: CreateTaskInput) =>
      fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task)
      }).then(r => r.json())
  }
};
```

### 6.2 Offline-Aware API Client

```typescript
// New: Offline-aware API client
export const api = {
  tasks: {
    list: async (projectId: string) => {
      // Check network status
      const { connected } = await NetworkService.getStatus();
      
      if (!connected) {
        // Return cached data
        return DatabaseManager.getTasks(projectId);
      }
      
      // Fetch from API
      const tasks = await fetch(`/api/projects/${projectId}/tasks`)
        .then(r => r.json());
      
      // Cache for offline use
      for (const task of tasks) {
        await DatabaseManager.saveTask(task);
      }
      
      return tasks;
    },
    
    create: async (projectId: string, task: CreateTaskInput) => {
      // Check network status
      const { connected } = await NetworkService.getStatus();
      
      if (!connected) {
        // Queue for later
        await QueueManager.queueAction('create-task', {
          projectId,
          task
        });
        
        // Return optimistic response
        return { ...task, id: 'temp-' + Date.now() };
      }
      
      // Create via API
      return fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task)
      }).then(r => r.json());
    }
  }
};
```

---

## 7. Testing Strategy

### 7.1 Testing Phases

**Phase 1: Unit Tests**
- Test mobile components in isolation
- Test gesture handlers
- Test offline utilities
- Test platform detection

**Phase 2: Integration Tests**
- Test component interactions
- Test offline/online transitions
- Test sync behavior
- Test conflict resolution

**Phase 3: E2E Tests**
- Test complete user flows
- Test on real devices
- Test offline scenarios
- Test performance

### 7.2 Device Testing Matrix

| Device | OS | Screen | Priority |
|--------|----|----|----------|
| Pixel 7 | Android 14 | 412x915 | High |
| Samsung Galaxy S21 | Android 13 | 360x800 | High |
| OnePlus 9 | Android 12 | 412x919 | Medium |
| Pixel 4a | Android 11 | 393x851 | Medium |
| Budget Phone | Android 10 | 360x640 | Low |

### 7.3 Testing Checklist

**Per Component:**
- [ ] Desktop functionality intact
- [ ] Mobile layout correct
- [ ] Touch interactions work
- [ ] Gestures work
- [ ] Haptics work (native)
- [ ] Offline behavior correct
- [ ] Performance acceptable

**Per Feature:**
- [ ] Works on desktop
- [ ] Works on mobile web
- [ ] Works on Android
- [ ] Works offline
- [ ] Syncs correctly
- [ ] Handles errors gracefully

---

## 8. Rollback Plan

### 8.1 Feature Flags

```typescript
// Feature flags for gradual rollout
export const FEATURES = {
  MOBILE_LAYOUT: process.env.VITE_MOBILE_LAYOUT === 'true',
  OFFLINE_MODE: process.env.VITE_OFFLINE_MODE === 'true',
  NATIVE_FEATURES: process.env.VITE_NATIVE_FEATURES === 'true',
  BOTTOM_SHEETS: process.env.VITE_BOTTOM_SHEETS === 'true'
};

// Usage
if (FEATURES.MOBILE_LAYOUT && isMobile) {
  return <MobileLayout />;
}
return <DesktopLayout />;
```

### 8.2 Rollback Triggers

**Automatic Rollback:**
- Error rate > 5%
- Performance degradation > 20%
- Crash rate > 1%

**Manual Rollback:**
- Critical bugs discovered
- User feedback negative
- Business decision

### 8.3 Rollback Procedure

**Step 1: Disable Feature Flags**
```bash
# Disable mobile features
VITE_MOBILE_LAYOUT=false
VITE_OFFLINE_MODE=false
VITE_NATIVE_FEATURES=false
```

**Step 2: Revert Code (if needed)**
```bash
git revert <commit-hash>
git push origin dev
```

**Step 3: Redeploy**
```bash
npm run build
# Deploy to production
```

**Step 4: Monitor**
- Check error rates
- Check performance metrics
- Check user feedback

---

## 9. Migration Timeline

```
Week 1-2: Foundation
├─ Capacitor setup
├─ Mobile components
├─ Platform detection
└─ Mobile theme

Week 3-5: Core Views
├─ Kanban migration
├─ Chat migration
├─ Diffs migration
└─ Preview migration

Week 6-8: Advanced Features
├─ Offline support
├─ Native features
└─ Performance optimization

Week 9-10: Polish & Testing
├─ UI/UX polish
├─ Comprehensive testing
├─ Performance validation
└─ Documentation
```

---

## 10. Success Criteria

**Technical:**
- [ ] All core features work on mobile
- [ ] 100% feature parity with desktop
- [ ] Performance targets met
- [ ] Offline mode functional
- [ ] Native features integrated

**User Experience:**
- [ ] UX rating 9/10 on mobile
- [ ] Touch interactions smooth
- [ ] Gestures intuitive
- [ ] Loading times fast
- [ ] Offline experience seamless

**Quality:**
- [ ] Test coverage > 80%
- [ ] Zero critical bugs
- [ ] Performance validated
- [ ] Documentation complete
- [ ] Code reviewed

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Complete
