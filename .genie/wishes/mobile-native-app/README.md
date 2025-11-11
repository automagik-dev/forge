# 📱 Mobile Native App - Wish Documentation

## Overview

Complete discovery and specification for transforming Forge into a world-class native mobile application (Android APK).

**Location:** `.genie/wishes/mobile-native-app/`
**Status:** ✅ Discovery Complete, Ready for Development
**Timeline:** 10 weeks implementation

---

## 📚 Documentation Structure

### **Main Wish Document**
**File:** `../mobile-native-app.md` (parent directory)

Start here! The master specification with:
- Problem statement
- Solution design
- 10-week implementation plan
- Success criteria
- Testing strategy

---

### **Research Documents** (`research/`)

#### 1. `forge-frontend-complete-inventory.md` (71KB, 1,500+ lines)
**Purpose:** Complete mapping of existing Forge frontend

**Contents:**
- 164 TSX components cataloged
- 12 routes mapped
- 4 view modes analyzed (Kanban, Chat, Diffs, Preview)
- Data flow architecture
- Current mobile pain points (10 critical issues)
- Component inventory by category

**Key Finding:** Every feature must work on mobile (100% parity)

---

#### 2. `ai-mobile-apps-ux-analysis.md` (22KB)
**Purpose:** Best practices from leading AI mobile apps

**Apps Analyzed:**
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Perplexity
- Gemini (Google)
- Poe (Quora)

**10 Universal Patterns:**
1. Bottom-First Navigation
2. Chat-First Interface
3. Contextual Sheets & Overlays
4. Swipe Gestures
5. Progressive Disclosure
6. Floating Action Button
7. Search-First
8. Rich Message Types
9. Persistent Input Bar
10. Dark Mode First

**Why This Matters:** We're adopting proven patterns from apps with 100M+ downloads

---

### **Architecture Documents** (`architecture/`)

#### `forge-mobile-architecture.md` (40KB)
**Purpose:** Technical blueprint for mobile redesign

**Contents:**
- Navigation architecture (bottom nav + hamburger)
- Complete view mapping (desktop → mobile)
- Screen flow diagrams
- Gesture system specifications
- Offline strategy (IndexedDB + queue)
- Performance architecture (<500KB bundle)
- Native features (Capacitor plugins)

**Key Decisions:**
- Bottom nav (4 tabs): Tasks | Chat | New | Me
- Bottom sheets (not modals)
- Gesture-rich (swipe, long-press, pinch)
- Offline-first (cache + sync)

---

## 🎯 Quick Reference

### Navigation Structure
```
Bottom Navigation:
┌──┬──┬──┬──┐
│📋│💬│➕│👤│
└──┴──┴──┴──┘
Tasks Chat New Me
```

### Core Views Redesigned

**1. Kanban → Tabbed Columns**
- One column visible (swipe to switch)
- Swipe gestures on cards
- FAB for new task

**2. Chat → Full-Screen**
- Fixed bottom input
- Voice, camera, attachments
- Collapsed message types

**3. Diffs → File Carousel**
- Swipe to navigate files
- Pinch to zoom code
- Inline comments

**4. Preview → Responsive**
- Viewport selector
- Click tracking
- Landscape support

**5. Task Creation → Bottom Sheet**
- Native camera
- Executor picker
- Full keyboard

---

## 📊 Success Metrics

### Performance
- **Bundle**: <500KB gzipped
- **Load**: <1.5s (3G)
- **FPS**: 60fps
- **Lighthouse**: >90

### UX
- **One-Handed**: 80% tasks
- **Learning**: <5 min
- **Efficiency**: 50% faster
- **Satisfaction**: >4.5/5

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
- Capacitor setup
- Bottom nav + sheets
- Gesture library
- Mobile theme

### Phase 2: Core Views (Weeks 3-5)
- Kanban mobile
- Chat mobile
- Diffs mobile
- Preview mobile

### Phase 3: Advanced (Weeks 6-8)
- Native features (camera, notifications)
- Offline support
- Performance optimization

