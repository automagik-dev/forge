# cy.prompt() Guide for Mobile Testing

This guide explains how to use Cypress Cloud's `cy.prompt()` feature to generate AI-powered tests for the Automagik Forge mobile native app.

## What is cy.prompt()?

`cy.prompt()` is a Cypress Cloud feature that generates test code from natural language prompts. Instead of writing explicit test assertions, you describe what you want to test in plain English, and Cypress AI generates the test code for you.

## Setup

### 1. Cypress Cloud Configuration

The project is already configured with Cypress Cloud:
- **Project ID**: `85rhk2` (in `cypress.config.ts`)
- **Record Key**: Set as `CYPRESS_RECORD_KEY` secret in GitHub Actions

### 2. Running Tests with Cypress Cloud

```bash
# Run tests and record to Cypress Cloud
# Set the record key as an environment variable (get from Cypress Cloud project settings)
export CYPRESS_RECORD_KEY=your-record-key-here
npx cypress run --record

# Or pass directly (not recommended for security)
npx cypress run --record --key <your-record-key>
```

**Security Note**: Never commit the actual record key to the repository. Store it as a GitHub Secret for CI/CD.

### 3. GitHub Actions Integration

Tests automatically record to Cypress Cloud when running in CI:
- Parallel execution across 2 containers
- Automatic test recording and reporting
- AI-powered test insights and analytics

## Using cy.prompt()

### Basic Syntax

```typescript
describe('My Feature', () => {
  it('should test something', () => {
    cy.prompt('Test that the bottom navigation displays 4 tabs on mobile')
  })
})
```

### Writing Effective Prompts

Good prompts are:
1. **Specific**: Describe exactly what to test
2. **Contextual**: Include viewport, device, or environment details
3. **Measurable**: Define success criteria
4. **Comprehensive**: Cover happy path and edge cases

#### Example: Poor Prompt
```typescript
cy.prompt('Test the navigation')
```

#### Example: Good Prompt
```typescript
cy.prompt(`
  Test that the bottom navigation displays all 4 tabs (Tasks, Chat, New, Me) 
  on iPhone 14 Pro viewport (393x852). Verify each tab is visible, has proper 
  touch target size (44x44px minimum), and navigates to the correct view when tapped.
`)
```

## Mobile-Native-App Prompts

Based on `.genie/wishes/mobile-native-app.md`, here are example prompts for each phase:

### Phase 1: Foundation

#### Bottom Navigation
```typescript
cy.prompt(`
  Test bottom navigation component on mobile:
  - Display 4 tabs: Tasks, Chat, New (FAB), Me
  - Each tab has icon and label
  - Active tab is highlighted
  - Touch targets are minimum 44x44px
  - Safe area insets are respected on iPhone 14 Pro
  - Tapping each tab navigates to correct view
  - Test on viewports: iPhone SE (375x667), iPhone 14 Pro (393x852)
`)
```

#### Bottom Sheets
```typescript
cy.prompt(`
  Test bottom sheet modal behavior:
  - Opens from bottom with slide-up animation
  - Has drag handle at top
  - Can be dismissed by:
    - Tapping backdrop
    - Swiping down on drag handle
    - Pressing Escape key
  - Properly handles safe area insets
  - Traps focus when open
  - Restores focus when closed
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Gestures
```typescript
cy.prompt(`
  Test touch gesture support:
  - Swipe left/right on task cards reveals actions
  - Long press on task card shows context menu
  - Pinch to zoom works on code diffs
  - Tap provides visual feedback (ripple effect)
  - Gestures maintain 60fps performance
  - No gesture conflicts between components
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Mobile Theme
```typescript
cy.prompt(`
  Test mobile theme and styling:
  - Typography scales appropriately for mobile (14-16px base)
  - Spacing uses 8px grid system
  - Colors have sufficient contrast (WCAG AA)
  - Safe area CSS variables are defined and used
  - Responsive breakpoints work: <768px mobile, >=768px tablet, >=1024px desktop
  - Touch targets are minimum 44x44px
  - Animations use hardware acceleration (transform, opacity)
  - Dark mode is supported
  - Test across iPhone SE, iPhone 14 Pro, iPad Mini
`)
```

### Phase 2: Core Views

