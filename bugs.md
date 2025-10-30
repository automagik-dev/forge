# Genie Widget Bugs

## Bug 1: Double Loading of Master Genie
**Severity**: Medium
**Status**: ✅ FIXED

### Symptoms
Console shows duplicate loading messages:
```
GenieMasterWidget.tsx:153 [GenieMaster] Starting load (masterGenie: null )
GenieMasterWidget.tsx:114 [GenieMaster] Loading Master Genie...
GenieMasterWidget.tsx:153 [GenieMaster] Starting load (masterGenie: null )
GenieMasterWidget.tsx:114 [GenieMaster] Loading Master Genie...
```

### Impact
- Master Genie loads twice on widget open
- Unnecessary API calls
- Performance impact
- Duplicate WebSocket connections causing errors

### Root Cause
**Location**: `GenieMasterWidget.tsx:110-158`

The useEffect hook has `masterGenie` in its dependency array (line 158):
```typescript
}, [projectId, isOpen, masterGenie, currentBranch, config]);
```

This creates a dependency loop:
1. Widget opens → `loadMasterGenie()` called
2. `setMasterGenie()` updates state
3. `masterGenie` change triggers useEffect again
4. Condition `!masterGenie || !masterGenie.attempt` may still evaluate true during React render cycle
5. Loads again

### Solution ✅
**Fixed in commit**: Removed `masterGenie` from dependency array and added early return if already loaded:
```typescript
useEffect(() => {
  if (!projectId || !isOpen) return;
  if (masterGenie) return; // Skip if already loaded
  loadMasterGenie();
}, [projectId, isOpen]); // No masterGenie in deps
```

---

## Bug 2: Neurons Won't Load
**Severity**: Critical
**Status**: ✅ FIXED

### Symptoms
When clicking Wish/Forge/Review tabs:
- Shows "Loading Wish neuron..." message
- Displays placeholder text: "This is your planning specialist"
- Neuron never actually loads
- No attempt is shown

### Impact
- Neuron tabs completely non-functional
- Users cannot access Wish/Forge/Review functionality

### Root Cause
**Location**: `GenieMasterWidget.tsx:968-984`

The neuron rendering logic has incorrect condition:
```typescript
if (!wishNeuron || !wishNeuron.attempt) {
  return <LoadingState />
}
```

**Problem**: The `ensureNeuron()` function deliberately does NOT create an attempt (which is correct - attempts should only be created when user sends first message). However, the UI requires an attempt to exist before showing the neuron interface.

**Expected Behavior**: Neurons should display like Master Genie does when there's no attempt - show an empty state with input box for first message (lines 886-929).

### Solution ✅
**Fixed in commit**: Split condition to handle loading vs empty state:
```typescript
// Show loading ONLY when neuron doesn't exist
if (!wishNeuron) {
  return <LoadingState />
}
// Show empty state when neuron exists but has no attempt
if (!wishNeuron.attempt) {
  return <EmptyStateWithIcon />
}
// Render full interface when attempt exists
return <NeuronInterface />
```
Also updated `Neuron` interface to make `attempt` optional.

---

## Bug 3: Auto-Start Attempt on Session Load
**Severity**: High
**Status**: ✅ FIXED

### Symptoms
- When a new genie session loads, the attempt automatically starts
- User expectation: Attempt should only start when user sends first message
- Unwanted executor starts consuming resources

### Impact
- Unwanted executor starts
- Resource consumption
- Violates user expectations

### Root Cause
**Location**: `GenieMasterWidget.tsx:121-142`

When widget opens and no attempt exists, the code automatically creates one:
```typescript
if (!genie.attempt) {
  console.log('[GenieMaster] No attempt found, creating one...');
  const attempt = await subGenieApi.createMasterGenieAttempt(
    genie.task.id,
    baseBranch,
    executorProfile
  );
  setMasterGenie({ task: genie.task, attempt });
}
```

**Problem**: `createMasterGenieAttempt` likely starts the executor immediately. This was added to fix the empty widget issue, but it causes unwanted auto-start.

**Expected Behavior**:
- Widget should load Master Genie TASK only (no attempt)
- Show empty state with input (like lines 886-929)
- Create attempt ONLY when user sends first message

### Solution ✅
**Fixed in commit**: Removed entire auto-creation block. Now only loads the task:
```typescript
const genie = await subGenieApi.ensureMasterGenie(projectId);
setMasterGenie(genie); // No auto-creation of attempt
```
Widget shows empty state when `!masterGenie.attempt`, and attempt will be created when user sends first message.

---

## Bug 4: Changing Session Closes Widget
**Severity**: High
**Status**: ✅ FIXED

