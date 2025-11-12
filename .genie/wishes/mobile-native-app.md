# WISH: Forge Mobile Native App

**Issue:** [#113](https://github.com/namastexlabs/automagik-forge/issues/113)
**Branch:** `mobile-native-app`
**Status:** 📋 PLANNING COMPLETE (WITH ENGAGEMENT ENHANCEMENTS)
**Priority:** 🟡 HIGH (Major UX Enhancement)

---

## Problem Statement

Forge's current mobile experience is **unbearable**:
- ❌ Desktop UI squeezed onto mobile screens
- ❌ Kanban columns unusable (<400px width each)
- ❌ No touch gestures (swipe, long-press, pinch)
- ❌ Tiny buttons, hard to tap
- ❌ Horizontal scrolling required everywhere
- ❌ No offline support
- ❌ Binary responsive design (1 breakpoint: 1280px)
- ❌ Modals instead of bottom sheets
- ❌ Keyboard shortcuts don't work on mobile
- ❌ No native features (camera, notifications, haptics)

**Current UX Rating:** 2/10 on mobile
**User Feedback:** "Impossible to use on phone"

---

## Desired Outcome

✅ **World-class native mobile app** (Android APK)
✅ **100% feature parity** with desktop (nothing lost)
✅ **Touch-optimized** - all interactions designed for thumbs
✅ **Gesture-rich** - swipe navigation, long-press menus
✅ **Offline-capable** - core features work without internet
✅ **Native feel** - indistinguishable from ChatGPT/Claude mobile
✅ **Fast & smooth** - 60fps, <1.5s load time
✅ **One-handed** - 80% tasks completable with thumb

**Target UX Rating:** 9/10 on mobile
**Inspiration:** ChatGPT, Claude, Perplexity, Gemini, Poe mobile apps

---

## Solution Design

### Architecture Overview

**Navigation:**
```
Bottom Navigation (4 tabs):
┌──┬──┬──┬──┐
│📋│💬│➕│👤│
│  │  │  │  │
└──┴──┴──┴──┘
Tasks Chat New Me
```

**Key Design Decisions:**
1. **Chat-First Interface** - Full-screen conversations (like ChatGPT)
2. **Bottom Navigation** - Thumb-accessible, always visible
3. **Bottom Sheets** - Not modals (one-handed operation)
4. **Gesture Navigation** - Swipe to delete, long-press for menu
5. **Progressive Disclosure** - Collapse by default, expand on-demand
6. **Offline-First** - Cache data, queue actions, sync when online

### Core Views (Mobile Redesign)

#### 1. **Kanban Board → Task List View (Forge Workflow)**
```
┌────────────────────────────────┐
│ All | WISH | FORGE | REVIEW | DONE │
├────────────────────────────────┤
│ ✨ WISH  Task Title            │
│         Planning phase...      │
├────────────────────────────────┤
│ 🔨 FORGE Running Task     4/12 │
│         [Spinning Hammer]      │
├────────────────────────────────┤
│ 🎯 REVIEW Task Under Review    │
│         Validation phase...    │
├────────────────────────────────┤
│ ✅ DONE  Completed Task        │
│         Task completed!        │
└────────────────────────────────┘
```
- **Vertical list of Task cards** (like ChatGPT, Manus)
- Each card represents a Task with current status
- **Forge Workflow**: WISH → FORGE → REVIEW → DONE
  - **WISH** (`status: "todo"`): Planning phase - human and AI interact until approved
  - **FORGE** (`status: "inprogress"`): Execution phase - TaskAttempts run, shows progress (e.g., "4/12" ExecutionProcesses)
  - **REVIEW** (`status: "inreview"`): Validation phase - results reviewed and approved
  - **DONE** (`status: "done"`): Task completed
- Status icons with animations (Lucide icons):
  - `Sparkles` WISH (planning)
  - `Hammer` FORGE (spinning when TaskAttempt is running)
  - `Target` REVIEW (validation)
  - `CheckCircle2` DONE (completed)
- Progress indicator (FORGE only): "4/12" shows ExecutionProcess count
- Approval gates between stages (WISH→FORGE, FORGE→REVIEW, REVIEW→DONE)
- Swipe left on card → Delete
- Tap card → Open task details
- Long press → Menu
- Filter tabs: All, WISH, FORGE, REVIEW, DONE, Favorites, Scheduled

#### 2. **Chat View → Full-Screen**
```
┌────────────────────────────────┐
│  👤 User message               │
│  🤖 AI response                │
│  ⚙️ Tool call (collapsed)      │
│  📄 File changes               │
└────────────────────────────────┘
┌────────────────────────────────┐
│ 🤖  Type message... 📎 🎤  ➡️  │
└────────────────────────────────┘
```
- Fixed bottom input bar
- Auto-expand up to 4 lines
- Voice input, camera, attachments
- Executor selector (bottom sheet)

#### 3. **Diffs View → File Carousel**
```
┌────────────────────────────────┐
│  button.tsx (+12 -5)           │
│  [← Prev] [Next →] [All Files] │
├────────────────────────────────┤
│ 44+ style={{color:'blue'}}     │
│ 45  >Click</button>            │
└────────────────────────────────┘
```
- Swipe left/right to navigate files
- Pinch to zoom code
- Tap line → Inline comment

#### 4. **Preview → Responsive Viewports**
```
┌────────────────────────────────┐
│  📱 Viewport: iPhone 14 ▼      │
├────────────────────────────────┤
│  <iframe preview>              │
└────────────────────────────────┘
```
- Responsive viewport picker
- Click tracking (tap element)
- Rotate to landscape

#### 5. **Task Creation → Bottom Sheet**
```
┌────────────────────────────────┐
│  Title *                       │
│  Description                   │
│  📷 Camera  🖼️ Gallery          │
│  Provider • Agent              │
│  [Create & Start]              │
└────────────────────────────────┘
```
- Native camera integration
- Executor picker (sheet)
- Full keyboard support

---

## Supporting Documentation

### Technical Specifications (in `.genie/wishes/mobile-native-app/specs/`)

**1. Phase 1 Foundation Technical Spec** (`specs/phase-1-foundation-technical-spec.md`)
- 985 lines of detailed Phase 1 implementation guidance
- Capacitor setup and configuration
- Mobile breakpoints and responsive design system
- Bottom navigation component architecture
- Bottom sheets system with gesture support
- Gesture library integration (use-gesture)
- Mobile theme (spacing, typography, colors, safe areas)
- Testing strategy and performance targets

**2. Component API Contracts** (`specs/component-api-contracts.md`)
- 700+ lines of TypeScript interfaces
- Core types and data structures
- Navigation component contracts (BottomNavigation, BottomSheet)
- Gesture system types (SwipeGesture, LongPressGesture, PinchGesture)
- Layout and view contracts (MobileLayout, TasksKanbanView, ConversationView)
- Native features interfaces (Camera, Notifications, Haptics)
- State management types (offline-first patterns)

**3. Capacitor Native Features Spec** (`specs/capacitor-native-features-spec.md`)
- 2,500 lines covering all native integrations
- Camera integration (permissions, configuration, React hooks, UI)
- Push notifications (Firebase setup, implementation, React hooks)
- Haptic feedback (8 types: light, medium, heavy, success, warning, error, selection, vibrate)
- Share target (text, URL, files, tasks, conversations)
- Status bar & keyboard management
- App state & lifecycle handling
- File system operations
- Network status monitoring
- Complete testing strategy with device matrix

**4. Offline Strategy Spec** (`specs/offline-strategy-spec.md`)
- 2,000 lines of offline-first architecture
- IndexedDB schema for all entities (projects, tasks, attempts, conversations, diffs)
- Offline queue system with retry logic and exponential backoff
- Sync strategy with background synchronization
- Conflict resolution (version-mismatch, deleted, concurrent-edit)
- React hooks for offline-first data fetching (useOfflineTasks, useOfflineConversation)
- Testing strategy with offline scenarios

**5. Performance Monitoring Spec** (`specs/performance-monitoring-spec.md`)
- 2,200 lines of performance optimization guidance
- Performance budgets (bundle: <500KB, load: <1.5s, FPS: 60, memory: <100MB)
- Monitoring strategy (Web Vitals, navigation timing, resource timing, long tasks)
- Optimization techniques (code splitting, lazy loading, tree shaking, memoization)
- Bundle analysis tools and CI/CD integration
- Runtime performance monitoring (React DevTools Profiler, Chrome DevTools)
- Network performance optimization (caching, batching, compression)

**6. Migration Strategy** (`specs/migration-strategy.md`)
- 2,500 lines of step-by-step migration guidance
- Component migration pattern with platform detection
- Routing migration from desktop to mobile navigation
- State management migration to offline-first
- API integration migration for offline support
- Testing strategy with device matrix
- Feature flags for gradual rollout (MOBILE_LAYOUT, OFFLINE_MODE, NATIVE_FEATURES)
- Rollback procedures and success criteria

**7. Data Flow Architecture** (`specs/data-flow-architecture.md`)
- 2,000+ lines of data flow diagrams and architecture
- Offline-first data flow (read and write flows)
- Task management flow (view, create, update tasks)
- Conversation flow (view conversation, send follow-ups)
- Native features flow (camera, push notifications)
- Sync flow (background sync, periodic sync)
- State management (React Query + IndexedDB structure)
- Error handling and conflict resolution flows

**8. Design System & Branding Spec** (`specs/design-system-and-branding-spec.md`) **NEW**
- 1,150 lines of comprehensive design system documentation
- Brand colors extracted from Automagik branding (magenta-cyan gradient)
- Dark theme (primary): OLED-optimized with brand colors
- Light theme: Alternative for bright environments
- Typography scale (display, headings, body, labels, code)
- Spacing system (4px base unit)
- Component styles (buttons, cards, badges, inputs, bottom sheets)
- Border radius, shadows, animations, transitions
- Haptic feedback guidelines (8 types)
- Accessibility standards (WCAG AA compliant)
- Implementation guide with React Native/Capacitor examples
- Theme context and CSS variables export

**9. Session Card Component Spec** (`specs/session-card-component-spec.md`) **NEW**
- 600+ lines of session card component specification
- Vertical list view design (ChatGPT/Manus-style)
- Status icons with animations (Wish 🎯, Forge ⚙️, Review 👁️, Completed ✅)
- Progress indicators and metadata display
- Swipe gesture implementation
- Filter tabs (All, Favorites, Scheduled)
- Virtualization for performance
- Accessibility and testing strategy
- Migration from traditional Kanban columns

**10. UX Best Practices & Engagement Spec** (`specs/ux-best-practices-and-engagement-spec.md`) **NEW**
- 15,000+ lines of comprehensive UX research and engagement strategy
- Habit-forming UX patterns (Hooked Model, Fogg Behavior Model)
- Analysis of leading apps (ChatGPT, Duolingo, GitHub Mobile, Notion, Linear)
- Ethical engagement charter (no dark patterns, productivity-first)
- Assistant autonomy surfaces (proactive suggestions, smart drafts, scheduled windows)
- Notification strategy (rich actions, RemoteInput, bundling, rate limits)
- Resume & re-engagement flows (open-to-context, widgets, shortcuts, quick settings tile)
- Quick capture surfaces (share sheet, voice-to-task, camera-to-task)
- Personalization & smart drafts (learning preferences, context-aware suggestions)
- Onboarding & first-time experience (60-second flow, progressive onboarding)
- Micro-interactions & delight (haptics, animations, celebrations)
- Measurement & instrumentation (engagement metrics, funnels, A/B testing)
- Gap analysis against existing 7 specs with priority mapping
- Updated implementation roadmap with engagement enhancements

**Engagement Enhancements Summary** (`specs/ENGAGEMENT-ENHANCEMENTS-SUMMARY.md`) **NEW**
- Comprehensive summary of UX research findings
- Gap analysis table showing coverage vs new features
- Updated phase plan with engagement additions
- New success criteria (DAU, retention, TTFV, notification CTR)
- Feature flags for gradual rollout
- Risks & mitigations for engagement features

### Research Documents (in `.genie/wishes/mobile-native-app/research/`)

**1. Frontend Inventory** (`research/forge-frontend-complete-inventory.md`)
- 2,587 lines mapping every Forge feature
- 164 TSX components cataloged
- Data flow diagrams
- Current mobile pain points

**2. AI Mobile Apps Analysis** (`research/ai-mobile-apps-ux-analysis.md`)
- 985 lines analyzing 10 universal UX patterns
- Best practices from ChatGPT, Claude, Perplexity, Gemini, Poe
- Gesture systems compared
- Mobile-specific optimizations

**3. Mobile Architecture** (`research/forge-mobile-architecture.md`)
- 985 lines of architecture documentation
- Complete view mapping (desktop → mobile)
- Navigation architecture
- Screen flow diagrams
- Offline strategy
- Performance architecture

**Total Planning Documentation:** 32,000+ lines across 14 comprehensive documents (10 specs + 4 research/summary docs)

### Key Insights

**From AI Apps:**
- ✅ Bottom nav is universal (ChatGPT, Claude, all apps)
- ✅ Chat-first interface dominates
- ✅ Bottom sheets > modals (one-handed)
- ✅ Swipe gestures expected everywhere
- ✅ Dark mode is default

**Performance Targets:**
- Bundle Size: <500KB gzipped
- First Paint: <1.5s (3G network)
- Frame Rate: 60fps
- Lighthouse: >90 mobile score

---

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Mobile-first component library + navigation

- [ ] Setup Capacitor (Android)
- [ ] Configure mobile breakpoints
- [ ] Create bottom navigation component
- [ ] Create bottom sheet component
- [ ] Setup gesture library (`use-gesture`)
- [ ] Mobile theme (spacing, typography, colors)
- [ ] Safe area handling (notch/Dynamic Island)

**Deliverables:**
- Mobile shell with bottom nav working
- Bottom sheet system functional
- Gesture library integrated

---

### Phase 2: Core Views (Weeks 3-5)
**Goal:** Kanban, Chat, Diffs, Preview mobile views

**Week 3: Kanban Mobile (Session List View)**
- [ ] Vertical session list view (ChatGPT/Manus-style)
- [ ] Task session card component with status icons
- [ ] Status icon animations (spinning gear for running tasks)
- [ ] Progress indicators (e.g., "9/12" steps)
- [ ] Filter tabs (All, Favorites, Scheduled)
- [ ] Swipe gestures (delete, archive)
- [ ] FAB for new task
- [ ] Pull to refresh

**Week 4: Chat Mobile**
- [ ] Full-screen conversation layout
- [ ] Mobile input bar (auto-expand)
- [ ] Collapsed message types
- [ ] Attachment picker (bottom sheet)
- [ ] Voice input integration

**Week 5: Diffs & Preview Mobile**
- [ ] File carousel navigation
- [ ] Horizontal scroll code blocks
- [ ] Pinch to zoom
- [ ] Inline comment UI
- [ ] Responsive preview selector

**Deliverables:**
- All core views functional on mobile
- Gestures working throughout
- Performance targets met

---

### Phase 3: Advanced Features (Weeks 6-8)
**Goal:** Native integrations + offline + performance

**Week 6: Native Features**
- [ ] Camera integration (Capacitor)
- [ ] Gallery picker
- [ ] Push notifications setup
- [ ] Share target registration
- [ ] Haptic feedback throughout

**Week 7: Offline Support**
- [ ] IndexedDB caching strategy
- [ ] Offline queue for actions
- [ ] Sync on reconnection
- [ ] Offline indicator UI
- [ ] Service worker (PWA)

**Week 8: Performance**
- [ ] Code splitting optimization
- [ ] Virtual scrolling everywhere
- [ ] Image optimization (WebP)
- [ ] Bundle size <500KB
- [ ] Lighthouse score >90

**Deliverables:**
- Native app experience
- Works offline
- Fast & smooth (60fps)

---

### Phase 4: Polish & Testing (Weeks 9-10)
**Goal:** Bug fixes, animations, accessibility, launch

**Week 9: Polish**
- [ ] All transitions smooth
- [ ] Haptics refined
- [ ] Dark mode optimized (OLED)
- [ ] Landscape orientation
- [ ] Tablet layout (bonus)

**Week 10: Testing & Launch**
- [ ] User testing (5-10 users)
- [ ] Bug fixes from feedback
- [ ] Performance profiling
- [ ] Accessibility audit (TalkBack)
- [ ] Build APK
- [ ] App Store listing
- [ ] Launch! 🚀

**Deliverables:**
- Production-ready Android APK
- User-tested and validated
- Documented

---

## Success Criteria

### Functional Requirements
- ✅ 100% feature parity with desktop
- ✅ Native feel (like ChatGPT mobile)
- ✅ Offline support for core features
- ✅ Touch optimized (all 44x44px minimum)

### Performance Targets
- **Bundle**: <500KB gzipped
- **Load**: <1.5s first paint (3G)
- **FPS**: 60fps (gestures/animations)
- **Lighthouse**: >90 mobile score

### User Experience
- **One-Handed**: 80% tasks with thumb
- **Learning**: <5 min to master nav
- **Efficiency**: 50% faster than desktop (quick actions)
- **Satisfaction**: >4.5/5 rating

---

## Evaluation Matrix

### 100-Point Wish Completion Audit

This wish follows the standard 3-phase evaluation framework with specific checkpoints for mobile native app development.

#### Discovery Phase (30 points)

**Problem Definition (10 points)**
- [x] Clear problem statement with current UX rating (2/10) and user feedback (5 pts)
- [x] Measurable success criteria and target UX rating (9/10) (5 pts)

**Research & Analysis (10 points)**
- [x] Comprehensive frontend inventory (164 components, 2,587 lines) (3 pts)
- [x] AI mobile apps UX analysis (5 leading apps, 10 universal patterns) (4 pts)
- [x] Mobile architecture documentation (985 lines) (3 pts)

**Solution Design (10 points)**
- [x] Architecture overview with navigation design (5 pts)
- [x] Core views redesign (Kanban → Task List, Chat, Diffs, Preview) (5 pts)

#### Implementation Phase (40 points)

**Phase 1: Foundation (10 points)**
- [ ] Capacitor setup (Android) with working build (3 pts)
- [ ] Bottom navigation component functional (2 pts)
- [ ] Bottom sheet system with gesture support (3 pts)
- [ ] Mobile theme with safe area handling (2 pts)

**Phase 2: Core Views (15 points)**
- [ ] Task List View with Forge workflow (WISH→FORGE→REVIEW→DONE) (5 pts)
- [ ] Full-screen chat view with mobile input bar (4 pts)
- [ ] File carousel for diffs with swipe navigation (3 pts)
- [ ] Responsive preview with viewport picker (3 pts)

**Phase 3: Advanced Features (10 points)**
- [ ] Native camera integration (2 pts)
- [ ] Push notifications setup (2 pts)
- [ ] Offline support (IndexedDB + sync) (4 pts)
- [ ] Haptic feedback throughout (2 pts)

**Phase 4: Polish & Performance (5 points)**
- [ ] Performance targets met (<500KB bundle, <1.5s load, 60fps, >90 Lighthouse) (3 pts)
- [ ] Accessibility audit (TalkBack) (1 pt)
- [ ] Production APK build (1 pt)

#### Verification Phase (30 points)

**Documentation (10 points)**
- [x] Technical specifications (10 specs, 18,000+ lines) (5 pts)
- [x] Implementation plan with 4 phases (5 pts)

**Testing & Validation (10 points)**
- [ ] User testing on real devices (3 device sizes) (3 pts)
- [ ] Performance profiling and optimization (3 pts)
- [ ] Feature parity validation (100% desktop features) (4 pts)

**Success Metrics (10 points)**
- [ ] KPIs measured (DAU, session duration, feature adoption, retention) (5 pts)
- [ ] User satisfaction >4.5/5 rating (3 pts)
- [ ] Lighthouse mobile score >90 (2 pts)

### Approval Gates

**WISH → FORGE Approval**
- Criteria: Design mockups approved, technical specs validated, resource allocation confirmed
- Approvers: Product Lead, Design Lead, Engineering Lead
- Artifacts: Figma mockups, interactive prototype, technical architecture review

**FORGE → REVIEW Approval**
- Criteria: All 4 phases complete, performance targets met, feature parity validated
- Approvers: Engineering Lead, QA Lead, Product Lead
- Artifacts: APK build, test results, performance metrics, feature checklist

**REVIEW → DONE Approval**
- Criteria: User testing complete, bugs fixed, documentation updated, launch ready
- Approvers: Product Lead, Engineering Lead, User Testing Lead
- Artifacts: User testing report, bug fix log, updated documentation, App Store listing

---

## Technology Stack

### Core (Existing)
- React 18
- React Router
- React Query
- Tailwind CSS

### Mobile-Specific (New)
- **Capacitor**: Native features
- **use-gesture**: Touch gestures
- **react-spring**: Animations
- **Virtuoso**: Virtual scrolling (already have)

### Native Integrations
- `@capacitor/camera` - Camera & gallery
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/share` - Share target
- `@capacitor/haptics` - Haptic feedback

---

## Testing Strategy

### Devices
- **Small**: iPhone SE (375px)
- **Standard**: iPhone 14 Pro (393px), Pixel 7 (412px)
- **Tablet**: iPad Mini (768px)

### Testing Rounds
- **Round 1** (Week 3): Kanban & Chat
- **Round 2** (Week 6): All views + gestures
- **Round 3** (Week 9): Final polish

### Metrics
- Task completion time
- Error rate
- SUS score (satisfaction)
- Feature discoverability

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Performance** (bundle size) | High | Code splitting, lazy loading |
| **Gestures conflict** | Medium | Careful event handling, testing |
| **Offline complexity** | High | Start simple, iterate |
| **Browser quirks** | Medium | Test on real devices early |
| **Scope creep** | High | Stick to 10-week plan, no extras |

---

## Success Metrics

### KPIs (Post-Launch)
- **DAU**: 2x increase (mobile vs desktop only)
- **Session Duration**: 3x increase
- **Feature Adoption**: >80% try all 4 tabs
- **Retention**: >60% return after 7 days

---

## Related Issues

- **Primary Tracking Issue:** [#113 - Mobile Native App](https://github.com/namastexlabs/automagik-forge/issues/113)
- All planning documentation linked in issue description

---

## Next Steps

1. **✅ Discovery Complete** (This document + supporting docs)
2. **⏭️ Design Phase** (2 weeks)
   - Create Figma mockups
   - Interactive prototype
   - User testing round 1
3. **⏭️ Development** (10 weeks)
   - Follow phase-by-phase plan
   - Sprint-based development
4. **⏭️ Launch** (1 week)
   - Beta testing
   - App Store submission
   - Public launch 🚀

---

## Notes

**Why This Matters:**
- Mobile is the future of work
- AI apps are mobile-first (ChatGPT, Claude)
- Forge should be accessible anywhere
- Current mobile UX is blocking adoption

**What Makes This Different:**
- Not a responsive tweak - complete redesign
- Research-backed (analyzed 5 leading AI apps)
- Native feel (Capacitor for camera, notifications)
- Offline-first (queue actions, sync later)
- Gesture-rich (swipe, long-press everywhere)

**Expected Impact:**
- 10x better mobile UX
- 2-3x user engagement
- New user segment (mobile-only users)
- Competitive advantage (best mobile UX in agentic tools)

---

**Total Planning Effort:** 32,000+ lines of documentation
**Planning Docs:** 10 technical specifications + 4 research/summary documents
**GitHub Issue:** [#113](https://github.com/namastexlabs/automagik-forge/issues/113)
**Status:** ✅ Planning Complete (with Engagement Enhancements)
**Ready For:** Design → Development → Launch

🚀 Let's build the best mobile experience for agentic task management!