#### Tasks List View
```typescript
cy.prompt(`
  Test mobile tasks list view:
  - Displays tasks in vertical list (not kanban columns)
  - Each task card shows: title, status icon, executor badge, timestamp
  - Status icons: spinning hammer (FORGE), checkmark (done), etc.
  - Filter tabs at top: All, In Progress, Review, Done
  - Swipe left on card reveals: View, Edit, Delete actions
  - Pull to refresh reloads task list
  - FAB button at bottom right creates new task
  - Virtual scrolling for performance with 100+ tasks
  - Empty state shows when no tasks
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Chat View
```typescript
cy.prompt(`
  Test mobile chat view:
  - Full-screen layout with header and input bar
  - Messages display in scrollable area
  - Input bar at bottom with:
    - Text input field
    - Attachment button
    - Voice input button
    - Send button
  - Executor selector in header
  - Attachment picker shows: Camera, Gallery, Files
  - Voice input shows recording UI
  - Auto-scroll to latest message
  - Keyboard pushes input bar up (not covered)
  - Progressive disclosure: collapsed tool uses, expandable on tap
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Diffs View
```typescript
cy.prompt(`
  Test mobile diffs view:
  - File carousel at top with horizontal scroll
  - Active file highlighted in carousel
  - Code display with syntax highlighting
  - Pinch to zoom on code (0.5x to 2x)
  - Inline comment markers on changed lines
  - Tap line to add comment
  - Bottom sheet for file list (all changed files)
  - Performance: smooth scrolling with large diffs
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Preview View
```typescript
cy.prompt(`
  Test mobile preview view:
  - Viewport selector: Mobile, Tablet, Desktop
  - Preview frame shows rendered output
  - Orientation toggle: Portrait/Landscape
  - Click tracking overlay shows interactive elements
  - Zoom controls: Fit, 100%, 150%, 200%
  - Refresh button reloads preview
  - Error state shows when preview fails
  - Performance: smooth frame rendering
  - Test on iPhone 14 Pro (393x852)
`)
```

### Phase 3: Advanced Features

#### Native Camera
```typescript
cy.prompt(`
  Test Capacitor camera integration:
  - Camera permission request on first use
  - Camera UI opens when tapping camera button
  - Can capture photo from camera
  - Can select photo from gallery
  - Image preview shows after capture
  - Image uploads successfully
  - Error handling for:
    - Permission denied
    - Camera not available
    - Upload failure
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Offline Support
```typescript
cy.prompt(`
  Test offline-first functionality:
  - Offline indicator shows when disconnected
  - Cached data accessible offline (tasks, messages, diffs)
  - Actions queued when offline (create task, send message)
  - Queue syncs automatically on reconnection
  - Conflict resolution for concurrent edits
  - Cache management (size limits, eviction)
  - Service worker caches static assets
  - Performance: fast load from cache
  - Test by simulating offline mode
`)
```

#### Performance
```typescript
cy.prompt(`
  Test mobile performance targets:
  - Bundle size: <500KB gzipped
  - First paint: <1.5s on 3G network simulation
  - Frame rate: 60fps during gestures and animations
  - Memory usage: <100MB during normal usage
  - Virtual scrolling: smooth with 1000+ items
  - Image optimization: lazy loading, responsive sizes
  - Code splitting: routes loaded on demand
  - Network: API calls <500ms on 3G
  - Lighthouse mobile score: >90
  - Test on iPhone 14 Pro (393x852) with throttling
`)
```

### Phase 4: Polish

#### Accessibility
```typescript
cy.prompt(`
  Test accessibility compliance (WCAG AA):
  - All interactive elements have ARIA labels
  - Proper ARIA roles on navigation and landmarks
  - Active tab has aria-current="page"
  - Buttons have descriptive aria-label
  - Live regions for dynamic content (aria-live="polite")
  - Keyboard navigation: Tab, Enter, Space, Escape
  - Visible focus indicators on all focusable elements
  - Color contrast ratios: 4.5:1 for text, 3:1 for UI
  - Touch targets: minimum 44x44px
  - Form inputs have labels and error associations
  - Screen reader support: descriptive alt text, heading hierarchy
  - Reduced motion support (prefers-reduced-motion)
  - Test with keyboard only and screen reader simulation
`)
```