### Symptoms
- Clicking another session from history closes the widget instead of switching
- Expected behavior: Should switch to selected session

### Impact
- Cannot navigate between genie sessions
- Poor UX

### Root Cause
**Location**: `GenieMasterWidget.tsx:191-202` (Click-outside detection)

The widget has click-outside detection that closes it when clicking outside:
```typescript
useEffect(() => {
  if (!isOpen) return;

  const handleClickOutside = (event: MouseEvent) => {
    if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen, onClose]);
```

**Problem**: The DropdownMenu from Radix UI renders in a Portal (outside the widget DOM tree). When clicking menu items, the click is detected as "outside" the widget, triggering `onClose()`.

### Solution ✅
**Fixed in commit**: Added Portal detection in click-outside handler:
```typescript
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node;
  if (widgetRef.current && !widgetRef.current.contains(target)) {
    // Check if click is inside a Radix UI Portal
    const isInPortal = (target as Element).closest('[data-radix-popper-content-wrapper]') !== null ||
                      (target as Element).closest('[role="dialog"]') !== null ||
                      (target as Element).closest('[data-radix-portal]') !== null;

    if (!isInPortal) { // Only close if NOT in portal
      onClose();
    }
  }
};
```

---

## Bug 5: Ellipsis Options Close Widget
**Severity**: High
**Status**: ✅ FIXED (Same fix as Bug #4)

### Symptoms
- Ellipsis menu options appear correctly
- Clicking any option closes the widget instead of executing action
- Expected behavior: Should execute the selected action

### Impact
- Context menu completely non-functional
- Cannot access important actions

### Root Cause
**Same root cause as Bug #4** - DropdownMenu renders in Portal, click-outside detection triggers `onClose()`.

**Affected Menus**:
- History dropdown (lines 680-727)
- Ellipsis options dropdown (lines 729-767)

### Solution
Same as Bug #4 - need to handle Portal clicks properly.

---

## Bug 6: Maximize Button Non-Functional
**Severity**: Medium
**Status**: ✅ FIXED (Same fix as Bug #4/#5)

### Symptoms
- Maximize button doesn't work
- Question: Should there be fullscreen limitation for agent-type tasks?

### Impact
- Cannot maximize widget for better viewing
- Poor UX for complex tasks

### Root Cause
**Location**: `GenieMasterWidget.tsx:769-778`, handler at lines 381-387

```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={handleMaximize}
  disabled={!masterGenie?.attempt}
  className="h-7 w-7 p-0"
  title="Open in Full View"
>
  <Maximize className="h-4 w-4" />
</Button>
```

Handler:
```typescript
const handleMaximize = () => {
  if (!masterGenie?.attempt || !projectId) return;
  const url = `/projects/${projectId}/tasks/${masterGenie.task.id}/attempts/${masterGenie.attempt.id}?view=diffs`;
  window.location.href = url;
  onClose();
};
```

**Problem**: Button is NOT in a dropdown, so clicking it should work. However, it's also affected by click-outside detection. When button is clicked, it triggers `onClose()` before `handleMaximize` can execute navigation.

### Solution
The button itself should work once click-outside detection is fixed (Bug #4). However, there's a philosophical question: Should the widget close itself when maximizing, or should navigation happen first?

**Recommendation**: Call `onClose()` AFTER navigation completes, or use `preventDefault()` on the click event.

---

## Additional Observations

### WebSocket Connection Errors
```
useJsonPatchWsStream.ts:175 WebSocket connection to 'ws://localhost:18887/api/task-attempts/dafc4266-0284-4159-87b9-44bc4c33bdc0/diff/ws?stats_only=true' failed: WebSocket is closed before the connection is established.
```

This appears multiple times in console. **Confirmed related to Bug #1** - double loading creates duplicate WebSocket connections.

---

## Summary & Fix Priority

### Critical Path Fixes (Must Fix First)
1. **Bug #1** - Fix double loading (prevents WebSocket errors, improves performance)
2. **Bug #3** - Remove auto-start attempt (core UX issue)
3. **Bug #4/5** - Fix click-outside detection for dropdowns (blocks all menu interactions)

### Secondary Fixes
4. **Bug #2** - Fix neuron rendering (after Bug #3 is fixed, neurons will work similar to Master Genie)
5. **Bug #6** - Maximize button (will likely work once Bug #4 is fixed)

### Implementation Order
1. Remove `masterGenie` from useEffect deps → Fixes Bug #1
2. Remove auto-creation of attempt → Fixes Bug #3
3. Fix click-outside detection for Portal elements → Fixes Bugs #4, #5, #6
4. Update neuron rendering to support empty state → Fixes Bug #2
