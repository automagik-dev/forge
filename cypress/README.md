# Automated QA Testing for Automagik Forge Mobile

This directory contains comprehensive end-to-end (E2E) tests for the Automagik Forge mobile native app implementation using Cypress.

## Overview

The test suite is organized into 4 phases matching the mobile implementation plan outlined in `.genie/wishes/mobile-native-app.md`:

- **Phase 1: Foundation** - Bottom navigation, bottom sheets, gestures, mobile theme
- **Phase 2: Core Views** - Tasks list, chat, diffs, preview
- **Phase 3: Advanced Features** - Camera, notifications, offline support, performance
- **Phase 4: Polish** - Animations, accessibility, responsive design

## Test Structure

```
cypress/
├── e2e/
│   ├── phase-1-foundation/
│   │   ├── bottom-navigation.cy.ts
│   │   ├── bottom-sheets.cy.ts
│   │   ├── gestures.cy.ts
│   │   └── mobile-theme.cy.ts
│   ├── phase-2-core-views/
│   │   ├── tasks-list-view.cy.ts
│   │   ├── chat-view.cy.ts
│   │   ├── diffs-view.cy.ts
│   │   └── preview-view.cy.ts
│   ├── phase-3-advanced-features/
│   │   ├── native-camera.cy.ts
│   │   ├── offline-support.cy.ts
│   │   └── performance.cy.ts
│   └── phase-4-polish/
│       ├── accessibility.cy.ts
│       ├── animations.cy.ts
│       └── responsive.cy.ts
├── support/
│   ├── commands.ts       # Custom Cypress commands
│   ├── e2e.ts           # E2E test setup
│   └── component.ts     # Component test setup
├── fixtures/            # Test data
└── README.md           # This file
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
pnpm install
cd frontend && pnpm install
```

2. Build the application:
```bash
# Build backend
cargo build --release

# Build frontend
cd frontend && pnpm run build
```

3. Start the servers:
```bash
# Terminal 1: Start backend
cargo run --release --bin forge-app

# Terminal 2: Start frontend
cd frontend && pnpm run preview
```

### Run All Tests

```bash
# Open Cypress Test Runner (interactive)
npx cypress open

# Run all tests headlessly
npx cypress run

# Run specific phase
npx cypress run --spec "cypress/e2e/phase-1-foundation/**/*.cy.ts"
```

### Run Tests by Phase

```bash
# Phase 1: Foundation
npx cypress run --spec "cypress/e2e/phase-1-foundation/**/*.cy.ts"

# Phase 2: Core Views
npx cypress run --spec "cypress/e2e/phase-2-core-views/**/*.cy.ts"

# Phase 3: Advanced Features
npx cypress run --spec "cypress/e2e/phase-3-advanced-features/**/*.cy.ts"

# Phase 4: Polish
npx cypress run --spec "cypress/e2e/phase-4-polish/**/*.cy.ts"
```

### Run Tests for Specific Viewports

```bash
# iPhone 14 Pro (393x852)
npx cypress run --config viewportWidth=393,viewportHeight=852

# iPhone SE (375x667)
npx cypress run --config viewportWidth=375,viewportHeight=667

# Pixel 7 (412x915)
npx cypress run --config viewportWidth=412,viewportHeight=915

# iPad Mini (768x1024)
npx cypress run --config viewportWidth=768,viewportHeight=1024

# Desktop (1280x720)
npx cypress run --config viewportWidth=1280,viewportHeight=720
```

## Custom Commands

The test suite includes custom Cypress commands for mobile testing:

### Viewport Commands

```typescript
// Set mobile viewport by device name
cy.setMobileViewport('iphone-14-pro')
cy.setMobileViewport('ipad-mini')
```

### Gesture Commands

```typescript
// Swipe gestures
cy.swipe('[data-testid="task-card"]', 'left')
cy.swipe('[data-testid="task-card"]', 'right')

// Long press
cy.longPress('[data-testid="task-card"]', 500)

// Check if element is in viewport
cy.isInViewport('[data-testid="element"]')
```

### Touch Target Commands

```typescript
// Check minimum touch target size (44x44px)
cy.checkTouchTarget('[data-testid="button"]')

// Check safe area handling
cy.checkSafeArea()
```

### App-Specific Commands

```typescript
// Wait for app to be ready
cy.waitForAppReady()

// Check mobile layout
cy.checkMobileLayout()

// Check bottom navigation
cy.checkBottomNav()
```