#### Animations
```typescript
cy.prompt(`
  Test animations and transitions:
  - Bottom sheet slides up from bottom with easing
  - Page transitions fade smoothly
  - Status icons animate (spinning hammer)
  - Swipe gestures have smooth follow-through
  - Loading spinners and skeleton screens
  - Tap feedback (ripple effect)
  - Pull to refresh animation
  - Backdrop fades in/out
  - All animations maintain 60fps
  - Hardware acceleration used (transform, opacity)
  - Respect prefers-reduced-motion setting
  - Test on iPhone 14 Pro (393x852)
`)
```

#### Responsive Design
```typescript
cy.prompt(`
  Test responsive design across viewports:
  - iPhone SE (375x667): Mobile layout, bottom nav, compact spacing
  - iPhone 14 Pro (393x852): Mobile layout, bottom nav, standard spacing
  - Pixel 7 (412x915): Mobile layout, bottom nav, standard spacing
  - iPad Mini (768x1024): Mobile layout, bottom nav, larger spacing
  - Desktop (1280x720): Desktop layout, sidebar, no bottom nav
  - Orientation changes: Portrait to landscape maintains state
  - Font sizes scale appropriately
  - Spacing adapts to viewport
  - Images use responsive sizes (srcset)
  - Touch vs mouse interactions
  - Safe area handling on notched devices
  - Text scaling support (user font size preferences)
`)
```

## Best Practices

### 1. Combine cy.prompt() with Traditional Tests

Use cy.prompt() for exploratory testing and smoke tests, but keep deterministic tests for critical paths:

```typescript
describe('Bottom Navigation', () => {
  // Traditional deterministic test
  it('should display all tabs', () => {
    cy.get('[data-testid="bottom-nav-tasks"]').should('be.visible')
    cy.get('[data-testid="bottom-nav-chat"]').should('be.visible')
    cy.get('[data-testid="bottom-nav-new"]').should('be.visible')
    cy.get('[data-testid="bottom-nav-me"]').should('be.visible')
  })

  // AI-generated exploratory test
  it('should handle edge cases', () => {
    cy.prompt('Test bottom navigation edge cases: rapid tapping, long press, accessibility')
  })
})
```

### 2. Reference Specifications in Prompts

Include references to specification documents:

```typescript
cy.prompt(`
  Based on .genie/wishes/mobile-native-app.md Phase 1 Foundation specs,
  test the bottom navigation component with all requirements:
  [detailed requirements here]
`)
```

### 3. Iterate on Generated Tests

Review and refine AI-generated tests:
1. Run the generated test
2. Check if it covers all requirements
3. Add missing assertions
4. Refactor for clarity and maintainability

### 4. Use Prompts for Documentation

Prompts serve as living documentation of test intent:

```typescript
/**
 * Prompt: Test that swipe gestures on task cards work correctly:
 * - Swipe left reveals action buttons
 * - Swipe right dismisses actions
 * - Animation is smooth (60fps)
 * - Works on iPhone 14 Pro (393x852)
 */
cy.prompt('...')
```

## Resources

- [Cypress cy.prompt() Documentation](https://docs.cypress.io/api/commands/prompt)
- [cy.prompt() vs MCP Agents](https://www.cypress.io/blog/cy-prompt-vs-mcp-agents-ai-designed-for-testing-not-just-tasks)
- [Mobile Native App Specification](../.genie/wishes/mobile-native-app.md)
- [Component API Contracts](../.genie/wishes/mobile-native-app/specs/component-api-contracts.md)
- [Cypress Cloud Dashboard](https://cloud.cypress.io/projects/85rhk2)

## Troubleshooting

### cy.prompt() not working

1. Verify Cypress Cloud is configured:
   ```typescript
   // cypress.config.ts
   export default defineConfig({
     projectId: '85rhk2',
     // ...
   })
   ```

2. Ensure record key is set:
   ```bash
   export CYPRESS_RECORD_KEY=your-record-key-here
   ```
   Get your record key from Cypress Cloud project settings.

3. Run with --record flag:
   ```bash
   npx cypress run --record
   ```

### Tests not recording to Cloud

- Check network connectivity
- Verify record key is correct
- Check Cypress Cloud project settings
- Review GitHub Actions secrets configuration

### AI-generated tests failing

- Review generated code for accuracy
- Add missing data-testid attributes to components
- Refine prompt to be more specific
- Combine with traditional assertions for critical paths
