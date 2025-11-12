# Mobile Native App: Engagement Enhancements Summary

**Date:** 2025-11-11  
**Purpose:** Summary of UX research and engagement enhancements for mobile native app  
**Related Issue:** [#113](https://github.com/namastexlabs/automagik-forge/issues/113)

---

## Overview

This document summarizes the comprehensive UX research and engagement enhancements added to the mobile native app planning. The goal is to transform Forge into a highly engaging mobile experience that empowers Devin to run autonomously on every mobile phone, helping users ship code faster.

**Research Scope:** Analyzed habit-forming patterns from leading apps (ChatGPT, Duolingo, GitHub Mobile, Notion, Linear) and applied ethical engagement principles to create a productivity-first mobile experience.

**New Specification:** [UX Best Practices & Engagement Spec](./ux-best-practices-and-engagement-spec.md) (15,000+ lines)

---

## Key Research Findings

### 1. Habit-Forming UX Patterns

**The Hooked Model (Nir Eyal):**
- **Trigger:** External (notifications, widgets) + Internal (user thinks "is my task done?")
- **Action:** One-tap resume, swipe to approve, voice-to-task
- **Variable Reward:** Discover what Devin built, progress toward shipping
- **Investment:** Configure agents, save templates, review code (teaches Devin)

**Fogg Behavior Model:**
- Behavior = Motivation × Ability × Prompt
- Make high-value behaviors (resume, approve, create) extremely easy (1-2 taps, <3 seconds)

### 2. Leading App Analysis

**ChatGPT Mobile:**
- ✅ Instant resume (opens to last conversation)
- ✅ Voice-first (one tap microphone)
- ✅ Share everywhere (share sheet integration)
- ✅ Minimal chrome (full-screen chat)

**Duolingo:**
- ✅ Tiny steps (5-minute lessons)
- ✅ Gentle streaks (not punishing)
- ✅ Progress visible (XP, levels, bars)
- ✅ Celebration moments (confetti, haptics)

**GitHub Mobile:**
- ✅ Rich notifications (inline actions: Approve, Comment, Merge)
- ✅ Quick actions (dynamic shortcuts)
- ✅ Widgets (recent activity, assigned PRs)
- ✅ Smart bundling (groups related notifications)

**Notion Mobile:**
- ✅ Quick capture (widget + share sheet)
- ✅ Voice to text (transcription)
- ✅ Templates (one-tap creation)
- ✅ Offline first (everything works offline)

**Linear:**
- ✅ Keyboard shortcuts (mobile)
- ✅ Instant create (one tap → form)
- ✅ Swipe to change status
- ✅ Contextual notifications

### 3. Universal Patterns Identified

1. **Open-to-Context** - Resume where user left off, not home screen
2. **One-Tap Actions** - Critical actions accessible in 1-2 taps
3. **Rich Notifications** - Inline actions, RemoteInput, bundling
4. **Quick Capture** - Voice, share sheet, widgets for instant task creation
5. **Progress Visible** - Clear indicators of completion, next steps
6. **Smart Defaults** - Learn preferences, reduce decisions
7. **Offline Grace** - Everything works offline, syncs transparently
8. **Micro-celebrations** - Haptics, animations on success
9. **Personalized Timing** - Learn active hours, send digest then
10. **Minimal Friction** - Remove every unnecessary tap, screen, decision

---

## Ethical Engagement Charter

### Core Commitments

**We Will:**
- ✅ Help users ship code faster and be more productive
- ✅ Respect user attention with smart notification controls
- ✅ Provide explicit controls for all autonomous features
- ✅ Default to "draft-only" autonomy (user approves before execution)
- ✅ Make privacy and data controls transparent and accessible
- ✅ Measure engagement to improve productivity, not maximize time-on-app

**We Won't:**
- ❌ Use manipulative scarcity or FOMO tactics
- ❌ Spam notifications or ignore user preferences
- ❌ Gamify in ways that distract from shipping
- ❌ Auto-merge code without explicit approval
- ❌ Make it hard to disable autonomous features

### Autonomy Guardrails

**Three Levels:**
1. **Level 0: Manual (Default)** - User initiates all actions
2. **Level 1: Draft-Only Autonomy (Recommended)** - Devin prepares drafts, user taps to execute
3. **Level 2: Scheduled Autonomy (Opt-In)** - User sets time windows, Devin can execute within constraints

**Critical Rule:** No code merges without explicit user approval, regardless of autonomy level.

---

## New Features & Enhancements

### 1. Assistant Autonomy Surfaces

**Proactive Suggestions:**
- Attempt idle >30 min → Suggest follow-up
- Attempt blocked → Suggest resolution
- Attempt completed → Suggest next steps
- CI failed → Suggest auto-fix

**Smart Follow-up Drafts:**
- Context-aware suggestions based on attempt state
- "Run tests", "Add error handling", "Create PR draft"
- One-tap send or edit
- Confidence scoring (show if >0.7)

**Scheduled Autonomy Windows:**
- User sets time windows (e.g., 9-11am daily)
- Allowed actions: start attempt, send follow-up, stop attempt
- Never merges without approval
- Full audit trail

### 2. Notification Strategy

**Channels (Android):**
1. **Attempts** (High Priority) - Started, completed, failed, blocked
2. **Diffs & Review** (Medium) - Ready for review, comments added
3. **Build & CI** (Medium) - Passed, failed, warnings
4. **Suggestions** (Low) - Smart drafts, idle reminders, digest
5. **System** (Low) - Sync completed, offline mode, updates

**Rich Actions:**
- **Attempt Completed:** [Review Diffs] [Approve] [Follow-up]
- **Attempt Blocked:** [Add Key] [View Logs] [Send Guidance]
- **CI Failed:** [View Errors] [Auto-fix] [Follow-up]
- **Daily Digest:** [Review All] [Open Forge]

**Inline Actions with RemoteInput:**
- Tap "Follow-up" on notification
- Inline text input appears
- Type message → Send
- Notification updates: "Follow-up sent ✅"

**Smart Bundling:**
- Group by: Project, Task, Attempt
- Bundle after: 3 related notifications
- Max bundle size: 5 notifications

**Rate Limits:**
- Max 5 notifications per hour
- Max 20 notifications per day
- Automatic bundling after 3 related
- Quiet hours: 10pm-8am (configurable)
- Digest mode: Single daily summary

### 3. Resume & Re-engagement Flows

**Open-to-Context:**
- First launch → Onboarding
- Returning user (no active work) → Tasks view
- Returning user (active attempt) → Last attempt conversation
- One tap to resume

**Android Widgets:**
1. **Resume Last Attempt** - Shows last attempt, [Resume] [View Diffs]
2. **Quick Capture** - [🎤 Voice] [📷 Camera] [✏️ Text] [📋 Paste]
3. **My Tasks** - Shows task counts, recent tasks, [View All]

**Dynamic App Shortcuts (Long-press icon):**
1. Resume "Fix login bug"
2. Automagik Forge (top project)
3. New Task
4. Review Diffs

**Quick Settings Tile:**
- Idle: Tap → Start last task
- Active: Tap → Stop attempt
- Shows current status

### 4. Quick Capture Surfaces

**Share Sheet Integration:**
- Text selection → Share → Forge → Create task
- Screenshot → Share → Forge → Create task (with OCR)
- URL → Share → Forge → Create task (with page title)

**Voice-to-Task:**
- One-tap voice capture from widget/FAB
- Speak task description
- Transcription appears
- [Create Task] [Edit] [Cancel]

**Camera-to-Task:**
- Tap 📷 on widget/FAB
- Take photo (bug screenshot, whiteboard, mockup)
- Optional OCR text extraction
- Photo attached to task

### 5. Personalization & Smart Drafts

**Learning User Preferences:**
- Per-project defaults (executor, variant, templates)
- Active hours (when user works)
- Notification preferences (frequency, channels)
- Review style (thorough vs quick)
- Common follow-up patterns

**Smart Follow-up Suggestions:**
- After completion: Check if tests exist, docs updated, TODOs addressed
- After CI fail: Suggest fixes based on error type
- User's common follow-ups: Surface frequently used prompts
- Confidence scoring: Only show if >0.7

**Prompt Templates:**
- User-defined templates (Add Tests, Refactor, Add Docs, Fix Lint)
- Quick access from follow-up UI
- One-tap send with template

**Smart Defaults:**
- Task creation: Pre-fill executor, labels, assignee based on history
- Attempt creation: Use last executor, variant, target branch

### 6. Onboarding & First-Time Experience

**60-Second Onboarding:**
1. Welcome (5s)
2. GitHub Auth (15s) - Device code flow
3. Pick Default Agent (10s) - Claude, Codex, Gemini, Cursor
4. Import Projects (15s) - Select from GitHub repos
5. Enable Notifications (10s) - Choose channels
6. Done! (5s) - [Create Task] [Explore]

**Progressive Onboarding:**
- First task creation → Tip: Voice capture
- First attempt completion → Tip: Swipe notifications
- After 3 tasks → Tip: Add widget
- After 1 week → Tip: Enable autonomy

**Empty States:**
- No projects → [Import from GitHub] [Create Project]
- No tasks → [Create Task] [Import from Issues]
- No attempts → [Start Attempt]
- No diffs → "Diffs will appear once agent makes changes"

### 7. Micro-interactions & Delight

**Haptic Feedback:**
- Success: PR merged → Heavy impact + success notification
- Error: CI failed → Error notification (3 light taps)
- Gesture: Swipe threshold → Light impact

**Animations:**
- Task card swipe → Background color transition
- Bottom sheet slide → Smooth spring animation
- Success confetti → On PR merge
- Loading skeletons → While fetching data

**Visual Feedback:**
- Optimistic UI → Immediately show changes, rollback on error
- Progress indicators → Show attempt completion percentage
- State transitions → Smooth color changes for status badges

**Celebration Moments:**
- First task completed → 🎉 Congratulations!
- 10 tasks completed → 🚀 Milestone Unlocked!
- First PR merged → ✅ First PR Merged!
- 7-day streak → 🔥 7-Day Streak!

### 8. Measurement & Instrumentation

**Engagement Metrics:**
- DAU (Daily Active Users) - Target: 2x increase vs desktop
- WAU (Weekly Active Users) - Target: DAU/WAU ratio > 0.4
- Session Duration - Target: 3x increase (quick actions)
- Sessions Per Day - Target: 3-5 (check-in behavior)
- Retention: D1 >60%, D7 >40%, D30 >20%

**Productivity Metrics:**
- Time to First Value (TTFV) - Target: <10 seconds
- Task Completion Rate - Target: >70%
- Resume Rate - Target: >50% (from notifications/widgets)
- Notification CTR - Target: >30%
- Actions Per Session - Target: 2-3

**Autonomy Metrics:**
- Smart Draft Acceptance Rate - Target: >40%
- Autonomous Action Success Rate - Target: >90%
- Approval Time - Target: <5 minutes

**Event Tracking:**
- app_opened, task_created, attempt_started, attempt_resumed
- pr_approved, follow_up_sent, notification_clicked
- widget_interacted, shortcut_used, voice_capture_used
- smart_draft_shown, smart_draft_accepted, autonomous_action_executed

**Funnels:**
- Onboarding: Install → Complete (target: 70%)
- Task Creation: Open → Create (target: 80%)
- Task Completion: Start → Merge (target: 60%)
- Notification Engagement: Sent → Action Taken (target: 40%)

**A/B Testing:**
- Notification wording variations
- Smart draft presentation (top 3 vs top 1)
- Onboarding flow (6-step vs 3-step)
- Widget design (resume vs quick capture prominent)

---

## Gap Analysis

### Current Plan Coverage vs New Enhancements

| Feature | Current Coverage | Gap | Priority | Phase |
|---------|------------------|-----|----------|-------|
| **Notifications** | ✅ Push setup | ❌ Rich actions, RemoteInput, bundling | 🔴 High | Phase 3 |
| **Widgets** | ❌ Not covered | ❌ Resume, Quick Capture, My Tasks | 🔴 High | Phase 3 |
| **Dynamic Shortcuts** | ❌ Not covered | ❌ Long-press shortcuts | 🟡 Medium | Phase 3 |
| **Quick Settings Tile** | ❌ Not covered | ❌ Start/stop from quick settings | 🟢 Low | Phase 4 |
| **Share Sheet** | ❌ Not covered | ❌ Create task from share | 🔴 High | Phase 2 |
| **Voice Capture** | ❌ Not covered | ❌ Voice-to-task | 🟡 Medium | Phase 3 |
| **Camera Capture** | ✅ Camera integration | ⚠️ Partial: Missing task flow | 🟡 Medium | Phase 3 |
| **Smart Drafts** | ❌ Not covered | ❌ Context-aware suggestions | 🔴 High | Phase 3 |
| **Personalization** | ❌ Not covered | ❌ Learn preferences, defaults | 🟡 Medium | Phase 3 |
| **Onboarding** | ❌ Not covered | ❌ 60-second flow | 🔴 High | Phase 1 |
| **Open-to-Context** | ❌ Not covered | ❌ Resume last attempt | 🔴 High | Phase 2 |
| **Autonomy** | ❌ Not covered | ❌ Draft-only, scheduled | 🟡 Medium | Phase 4 |
| **Haptic Patterns** | ✅ Basic haptics | ⚠️ Partial: Missing semantic | 🟢 Low | Phase 2 |
| **Animations** | ❌ Not covered | ❌ Micro-animations, confetti | 🟢 Low | Phase 4 |
| **Measurement** | ⚠️ Performance only | ❌ Engagement metrics, funnels | 🟡 Medium | Phase 3 |
| **Empty States** | ❌ Not covered | ❌ Helpful CTAs | 🟢 Low | Phase 2 |
| **Progressive Onboarding** | ❌ Not covered | ❌ Feature tips over time | 🟢 Low | Phase 4 |
| **Celebration Moments** | ❌ Not covered | ❌ Milestone celebrations | 🟢 Low | Phase 4 |

**Legend:**
- ✅ Fully covered
- ⚠️ Partially covered
- ❌ Not covered
- 🔴 High priority (must-have)
- 🟡 Medium priority (should-have)
- 🟢 Low priority (nice-to-have)

---

## Updated Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Original:**
- ✅ Capacitor setup, mobile breakpoints, bottom nav, bottom sheets, gestures, theme, safe areas

**NEW Additions:**
- **➕ 60-second onboarding flow** (🔴 High)
- **➕ Empty states with CTAs** (🟢 Low)

### Phase 2: Core Views (Weeks 3-5)
**Original:**
- ✅ Kanban, Chat, Diffs, Preview mobile views

**NEW Additions:**
- **➕ Open-to-context routing** (🔴 High)
- **➕ Share sheet integration** (🔴 High)
- **➕ Semantic haptic patterns** (🟢 Low)

### Phase 3: Advanced Features (Weeks 6-8)
**Original:**
- ✅ Camera, push notifications, haptics, share target, offline, performance

**NEW Additions:**
- **➕ Rich notification actions** (RemoteInput, bundling) (🔴 High)
- **➕ Android widgets** (Resume, Quick Capture, My Tasks) (🔴 High)
- **➕ Smart follow-up drafts** (🔴 High)
- **➕ Voice-to-task capture** (🟡 Medium)
- **➕ Personalization engine** (🟡 Medium)
- **➕ Engagement metrics & funnels** (🟡 Medium)
- **➕ Dynamic app shortcuts** (🟡 Medium)

### Phase 4: Polish & Testing (Weeks 9-10)
**Original:**
- ✅ Smooth transitions, refined haptics, dark mode, landscape, testing, bugs, performance, accessibility

**NEW Additions:**
- **➕ Quick settings tile** (🟢 Low)
- **➕ Draft-only autonomy** (🟡 Medium)
- **➕ Micro-animations & confetti** (🟢 Low)
- **➕ Progressive onboarding tips** (🟢 Low)
- **➕ Celebration moments** (🟢 Low)

---

## Updated Success Criteria

### Original Success Criteria
- ✅ 100% feature parity with desktop
- ✅ Native feel (like ChatGPT mobile)
- ✅ Offline support for core features
- ✅ Touch optimized (all 44x44px minimum)
- ✅ Bundle: <500KB gzipped
- ✅ Load: <1.5s first paint (3G)
- ✅ FPS: 60fps (gestures/animations)
- ✅ Lighthouse: >90 mobile score

### NEW Success Criteria (Engagement)
- ✅ **DAU**: 2x increase vs desktop-only
- ✅ **Session Duration**: 3x increase (quick actions)
- ✅ **Sessions Per Day**: 3-5 (check-in behavior)
- ✅ **D1 Retention**: >60%
- ✅ **D7 Retention**: >40%
- ✅ **Time to First Value**: <10 seconds
- ✅ **Task Completion Rate**: >70%
- ✅ **Resume Rate**: >50% (from notifications/widgets)
- ✅ **Notification CTR**: >30%
- ✅ **Smart Draft Acceptance**: >40%
- ✅ **Onboarding Completion**: >70%

---

## Feature Flags

**New Feature Flags for Gradual Rollout:**

```typescript
export const ENGAGEMENT_FEATURES = {
  // Phase 1-2
  ONBOARDING_FLOW: process.env.VITE_ONBOARDING_FLOW === 'true',
  OPEN_TO_CONTEXT: process.env.VITE_OPEN_TO_CONTEXT === 'true',
  SHARE_SHEET: process.env.VITE_SHARE_SHEET === 'true',
  EMPTY_STATES: process.env.VITE_EMPTY_STATES === 'true',
  
  // Phase 3
  RICH_NOTIFICATIONS: process.env.VITE_RICH_NOTIFICATIONS === 'true',
  WIDGETS: process.env.VITE_WIDGETS === 'true',
  SMART_DRAFTS: process.env.VITE_SMART_DRAFTS === 'true',
  VOICE_CAPTURE: process.env.VITE_VOICE_CAPTURE === 'true',
  PERSONALIZATION: process.env.VITE_PERSONALIZATION === 'true',
  ENGAGEMENT_METRICS: process.env.VITE_ENGAGEMENT_METRICS === 'true',
  
  // Phase 4
  DYNAMIC_SHORTCUTS: process.env.VITE_DYNAMIC_SHORTCUTS === 'true',
  QUICK_SETTINGS_TILE: process.env.VITE_QUICK_SETTINGS_TILE === 'true',
  AUTONOMY: process.env.VITE_AUTONOMY === 'true',
  ANIMATIONS: process.env.VITE_ANIMATIONS === 'true',
  PROGRESSIVE_ONBOARDING: process.env.VITE_PROGRESSIVE_ONBOARDING === 'true',
  CELEBRATIONS: process.env.VITE_CELEBRATIONS === 'true',
};
```

---

## Risks & Mitigations

### Technical Risks

**Battery Drain:**
- Risk: Background sync, notifications, widgets drain battery
- Mitigation: WorkManager with constraints, batch sync, respect battery saver
- Monitoring: Track battery usage in analytics

**Notification Fatigue:**
- Risk: Too many notifications annoy users, get disabled
- Mitigation: Rate limits, bundling, quiet hours, digest mode, granular controls
- Monitoring: Track notification disable rate, CTR

**Privacy Concerns:**
- Risk: Users worry about data collection, autonomy
- Mitigation: Transparent privacy policy, opt-in analytics, local-first storage
- Monitoring: Track opt-in rates, privacy settings usage

### UX Risks

**Complexity Creep:**
- Risk: Too many features overwhelm users
- Mitigation: Progressive disclosure, simple defaults, feature flags
- Monitoring: Track feature adoption, confusion signals

**Autonomy Overreach:**
- Risk: Devin does too much, users lose control
- Mitigation: Draft-only by default, explicit approval for merges, easy disable
- Monitoring: Track autonomy usage, revert rate

**Onboarding Drop-off:**
- Risk: Users abandon during onboarding
- Mitigation: 60-second flow, skip options, progressive onboarding
- Monitoring: Track onboarding funnel, completion rate

---

## Next Steps

### Immediate Actions
1. ✅ Review & approve this spec with stakeholders
2. ⏳ Update GitHub Issue #113 with enhancement checklist
3. ⏳ Update main wish document with new spec reference
4. ⏳ Create feature flag plan for gradual rollout
5. ⏳ Set up analytics for engagement metrics
6. ⏳ Design mockups for new surfaces (widgets, notifications, onboarding)

### Phase 1 Priorities
- Implement 60-second onboarding flow
- Add empty states with helpful CTAs
- Set up engagement event tracking
- Create onboarding completion funnel

### Phase 3 Priorities
- Build rich notification system with inline actions
- Implement Android widgets (Resume, Quick Capture, My Tasks)
- Create smart draft suggestion engine
- Add voice-to-task capture
- Build personalization engine
- Set up engagement dashboards

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Complete  
**Total New Content:** 15,000+ lines across UX spec + this summary