## Test Coverage

### Phase 1: Foundation (4 test files, ~150 tests)

- **Bottom Navigation**: Tab navigation, touch targets, responsive behavior, accessibility
- **Bottom Sheets**: Gestures, animations, keyboard handling, one-handed operation
- **Gestures**: Swipe, long press, pinch, tap, gesture conflicts, performance
- **Mobile Theme**: Typography, spacing, colors, safe areas, breakpoints, animations

### Phase 2: Core Views (4 test files, ~120 tests)

- **Tasks List View**: Vertical list, status icons, filter tabs, swipe actions, FAB, virtualization
- **Chat View**: Full-screen layout, input bar, executor selector, attachment picker, voice input
- **Diffs View**: File carousel, code display, pinch to zoom, inline comments
- **Preview View**: Viewport selector, orientation controls, click tracking, zoom controls

### Phase 3: Advanced Features (3 test files, ~90 tests)

- **Native Camera**: Camera access, permissions, image capture, gallery access, error handling
- **Offline Support**: Offline indicator, cached data, action queue, sync, conflict resolution
- **Performance**: Load performance, bundle size, frame rate, memory usage, virtual scrolling

### Phase 4: Polish (3 test files, ~100 tests)

- **Accessibility**: ARIA attributes, keyboard navigation, color contrast, screen readers, touch targets
- **Animations**: Bottom sheets, page transitions, status icons, swipe animations, micro-interactions
- **Responsive Design**: Mobile/tablet/desktop viewports, orientation changes, content adaptation

**Total: ~460 comprehensive tests**

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev` branches

The CI pipeline runs tests across multiple viewports:
- iPhone 14 Pro (393x852)
- iPad Mini (768x1024)
- Desktop (1280x720)

Test results, screenshots, and videos are uploaded as artifacts for failed tests.

## Performance Targets

Tests validate the following performance targets from the mobile-native-app specs:

- **Bundle Size**: <500KB gzipped
- **First Paint**: <1.5s (3G network)
- **Frame Rate**: 60fps (gestures/animations)
- **Memory Usage**: <100MB
- **Lighthouse Score**: >90 mobile score

## Accessibility Standards

Tests validate WCAG AA compliance:
- Minimum touch target size: 44x44px
- Color contrast ratios
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management

## Writing New Tests

### Test File Template

```typescript
/**
 * Feature Tests: [Feature Name]
 * Tests for [description]
 * Based on mobile-native-app.md [Phase] specs
 */

describe('[Feature Name] - [Phase]', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-14-pro')
    cy.visit('/')
    cy.waitForAppReady()
  })

  describe('[Test Group]', () => {
    it('should [test description]', () => {
      // Test implementation
    })
  })
})
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Test user behavior**, not implementation details
3. **Keep tests independent** - each test should run in isolation
4. **Use custom commands** for common operations
5. **Test across viewports** - mobile, tablet, desktop
6. **Validate accessibility** - ARIA, keyboard navigation, contrast
7. **Check performance** - load times, frame rates, memory
8. **Test error states** - offline, permissions denied, network errors

## Troubleshooting

### Tests Failing Locally

1. Ensure servers are running:
```bash
# Check backend
curl http://localhost:8887/health

# Check frontend
curl http://localhost:3000
```

2. Clear Cypress cache:
```bash
npx cypress cache clear
npx cypress install
```

3. Run tests with debug output:
```bash
DEBUG=cypress:* npx cypress run
```

### CI Tests Failing

1. Check GitHub Actions logs for detailed error messages
2. Download screenshot/video artifacts from failed runs
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Mobile Native App Specs](../.genie/wishes/mobile-native-app.md)
- [Phase 1 Foundation Spec](../.genie/wishes/mobile-native-app/specs/phase-1-foundation-technical-spec.md)
- [Component API Contracts](../.genie/wishes/mobile-native-app/specs/component-api-contracts.md)

## Contributing

When adding new mobile features:

1. Add corresponding test files to the appropriate phase directory
2. Update this README with new test coverage information
3. Add custom commands to `support/commands.ts` if needed
4. Ensure tests pass locally before creating PR
5. Verify CI tests pass after PR creation

## Support

For questions or issues with the test suite:
- Review the mobile-native-app.md specification
- Check existing test files for examples
- Consult Cypress documentation for API reference