### Phase 4: Polish (Weeks 9-10)
- Animations & haptics
- User testing
- Bug fixes
- Launch! 🚀

---

## 🛠️ Technology Stack

### Existing (Keep)
- React 18
- React Router
- React Query
- Tailwind CSS
- Virtuoso (virtual scrolling)

### New (Add)
- **Capacitor** - Native features
- **use-gesture** - Touch gestures
- **react-spring** - Animations

### Native Plugins
- `@capacitor/camera`
- `@capacitor/push-notifications`
- `@capacitor/share`
- `@capacitor/haptics`

---

## 📖 How to Use This Documentation

### For Product Managers
1. Read: `../mobile-native-app.md`
2. Review: Success criteria & timeline
3. Approve: Sign-off for development

### For Designers
1. Study: `research/ai-mobile-apps-ux-analysis.md`
2. Reference: `architecture/forge-mobile-architecture.md`
3. Create: Figma mockups (all views)

### For Developers
1. Understand: `research/forge-frontend-complete-inventory.md`
2. Plan: `architecture/forge-mobile-architecture.md`
3. Implement: Follow 10-week phases

### For QA
1. Devices: iPhone SE, Pixel 7, iPad Mini
2. Test: Gestures, offline, performance
3. Validate: Success criteria met

---

## 📏 Scope

### In Scope ✅
- 100% feature parity with desktop
- Native Android app (APK)
- Touch-optimized UI
- Gesture navigation
- Offline support
- Native features (camera, notifications)
- Performance optimization
- Accessibility (TalkBack)

### Out of Scope (Future) 🔜
- iOS app (Phase 2)
- Tablet-specific layout
- Widgets
- Wear OS
- Voice conversation mode
- Multi-model comparison

---

## 🎨 Design Principles

1. **Mobile-First** - Design for small screens first
2. **Chat-First** - Conversation is primary interaction
3. **Bottom-Up** - Navigation at bottom (thumb reach)
4. **Gesture-Rich** - Swipe everywhere
5. **Progressive** - Show basics, expand on-demand
6. **Offline-Capable** - Core features always work
7. **Native-Feeling** - Like ChatGPT mobile
8. **Performance-Obsessed** - 60fps, fast load

---

## 📦 Deliverables

### Discovery Phase ✅
- [x] Frontend inventory (1,500+ lines)
- [x] UX analysis (10 patterns)
- [x] Architecture spec (40KB)
- [x] Wish document
- [x] Implementation plan

### Design Phase ⏭️
- [ ] Figma mockups (all views)
- [ ] Interactive prototype
- [ ] Component library design
- [ ] Animation specs
- [ ] User testing round 1

### Development Phase ⏭️
- [ ] Mobile shell (bottom nav)
- [ ] Core views (Kanban, Chat, Diffs, Preview)
- [ ] Native integrations
- [ ] Offline support
- [ ] Performance optimization

### Launch Phase ⏭️
- [ ] User testing (rounds 2-3)
- [ ] Bug fixes
- [ ] APK build
- [ ] App Store listing
- [ ] Public launch

---

## 🎁 Expected Impact

### User Experience
- **10x better** mobile UX
- **2-3x** user engagement
- **New segment** (mobile-only users)

### Business
- **Competitive advantage** (best mobile UX)
- **Higher retention** (accessible anywhere)
- **Market expansion** (mobile users)

### Technical
- **Modern stack** (Capacitor, gestures)
- **Performance** (60fps, fast)
- **Maintainable** (mobile-first components)

---

## 📞 Next Steps

1. **Create GitHub Issue** for tracking
2. **Kickoff Meeting** with design/dev team
3. **Start Design Phase** (Figma mockups)
4. **Sprint Planning** (10-week timeline)

---

**Total Discovery Effort:** 8,000+ lines of documentation
**Research Quality:** Analyzed 5 leading AI apps
**Readiness:** 100% ready for design → development → launch

🚀 **Let's build the best mobile experience for agentic task management!**
