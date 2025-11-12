# UX Best Practices & Engagement Specification

**Purpose:** Research-backed UX enhancements to make Forge highly engaging and autonomously helpful on mobile  
**Status:** 📋 Planning  
**Last Updated:** 2025-11-11

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Research: Habit-Forming UX Patterns](#research-habit-forming-ux-patterns)
3. [Ethical Engagement Charter](#ethical-engagement-charter)
4. [Assistant Autonomy Surfaces](#assistant-autonomy-surfaces)
5. [Notification Strategy](#notification-strategy)
6. [Resume & Re-engagement Flows](#resume--re-engagement-flows)
7. [Quick Capture Surfaces](#quick-capture-surfaces)
8. [Personalization & Smart Drafts](#personalization--smart-drafts)
9. [Onboarding & First-Time Experience](#onboarding--first-time-experience)
10. [Micro-interactions & Delight](#micro-interactions--delight)
11. [Measurement & Instrumentation](#measurement--instrumentation)
12. [Gap Analysis](#gap-analysis)
13. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Overview & Philosophy

### 1.1 Vision

**Goal:** Make Forge so engaging and helpful that it becomes an indispensable mobile companion, empowering Devin to run autonomously on every phone, helping users ship code faster.

**Target Experience:**
- Users check Forge multiple times daily (like ChatGPT)
- Devin proactively suggests next steps
- Tasks complete while users are away
- Re-engagement is frictionless (one tap to resume)
- Users feel productive, not manipulated

### 1.2 Core Principles

1. **Productivity-First Engagement** - Every notification, nudge, and feature must help users ship code faster
2. **Ethical by Default** - No dark patterns, explicit controls, opt-in autonomy
3. **Frictionless Resume** - Return to work in <3 seconds from any surface
4. **Proactive Assistance** - Devin suggests next steps, but users stay in control
5. **Respect Attention** - Smart notification bundling, quiet hours, digest mode
6. **Progressive Disclosure** - Simple by default, powerful when needed

### 1.3 Anti-Patterns to Avoid

❌ **Manipulative Scarcity** - No fake urgency, countdown timers, or FOMO tactics  
❌ **Attention Hijacking** - No infinite scroll, autoplay, or doomscrolling  
❌ **Dark Patterns** - No hidden costs, forced continuity, or deceptive UI  
❌ **Notification Spam** - No excessive alerts, respect user preferences  
❌ **Gamification Overload** - No points/leaderboards that distract from shipping  

---

## 2. Research: Habit-Forming UX Patterns

### 2.1 The Hooked Model (Nir Eyal)

**Framework:** Trigger → Action → Variable Reward → Investment

#### Applied to Forge:

**1. Trigger (External & Internal)**
- **External Triggers:**
  - Push notification: "Task attempt completed ✅"
  - Widget: "Resume last attempt"
  - Email digest: "3 tasks ready for review"
  - Share sheet: "Create task from screenshot"
  
- **Internal Triggers:**
  - User thinks: "I wonder if my task is done"
  - User feels: "I want to ship this feature"
  - User needs: "Quick code review on the go"

**2. Action (Simplest Behavior)**
- One tap to resume last attempt
- Swipe notification to approve PR
- Voice command: "Create task to fix login bug"
- Share screenshot → auto-create task with context

**3. Variable Reward**
- **Reward of the Hunt:** Discover what Devin built (diffs, logs)
- **Reward of the Self:** Progress toward shipping (tasks completed, PRs merged)
- **Reward of the Tribe:** Team notifications, PR approvals, collaboration

**4. Investment (Increases Future Value)**
- Configure preferred agents per project
- Save prompt templates
- Review and approve code (teaches Devin)
- Build task history (better context for future)

### 2.2 Fogg Behavior Model

**Formula:** Behavior = Motivation × Ability × Prompt

#### Applied to Forge:

| Behavior | Motivation | Ability | Prompt |
|----------|------------|---------|--------|
| **Resume attempt** | See progress | One tap from widget | "Continue working on login fix" |
| **Approve PR** | Ship feature | Swipe notification | "PR ready: +120 -45 lines" |
| **Send follow-up** | Unblock Devin | Voice input | "Attempt paused, needs guidance" |
| **Create task** | Capture idea | Share sheet | "Screenshot shared from Slack" |
| **Review diffs** | Ensure quality | Inline comments | "3 files changed, tap to review" |

**Key Insight:** Make high-value behaviors (resume, approve, create) extremely easy (1-2 taps, <3 seconds).

### 2.3 Analysis of Leading Apps

#### ChatGPT Mobile (Habit-Forming Excellence)

**What They Do Well:**
- ✅ **Instant Resume:** Opens to last conversation, no loading
- ✅ **Voice First:** One tap microphone, immediate transcription
- ✅ **Share Everywhere:** Share sheet integration, copy/paste optimized
- ✅ **Minimal Chrome:** Full-screen chat, bottom input bar
- ✅ **Smart Suggestions:** Context-aware prompt starters
- ✅ **Offline Grace:** Shows cached conversations, queues messages

**Patterns to Adopt:**
- Open-to-context (last attempt, not home screen)
- Voice-first quick capture
- Share sheet integration for task creation
- Minimal UI chrome, maximize content
- Smart follow-up suggestions based on attempt state

#### Duolingo (Habit Formation Master)

**What They Do Well:**
- ✅ **Tiny Steps:** 5-minute lessons, feels achievable
- ✅ **Streaks (Gentle):** Daily reminder, not punishing
- ✅ **Progress Visible:** XP, levels, completion bars
- ✅ **Personalized Timing:** Learns when you practice, reminds then
- ✅ **Celebration Moments:** Confetti, sounds, haptics on success

**Patterns to Adopt:**
- Break work into small wins (create task, start attempt, review diff, approve PR)
- Optional shipping streak (X days with merged PRs)
- Progress bars for task completion, attempt stages
- Learn user's active hours, send digest then
- Haptic + visual celebration on PR merge

#### GitHub Mobile (Developer Tool Excellence)

**What They Do Well:**
- ✅ **Rich Notifications:** Inline actions (Approve, Comment, Merge)
- ✅ **Quick Actions:** Dynamic shortcuts to top repos/PRs
- ✅ **Widgets:** Recent activity, assigned PRs
- ✅ **Inline Review:** Comment on code from notification
- ✅ **Smart Bundling:** Groups related notifications

**Patterns to Adopt:**
- Rich notifications with inline actions (Approve, Follow-up, Open)
- Dynamic shortcuts to top projects/attempts
- Widgets for recent activity and pending reviews
- Inline code review from notifications (RemoteInput)
- Smart notification bundling by project/task

#### Notion Mobile (Quick Capture Excellence)

**What They Do Well:**
- ✅ **Quick Note:** Widget + share sheet, instant capture
- ✅ **Voice to Text:** Transcription with formatting
- ✅ **Templates:** One-tap task creation with structure
- ✅ **Offline First:** Everything works offline, syncs later
- ✅ **Search First:** Fast search, recent items

**Patterns to Adopt:**
- Quick capture widget (voice, text, screenshot → task)
- Voice-to-task with auto-formatting
- Task templates (bug fix, feature, refactor)
- Offline-first everything
- Fast search with recent attempts

#### Linear (Task Management Excellence)

**What They Do Well:**
- ✅ **Keyboard Shortcuts:** Mobile keyboard shortcuts (Cmd+K)
- ✅ **Instant Create:** One tap → task form, smart defaults
- ✅ **Status Updates:** Swipe to change status
- ✅ **Notifications:** Contextual, actionable, timely
- ✅ **Cycles/Sprints:** Clear progress tracking

**Patterns to Adopt:**
- Mobile keyboard shortcuts for power users
- Instant task creation with smart defaults
- Swipe gestures to change task status
- Contextual notifications based on task state
- Sprint/milestone progress tracking

### 2.4 Key Learnings Summary

**Universal Patterns:**
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

## 3. Ethical Engagement Charter

### 3.1 Core Commitments

**We Will:**
- ✅ Help users ship code faster and be more productive
- ✅ Respect user attention with smart notification controls
- ✅ Provide explicit controls for all autonomous features
- ✅ Default to "draft-only" autonomy (user approves before execution)
- ✅ Make privacy and data controls transparent and accessible
- ✅ Measure engagement to improve productivity, not maximize time-on-app
- ✅ Provide easy opt-out for all engagement features

**We Won't:**
- ❌ Use manipulative scarcity or FOMO tactics
- ❌ Hide costs or force continuity
- ❌ Spam notifications or ignore user preferences
- ❌ Gamify in ways that distract from shipping
- ❌ Auto-merge code without explicit approval
- ❌ Collect data beyond what's needed for functionality
- ❌ Make it hard to disable autonomous features

### 3.2 Autonomy Guardrails

**Three Levels of Autonomy:**

**Level 0: Manual (Default)**
- User initiates all actions
- Devin executes when commanded
- No proactive suggestions

**Level 1: Draft-Only Autonomy (Recommended)**
- Devin prepares follow-ups as drafts
- User taps to execute
- Notifications suggest actions, don't execute
- Example: "Suggested follow-up: Run tests" → tap to send

**Level 2: Scheduled Autonomy (Opt-In)**
- User sets time windows (e.g., 9-11am daily)
- Devin can execute within constraints
- Never merges without approval
- User can pause/stop anytime
- Example: "Auto-follow-up during work hours, but pause merges for review"

**Critical Rule:** No code merges without explicit user approval, regardless of autonomy level.

### 3.3 Notification Ethics

**Principles:**
1. **User Control First** - Granular channel controls, quiet hours, snooze
2. **Respect Attention** - Bundle related notifications, daily digest option
3. **Actionable Only** - Every notification must enable immediate action
4. **Progressive Disclosure** - Start conservative, let users opt-in to more
5. **Clear Value** - Notification must save time or provide critical info

**Rate Limits:**
- Max 5 notifications per hour (excluding critical errors)
- Max 20 notifications per day
- Automatic bundling after 3 related notifications
- Quiet hours: 10pm-8am (user configurable)
- Digest mode: Single daily summary at preferred time

### 3.4 Privacy & Data

**Commitments:**
- All task data stored locally first (IndexedDB)
- Sync only when online and user authenticated
- No analytics without explicit opt-in
- Clear data retention policies
- Easy export and deletion
- No third-party tracking

---

## 4. Assistant Autonomy Surfaces

### 4.1 Proactive Suggestions

**When Devin Suggests Actions:**

**Attempt State: Idle (>30 min)**
```
Notification: "Task attempt idle for 2 hours"
Actions:
- [Send Follow-up] (opens draft)
- [Review Progress] (opens logs)
- [Stop Attempt]
- [Snooze 1h]
```

**Attempt State: Blocked**
```
Notification: "Attempt blocked: Missing API key"
Actions:
- [Add to .env] (opens editor)
- [Send Follow-up] (with context)
- [View Logs]
```

**Attempt State: Completed**
```
Notification: "Task completed ✅ +120 -45 lines"
Actions:
- [Review Diffs]
- [Approve & Merge] (if CI passed)
- [Send Follow-up]
- [Create PR]
```

**Attempt State: CI Failed**
```
Notification: "CI failed: 3 lint errors"
Actions:
- [View Errors]
- [Auto-fix Lint] (if safe)
- [Send Follow-up: Fix lint]
```

### 4.2 Smart Follow-up Drafts

**Context-Aware Suggestions:**

**After Attempt Completes:**
- "Run tests"
- "Add error handling"
- "Create PR draft"
- "Refactor for clarity"

**After CI Fails:**
- "Fix lint errors"
- "Fix type errors"
- "Update tests"

**After User Reviews Diffs:**
- "Add inline comments to code"
- "Extract helper function"
- "Add JSDoc comments"

**Implementation:**
```typescript
interface SmartDraft {
  id: string;
  attemptId: string;
  trigger: 'completion' | 'ci_fail' | 'idle' | 'user_review';
  prompt: string;
  confidence: number; // 0-1, show if >0.7
  context: {
    files?: string[];
    errors?: string[];
    metrics?: Record<string, number>;
  };
}

// User sees:
// "Suggested follow-up: Run tests"
// [Send] [Edit] [Dismiss]
```

### 4.3 Scheduled Autonomy Windows

**User Configuration:**
```typescript
interface AutonomySchedule {
  enabled: boolean;
  windows: {
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    startTime: string; // "09:00"
    endTime: string;   // "17:00"
  }[];
  allowedActions: {
    startAttempt: boolean;
    sendFollowUp: boolean;
    stopAttempt: boolean;
    approvePR: boolean; // Always false by default
  };
  constraints: {
    maxAttemptsPerDay: number;
    requireCIPass: boolean;
    pauseOnError: boolean;
  };
}
```

**Example Schedule:**
```
Weekdays 9am-5pm:
✅ Start attempts for "todo" tasks
✅ Send follow-ups for idle attempts
✅ Stop failed attempts
❌ Never approve/merge PRs (manual only)

Constraints:
- Max 5 attempts per day
- Require CI pass before suggesting merge
- Pause on any error
```

### 4.4 Audit Trail

**All Autonomous Actions Logged:**
```typescript
interface AutonomousAction {
  id: string;
  timestamp: Date;
  action: 'start_attempt' | 'send_followup' | 'stop_attempt';
  attemptId: string;
  trigger: 'scheduled' | 'suggestion_accepted' | 'manual';
  result: 'success' | 'failed' | 'reverted';
  revertedAt?: Date;
}

// UI: "Autonomous Actions" tab in settings
// Shows: What Devin did, when, why, outcome
// Allows: Revert any action, disable autonomy
```

---

## 5. Notification Strategy

### 5.1 Notification Channels

**Android Notification Channels:**

**1. Attempts (High Priority)**
- Attempt started
- Attempt completed
- Attempt failed
- Attempt blocked (needs input)

**2. Diffs & Review (Medium Priority)**
- Diffs ready for review
- Inline comment added
- Review requested

**3. Build & CI (Medium Priority)**
- CI started
- CI passed ✅
- CI failed ❌
- Build warnings

**4. Suggestions (Low Priority)**
- Smart follow-up draft ready
- Idle attempt reminder
- Daily digest

**5. System (Low Priority)**
- Sync completed
- Offline mode active
- Update available

### 5.2 Rich Notification Actions

**Attempt Completed:**
```
┌─────────────────────────────────────┐
│ 🤖 Forge                            │
│ Task completed ✅                    │
│ "Fix login validation bug"          │
│ +120 -45 lines in 3 files           │
├─────────────────────────────────────┤
│ [Review Diffs] [Approve] [Follow-up]│
└─────────────────────────────────────┘
```

**Attempt Blocked:**
```
┌─────────────────────────────────────┐
│ 🤖 Forge                            │
│ Attempt blocked ⚠️                   │
│ "Add dark mode toggle"              │
│ Missing: THEME_API_KEY in .env      │
├─────────────────────────────────────┤
│ [Add Key] [View Logs] [Send Guidance]│
└─────────────────────────────────────┘
```

**CI Failed:**
```
┌─────────────────────────────────────┐
│ 🤖 Forge                            │
│ CI failed ❌                         │
│ "Refactor auth service"             │
│ 3 lint errors, 1 type error         │
├─────────────────────────────────────┤
│ [View Errors] [Auto-fix] [Follow-up]│
└─────────────────────────────────────┘
```

**Daily Digest:**
```
┌─────────────────────────────────────┐
│ 🤖 Forge Daily Summary              │
│ 3 tasks completed ✅                 │
│ 2 PRs ready for review              │
│ 1 attempt needs guidance            │
├─────────────────────────────────────┤
│ [Review All] [Open Forge]           │
└─────────────────────────────────────┘
```

### 5.3 Inline Actions with RemoteInput

**Send Follow-up from Notification:**
```kotlin
// Android RemoteInput
val remoteInput = RemoteInput.Builder("follow_up_text")
    .setLabel("Send follow-up to Devin")
    .build()

val action = NotificationCompat.Action.Builder(
    R.drawable.ic_send,
    "Follow-up",
    followUpPendingIntent
)
    .addRemoteInput(remoteInput)
    .build()
```

**User Experience:**
1. Tap "Follow-up" on notification
2. Inline text input appears
3. Type message: "Add error handling for null case"
4. Send → Devin receives follow-up
5. Notification updates: "Follow-up sent ✅"

### 5.4 Notification Bundling

**Smart Grouping:**

**Multiple Attempts Completed:**
```
┌─────────────────────────────────────┐
│ 🤖 Forge                            │
│ 3 tasks completed ✅                 │
│ • Fix login bug                     │
│ • Add dark mode                     │
│ • Refactor auth                     │
├─────────────────────────────────────┤
│ [Review All] [Open Forge]           │
└─────────────────────────────────────┘
```

**Bundling Rules:**
- Group by: Project, Task, Attempt
- Bundle after: 3 related notifications
- Max bundle size: 5 notifications
- Expand to show individual items

### 5.5 Quiet Hours & Digest Mode

**Quiet Hours (Default: 10pm-8am)**
- No notifications during quiet hours
- Exceptions: Critical errors only
- User configurable per channel

**Digest Mode**
- Single daily notification at preferred time
- Summary of all activity
- Inline actions for top items
- User can choose: Morning (8am), Lunch (12pm), Evening (6pm)

**Do Not Disturb Integration:**
- Respect Android DND settings
- Downgrade to low-priority notifications
- No sounds/vibrations during DND

---

## 6. Resume & Re-engagement Flows

### 6.1 Open-to-Context

**App Launch Behavior:**

**First Launch (New User):**
→ Onboarding flow (60 seconds)

**Returning User (No Active Work):**
→ Tasks view with recent activity

**Returning User (Active Attempt):**
→ Last attempt conversation view
→ Show: Progress, next suggested action
→ One tap to resume

**Implementation:**
```typescript
async function determineInitialRoute(): Promise<Route> {
  const onboarded = await getOnboardingStatus();
  if (!onboarded) return '/onboarding';
  
  const lastAttempt = await getLastActiveAttempt();
  if (lastAttempt && !lastAttempt.completed) {
    return `/attempts/${lastAttempt.id}/conversation`;
  }
  
  return '/tasks';
}
```

### 6.2 Android Widgets

**Widget 1: Resume Last Attempt**
```
┌─────────────────────────┐
│ 🤖 Forge                │
│ Fix login bug           │
│ In progress • 45m ago   │
│ [Resume] [View Diffs]   │
└─────────────────────────┘
```

**Widget 2: Quick Capture**
```
┌─────────────────────────┐
│ 🤖 Forge                │
│ [🎤 Voice] [📷 Camera]   │
│ [✏️ Text]  [📋 Paste]    │
└─────────────────────────┘
```

**Widget 3: My Tasks**
```
┌─────────────────────────┐
│ 🤖 Forge • My Tasks     │
│ ✅ 3 Done  🔄 2 Active  │
│ • Fix login (in progress)│
│ • Add dark mode (todo)  │
│ [View All]              │
└─────────────────────────┘
```

**Implementation:**
```kotlin
class ForgeWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_resume)
            
            // Fetch last attempt
            val lastAttempt = getLastActiveAttempt()
            views.setTextViewText(R.id.task_title, lastAttempt.title)
            views.setTextViewText(R.id.status, lastAttempt.status)
            
            // Resume action
            val resumeIntent = Intent(context, MainActivity::class.java).apply {
                putExtra("attemptId", lastAttempt.id)
                putExtra("action", "resume")
            }
            val resumePendingIntent = PendingIntent.getActivity(
                context, 0, resumeIntent, PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.resume_button, resumePendingIntent)
            
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
```

### 6.3 Dynamic App Shortcuts

**Android Dynamic Shortcuts (Long-press app icon):**

**Shortcut 1: Resume Last Attempt**
```
📋 Resume "Fix login bug"
→ Opens attempt conversation
```

**Shortcut 2: Top Project**
```
📁 Automagik Forge
→ Opens project tasks
```

**Shortcut 3: Create Task**
```
➕ New Task
→ Opens task creation sheet
```

**Shortcut 4: Recent Diffs**
```
📄 Review Diffs
→ Opens diffs view for last attempt
```

**Implementation:**
```kotlin
fun updateDynamicShortcuts(context: Context) {
    val shortcutManager = context.getSystemService(ShortcutManager::class.java)
    
    val shortcuts = mutableListOf<ShortcutInfo>()
    
    // Resume last attempt
    val lastAttempt = getLastActiveAttempt()
    if (lastAttempt != null) {
        shortcuts.add(
            ShortcutInfo.Builder(context, "resume_last")
                .setShortLabel("Resume ${lastAttempt.task.title}")
                .setLongLabel("Resume \"${lastAttempt.task.title}\"")
                .setIcon(Icon.createWithResource(context, R.drawable.ic_resume))
                .setIntent(
                    Intent(context, MainActivity::class.java).apply {
                        action = Intent.ACTION_VIEW
                        putExtra("attemptId", lastAttempt.id)
                    }
                )
                .build()
        )
    }
    
    // Top project
    val topProject = getTopProject()
    if (topProject != null) {
        shortcuts.add(
            ShortcutInfo.Builder(context, "top_project")
                .setShortLabel(topProject.name)
                .setIcon(Icon.createWithResource(context, R.drawable.ic_project))
                .setIntent(
                    Intent(context, MainActivity::class.java).apply {
                        action = Intent.ACTION_VIEW
                        putExtra("projectId", topProject.id)
                    }
                )
                .build()
        )
    }
    
    // Create task
    shortcuts.add(
        ShortcutInfo.Builder(context, "create_task")
            .setShortLabel("New Task")
            .setIcon(Icon.createWithResource(context, R.drawable.ic_add))
            .setIntent(
                Intent(context, MainActivity::class.java).apply {
                    action = "CREATE_TASK"
                }
            )
            .build()
    )
    
    shortcutManager.dynamicShortcuts = shortcuts
}
```

### 6.4 Quick Settings Tile

**Android Quick Settings Tile:**

**Tile States:**

**Idle:**
```
┌─────────┐
│ 🤖      │
│ Forge   │
│ Idle    │
└─────────┘
Tap → Start last task
```

**Active:**
```
┌─────────┐
│ 🤖 ⚡   │
│ Forge   │
│ Running │
└─────────┘
Tap → Stop attempt
```

**Implementation:**
```kotlin
class ForgeTileService : TileService() {
    override fun onStartListening() {
        super.onStartListening()
        updateTile()
    }
    
    override fun onClick() {
        super.onClick()
        
        val activeAttempt = getActiveAttempt()
        if (activeAttempt != null) {
            // Stop attempt
            stopAttempt(activeAttempt.id)
            showToast("Attempt stopped")
        } else {
            // Start last task
            val lastTask = getLastTask()
            if (lastTask != null) {
                startAttempt(lastTask.id)
                showToast("Starting attempt...")
            }
        }
        
        updateTile()
    }
    
    private fun updateTile() {
        val tile = qsTile ?: return
        val activeAttempt = getActiveAttempt()
        
        if (activeAttempt != null) {
            tile.state = Tile.STATE_ACTIVE
            tile.label = "Running"
            tile.subtitle = activeAttempt.task.title
        } else {
            tile.state = Tile.STATE_INACTIVE
            tile.label = "Idle"
            tile.subtitle = "Tap to start"
        }
        
        tile.updateTile()
    }
}
```

---

## 7. Quick Capture Surfaces

### 7.1 Share Sheet Integration

**Share to Forge from Any App:**

**Text Selection:**
```
User selects text in browser/Slack/email
→ Share → Forge
→ Bottom sheet: "Create task from text"
→ Pre-filled description
→ Select project
→ [Create Task]
```

**Screenshot:**
```
User takes screenshot
→ Share → Forge
→ Bottom sheet: "Create task from screenshot"
→ OCR extracts text (optional)
→ Screenshot attached
→ [Create Task]
```

**URL:**
```
User shares URL
→ Share → Forge
→ Bottom sheet: "Create task from link"
→ Fetch page title/description
→ Link attached
→ [Create Task]
```

**Implementation:**
```kotlin
// AndroidManifest.xml
<activity
    android:name=".ShareActivity"
    android:theme="@style/Theme.Forge.BottomSheet">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
        <data android:mimeType="image/*" />
    </intent-filter>
</activity>

// ShareActivity.kt
class ShareActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        when {
            intent.type?.startsWith("text/") == true -> {
                val text = intent.getStringExtra(Intent.EXTRA_TEXT)
                showCreateTaskSheet(description = text)
            }
            intent.type?.startsWith("image/") == true -> {
                val imageUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
                showCreateTaskSheet(attachment = imageUri)
            }
        }
    }
}
```

### 7.2 Voice-to-Task

**One-Tap Voice Capture:**

**Widget Voice Button:**
```
User taps 🎤 on widget
→ Voice recording starts
→ Speak: "Create task to add dark mode toggle to settings"
→ Transcription appears
→ [Create Task] [Edit] [Cancel]
```

**Floating Action Button:**
```
Long-press FAB in app
→ Voice recording starts
→ Speak task description
→ Auto-create task
```

**Implementation:**
```typescript
// Voice capture hook
function useVoiceCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const startRecording = async () => {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) return;
    
    setIsRecording(true);
    
    // Use Capacitor Speech Recognition or cloud API
    const result = await SpeechRecognition.start({
      language: 'en-US',
      maxResults: 1,
      prompt: 'Describe your task...',
    });
    
    setTranscript(result.matches[0]);
    setIsRecording(false);
  };
  
  const createTaskFromVoice = async () => {
    const task = await createTask({
      title: extractTitle(transcript),
      description: transcript,
      source: 'voice',
    });
    
    HapticsService.success();
    showToast('Task created ✅');
  };
  
  return { isRecording, transcript, startRecording, createTaskFromVoice };
}
```

### 7.3 Camera-to-Task

**Photo Capture for Tasks:**

**Use Cases:**
- Screenshot of bug
- Whiteboard sketch
- Design mockup
- Error message photo

**Flow:**
```
User taps 📷 on widget/FAB
→ Camera opens
→ Take photo
→ OCR extracts text (optional)
→ Photo attached to task
→ [Create Task]
```

**Implementation:**
```typescript
async function capturePhotoForTask() {
  const photo = await CameraService.takePhoto({
    quality: 90,
    allowEditing: true,
    resultType: 'uri',
  });
  
  // Optional: OCR for text extraction
  const ocrText = await extractTextFromImage(photo.uri);
  
  // Show task creation sheet
  showCreateTaskSheet({
    attachment: photo.uri,
    description: ocrText,
  });
}
```

---

## 8. Personalization & Smart Drafts

### 8.1 Learning User Preferences

**What to Learn:**

**Per-Project Defaults:**
- Preferred executor (Claude, Codex, etc.)
- Preferred variant (sonnet-4, gpt-4, etc.)
- Common prompt templates
- Typical task types

**Per-User Patterns:**
- Active hours (when user works)
- Notification preferences (frequency, channels)
- Review style (thorough vs quick)
- Follow-up patterns (common prompts)

**Implementation:**
```typescript
interface UserPreferences {
  projects: Record<string, ProjectPreferences>;
  global: GlobalPreferences;
  learned: LearnedPatterns;
}

interface ProjectPreferences {
  projectId: string;
  defaultExecutor: ExecutorProfileId;
  promptTemplates: PromptTemplate[];
  taskTypes: string[]; // ['bug', 'feature', 'refactor']
}

interface LearnedPatterns {
  activeHours: { start: string; end: string }; // "09:00" - "17:00"
  commonFollowUps: string[]; // ["Run tests", "Add error handling"]
  reviewSpeed: 'thorough' | 'quick';
  notificationFrequency: 'high' | 'medium' | 'low';
}

// Learning algorithm
async function learnUserPatterns() {
  const attempts = await getRecentAttempts(30); // Last 30 days
  
  // Learn active hours
  const timestamps = attempts.map(a => a.createdAt);
  const activeHours = calculatePeakHours(timestamps);
  
  // Learn common follow-ups
  const followUps = attempts.flatMap(a => a.followUps);
  const commonFollowUps = findMostFrequent(followUps, 5);
  
  // Learn review speed
  const reviewTimes = attempts.map(a => 
    a.reviewedAt - a.completedAt
  );
  const avgReviewTime = average(reviewTimes);
  const reviewSpeed = avgReviewTime < 300 ? 'quick' : 'thorough'; // 5 min
  
  await saveLearnedPatterns({
    activeHours,
    commonFollowUps,
    reviewSpeed,
  });
}
```

### 8.2 Smart Follow-up Suggestions

**Context-Aware Prompts:**

**After Attempt Completes:**
```typescript
function generateSmartFollowUps(attempt: TaskAttempt): SmartDraft[] {
  const drafts: SmartDraft[] = [];
  
  // Check if tests exist
  const hasTests = attempt.diffs.some(d => d.path.includes('test'));
  if (!hasTests) {
    drafts.push({
      prompt: 'Add unit tests for the new code',
      confidence: 0.9,
      trigger: 'completion',
    });
  }
  
  // Check if documentation updated
  const hasDocChanges = attempt.diffs.some(d => 
    d.path.endsWith('.md') || d.path.includes('README')
  );
  if (!hasDocChanges && attempt.diffs.length > 3) {
    drafts.push({
      prompt: 'Update documentation to reflect changes',
      confidence: 0.8,
      trigger: 'completion',
    });
  }
  
  // Check for TODO comments
  const hasTodos = attempt.diffs.some(d => 
    d.newContent?.includes('TODO')
  );
  if (hasTodos) {
    drafts.push({
      prompt: 'Address TODO comments in the code',
      confidence: 0.85,
      trigger: 'completion',
    });
  }
  
  // User's common follow-ups
  const userCommon = getUserCommonFollowUps();
  drafts.push(...userCommon.map(prompt => ({
    prompt,
    confidence: 0.7,
    trigger: 'completion' as const,
  })));
  
  return drafts.filter(d => d.confidence > 0.7);
}
```

**UI for Smart Drafts:**
```
┌─────────────────────────────────────┐
│ Suggested follow-ups:               │
├─────────────────────────────────────┤
│ ⚡ Add unit tests for the new code  │
│    [Send] [Edit] [Dismiss]          │
├─────────────────────────────────────┤
│ 📝 Update documentation             │
│    [Send] [Edit] [Dismiss]          │
├─────────────────────────────────────┤
│ ✅ Address TODO comments            │
│    [Send] [Edit] [Dismiss]          │
└─────────────────────────────────────┘
```

### 8.3 Prompt Templates

**User-Defined Templates:**

**Template Examples:**
```typescript
const templates: PromptTemplate[] = [
  {
    name: 'Add Tests',
    prompt: 'Add comprehensive unit tests for the new code. Cover edge cases and error handling.',
    category: 'quality',
  },
  {
    name: 'Refactor',
    prompt: 'Refactor the code for better readability and maintainability. Extract helper functions where appropriate.',
    category: 'refactor',
  },
  {
    name: 'Add Docs',
    prompt: 'Add JSDoc comments to all public functions and update the README with usage examples.',
    category: 'documentation',
  },
  {
    name: 'Fix Lint',
    prompt: 'Fix all linting errors and warnings. Follow the project style guide.',
    category: 'quality',
  },
];
```

**UI for Templates:**
```
┌─────────────────────────────────────┐
│ Follow-up Templates                 │
├─────────────────────────────────────┤
│ 🧪 Add Tests                        │
│ 🔧 Refactor                         │
│ 📝 Add Docs                         │
│ ✨ Fix Lint                         │
│ ➕ Create Custom...                 │
└─────────────────────────────────────┘
```

### 8.4 Smart Defaults

**Reduce Decisions:**

**Task Creation:**
```typescript
function getSmartDefaults(projectId: string): TaskDefaults {
  const project = getProject(projectId);
  const preferences = getUserPreferences(projectId);
  const recentTasks = getRecentTasks(projectId, 10);
  
  return {
    executor: preferences.defaultExecutor || project.defaultExecutor,
    variant: preferences.defaultVariant,
    labels: getMostCommonLabels(recentTasks),
    assignee: getCurrentUser(),
    status: 'todo',
  };
}

// UI shows pre-filled form
// User can change or just tap "Create"
```

**Attempt Creation:**
```typescript
function getAttemptDefaults(taskId: string): AttemptDefaults {
  const task = getTask(taskId);
  const project = getProject(task.projectId);
  const lastAttempt = getLastAttempt(taskId);
  
  return {
    executor: lastAttempt?.executor || project.defaultExecutor,
    variant: lastAttempt?.variant,
    targetBranch: project.defaultBranch || 'main',
  };
}
```

---

## 9. Onboarding & First-Time Experience

### 9.1 60-Second Onboarding

**Goal:** Get user to first task in <60 seconds

**Flow:**

**Step 1: Welcome (5s)**
```
┌─────────────────────────────────────┐
│ Welcome to Forge! 🚀                │
│                                     │
│ Ship code faster with AI agents     │
│ running in isolated environments    │
│                                     │
│ [Get Started]                       │
└─────────────────────────────────────┘
```

**Step 2: GitHub Auth (15s)**
```
┌─────────────────────────────────────┐
│ Connect GitHub                      │
│                                     │
│ 1. Visit: github.com/login/device   │
│ 2. Enter code: ABCD-1234            │
│                                     │
│ [Copy Code] [Open Browser]          │
│                                     │
│ Waiting for authorization...        │
└─────────────────────────────────────┘
```

**Step 3: Pick Default Agent (10s)**
```
┌─────────────────────────────────────┐
│ Choose your AI agent                │
│                                     │
│ ○ Claude Code (Recommended)         │
│ ○ Codex                             │
│ ○ Gemini                            │
│ ○ Cursor                            │
│                                     │
│ You can change this later           │
│                                     │
│ [Continue]                          │
└─────────────────────────────────────┘
```

**Step 4: Import Projects (15s)**
```
┌─────────────────────────────────────┐
│ Import your projects                │
│                                     │
│ ✓ automagik-forge                   │
│ ✓ my-app                            │
│ ○ old-project                       │
│                                     │
│ [Import Selected] [Skip]            │
└─────────────────────────────────────┘
```

**Step 5: Enable Notifications (10s)**
```
┌─────────────────────────────────────┐
│ Stay updated                        │
│                                     │
│ Get notified when:                  │
│ ✓ Tasks complete                    │
│ ✓ Review needed                     │
│ ✓ CI fails                          │
│ ○ Daily digest                      │
│                                     │
│ [Enable Notifications] [Skip]       │
└─────────────────────────────────────┘
```

**Step 6: Done! (5s)**
```
┌─────────────────────────────────────┐
│ You're all set! 🎉                  │
│                                     │
│ Create your first task to get       │
│ started with AI-assisted coding     │
│                                     │
│ [Create Task] [Explore]             │
└─────────────────────────────────────┘
```

### 9.2 Progressive Onboarding

**Introduce Features Over Time:**

**First Task Creation:**
```
💡 Tip: You can use voice to create tasks
   Tap the microphone icon to try it
   [Got it] [Show me]
```

**First Attempt Completion:**
```
💡 Tip: Swipe left on notifications to approve PRs
   [Got it] [Show me]
```

**After 3 Tasks:**
```
💡 Tip: Add a widget to your home screen
   Resume tasks with one tap
   [Add Widget] [Later]
```

**After 1 Week:**
```
💡 Tip: Enable autonomous suggestions
   Devin can prepare follow-ups for you
   [Enable] [Learn More] [No thanks]
```

### 9.3 Empty States

**No Projects:**
```
┌─────────────────────────────────────┐
│ No projects yet                     │
│                                     │
│ Import from GitHub or create a      │
│ new project to get started          │
│                                     │
│ [Import from GitHub]                │
│ [Create Project]                    │
└─────────────────────────────────────┘
```

**No Tasks:**
```
┌─────────────────────────────────────┐
│ No tasks yet                        │
│                                     │
│ Create your first task to start     │
│ working with AI agents              │
│                                     │
│ [Create Task]                       │
│ [Import from Issues]                │
└─────────────────────────────────────┘
```

**No Attempts:**
```
┌─────────────────────────────────────┐
│ Ready to start?                     │
│                                     │
│ Start an attempt to have an AI      │
│ agent work on this task             │
│                                     │
│ [Start Attempt]                     │
└─────────────────────────────────────┘
```

---

## 10. Micro-interactions & Delight

### 10.1 Haptic Feedback

**Haptic Patterns:**

**Success Actions:**
- PR merged → Heavy impact + success notification
- Task completed → Medium impact
- Follow-up sent → Light impact

**Error Actions:**
- CI failed → Error notification (3 light taps)
- Attempt blocked → Warning notification (2 medium taps)
- Network error → Error notification

**Gesture Feedback:**
- Swipe to delete → Light impact on threshold
- Long press → Medium impact on activation
- Pull to refresh → Light impact on release

**Implementation:**
```typescript
// Haptic service with semantic methods
class HapticsService {
  static async success() {
    await Haptics.notification({ type: NotificationType.Success });
  }
  
  static async warning() {
    await Haptics.notification({ type: NotificationType.Warning });
  }
  
  static async error() {
    await Haptics.notification({ type: NotificationType.Error });
  }
  
  static async light() {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
  
  static async medium() {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
  
  static async heavy() {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }
  
  static async selection() {
    await Haptics.selectionStart();
  }
}

// Usage
async function approveAndMergePR(attemptId: string) {
  await mergePR(attemptId);
  await HapticsService.success(); // Heavy + success
  showToast('PR merged ✅');
}
```

### 10.2 Animations

**Micro-animations:**

**Task Card Swipe:**
```typescript
const swipeAnimation = useSpring({
  x: swipeState.x,
  backgroundColor: swipeState.x < -100 ? '#ef4444' : '#ffffff',
  config: { tension: 300, friction: 30 },
});
```

**Bottom Sheet Slide:**
```typescript
const sheetAnimation = useSpring({
  transform: isOpen ? 'translateY(0%)' : 'translateY(100%)',
  config: { tension: 280, friction: 30 },
});
```

**Success Confetti:**
```typescript
function showSuccessConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

// On PR merge
async function onPRMerged() {
  showSuccessConfetti();
  await HapticsService.success();
}
```

**Loading Skeletons:**
```typescript
function TaskCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

### 10.3 Visual Feedback

**Optimistic UI:**
```typescript
async function createTask(task: Task) {
  // Immediately add to UI
  addTaskToCache(task);
  
  try {
    // Send to server
    const created = await api.tasks.create(task);
    // Update with server response
    updateTaskInCache(created);
  } catch (error) {
    // Rollback on error
    removeTaskFromCache(task.id);
    showError('Failed to create task');
  }
}
```

**Progress Indicators:**
```typescript
function AttemptProgress({ attempt }: { attempt: TaskAttempt }) {
  const progress = calculateProgress(attempt);
  
  return (
    <div className="relative">
      <div className="h-1 bg-gray-200 rounded-full">
        <div 
          className="h-1 bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{progress}% complete</span>
    </div>
  );
}
```

**State Transitions:**
```typescript
function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const colors = {
    todo: 'bg-gray-100 text-gray-700',
    inprogress: 'bg-blue-100 text-blue-700',
    inreview: 'bg-yellow-100 text-yellow-700',
    done: 'bg-green-100 text-green-700',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${colors[status]}`}>
      {status}
    </span>
  );
}
```

### 10.4 Celebration Moments

**Milestones:**

**First Task Completed:**
```
🎉 Congratulations!
You completed your first task with Forge!

[Share] [Continue]
```

**10 Tasks Completed:**
```
🚀 Milestone Unlocked!
You've completed 10 tasks!

[View Stats] [Continue]
```

**First PR Merged:**
```
✅ First PR Merged!
Your first AI-generated PR is live!

[Share] [Continue]
```

**7-Day Streak:**
```
🔥 7-Day Streak!
You've shipped code every day this week!

[Keep Going] [Share]
```

---

## 11. Measurement & Instrumentation

### 11.1 Key Metrics

**Engagement Metrics:**

**Daily Active Users (DAU)**
- Users who open app per day
- Target: 2x increase vs desktop-only

**Weekly Active Users (WAU)**
- Users who open app per week
- Target: DAU/WAU ratio > 0.4 (high engagement)

**Session Duration**
- Time spent per session
- Target: 3x increase vs desktop (quick actions)

**Sessions Per Day**
- Number of times user opens app
- Target: 3-5 sessions/day (check-in behavior)

**Retention:**
- D1 (next day): >60%
- D7 (7 days): >40%
- D30 (30 days): >20%

**Productivity Metrics:**

**Time to First Value (TTFV)**
- Time from app open to first meaningful action
- Target: <10 seconds

**Task Completion Rate**
- % of started tasks that complete
- Target: >70%

**Resume Rate**
- % of users who resume from notifications/widgets
- Target: >50%

**Notification CTR**
- Click-through rate on notifications
- Target: >30%

**Actions Per Session**
- Number of meaningful actions per session
- Target: 2-3 actions/session

**Autonomy Metrics:**

**Smart Draft Acceptance Rate**
- % of smart drafts user sends
- Target: >40%

**Autonomous Action Success Rate**
- % of autonomous actions that succeed
- Target: >90%

**Approval Time**
- Time from completion to PR approval
- Target: <5 minutes

### 11.2 Event Tracking

**Core Events:**

```typescript
// User events
track('app_opened', { source: 'notification' | 'widget' | 'icon' | 'shortcut' });
track('task_created', { source: 'manual' | 'voice' | 'share' | 'widget' });
track('attempt_started', { executor: string, source: string });
track('attempt_resumed', { source: 'notification' | 'widget' | 'app' });
track('pr_approved', { time_to_approve: number, source: string });
track('follow_up_sent', { source: 'manual' | 'smart_draft' | 'notification' });

// Engagement events
track('notification_received', { channel: string, action: string });
track('notification_clicked', { channel: string, action: string });
track('widget_interacted', { widget_type: string, action: string });
track('shortcut_used', { shortcut_id: string });
track('voice_capture_used', { success: boolean, duration: number });

// Autonomy events
track('smart_draft_shown', { draft_id: string, confidence: number });
track('smart_draft_accepted', { draft_id: string });
track('smart_draft_edited', { draft_id: string });
track('autonomous_action_executed', { action: string, success: boolean });

// Milestone events
track('milestone_reached', { type: 'first_task' | '10_tasks' | 'streak_7' });
```

### 11.3 Funnels

**Onboarding Funnel:**
```
App Install
  ↓ (95%)
Welcome Screen
  ↓ (90%)
GitHub Auth
  ↓ (85%)
Pick Agent
  ↓ (80%)
Import Projects
  ↓ (75%)
Enable Notifications
  ↓ (70%)
Onboarding Complete
```

**Task Creation Funnel:**
```
Open Create Task
  ↓ (90%)
Fill Title
  ↓ (85%)
Fill Description
  ↓ (80%)
Select Executor
  ↓ (95%)
Create Task
```

**Task Completion Funnel:**
```
Start Attempt
  ↓ (95%)
Attempt Running
  ↓ (85%)
Attempt Complete
  ↓ (70%)
Review Diffs
  ↓ (60%)
Approve PR
  ↓ (90%)
PR Merged
```

**Notification Engagement Funnel:**
```
Notification Sent
  ↓ (40%)
Notification Clicked
  ↓ (70%)
Action Taken
  ↓ (80%)
Task Completed
```

### 11.4 A/B Testing

**Test Scenarios:**

**Notification Wording:**
- A: "Task completed ✅"
- B: "Your task is ready for review"
- Measure: CTR, time to review

**Smart Draft Presentation:**
- A: Show top 3 drafts
- B: Show top 1 draft with "More" button
- Measure: Acceptance rate, edit rate

**Onboarding Flow:**
- A: 6-step onboarding
- B: 3-step onboarding (minimal)
- Measure: Completion rate, time to first task

**Widget Design:**
- A: Resume button prominent
- B: Quick capture buttons prominent
- Measure: Widget interaction rate, action type

**Implementation:**
```typescript
interface ABTest {
  id: string;
  name: string;
  variants: {
    id: string;
    name: string;
    weight: number; // 0-1, sum to 1
  }[];
  startDate: Date;
  endDate: Date;
  metrics: string[];
}

function getVariant(testId: string, userId: string): string {
  const test = getABTest(testId);
  const hash = hashUserId(userId);
  const random = hash % 100 / 100;
  
  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (random < cumulative) {
      return variant.id;
    }
  }
  
  return test.variants[0].id;
}

// Usage
const notificationVariant = getVariant('notification_wording', userId);
const message = notificationVariant === 'A' 
  ? 'Task completed ✅'
  : 'Your task is ready for review';
```

### 11.5 Dashboards

**Real-Time Dashboard:**
```
┌─────────────────────────────────────┐
│ Forge Mobile - Live Metrics         │
├─────────────────────────────────────┤
│ DAU: 1,234 (+12% vs yesterday)      │
│ Sessions: 4,567 (3.7 per user)      │
│ Task Completions: 567 (+8%)         │
│ Notification CTR: 34% (target: 30%) │
│ Resume Rate: 52% (target: 50%)      │
└─────────────────────────────────────┘
```

**Retention Cohorts:**
```
Week    D1    D7    D30
Week 1  65%   45%   22%
Week 2  68%   48%   24%
Week 3  70%   50%   25%  ← Improving!
```

**Funnel Analysis:**
```
Onboarding Funnel:
Install → Welcome: 95%
Welcome → Auth: 90%
Auth → Agent: 85%
Agent → Projects: 80%
Projects → Notifications: 75%
Notifications → Complete: 70%

Overall: 70% completion (target: 75%)
Drop-off: Biggest at Projects step
```

---

## 12. Gap Analysis

### 12.1 Current Plan Coverage

**Existing Specifications:**
1. Phase 1 Foundation Technical Spec
2. Component API Contracts
3. Capacitor Native Features Spec
4. Offline Strategy Spec
5. Performance Monitoring Spec
6. Migration Strategy
7. Data Flow Architecture

### 12.2 Gap Analysis Table

| Feature | Current Coverage | Gap | Priority | Phase |
|---------|------------------|-----|----------|-------|
| **Notifications** | ✅ Push notifications setup | ❌ Rich actions, RemoteInput, bundling | 🔴 High | Phase 3 |
| **Widgets** | ❌ Not covered | ❌ Resume, Quick Capture, My Tasks widgets | 🔴 High | Phase 3 |
| **Dynamic Shortcuts** | ❌ Not covered | ❌ Long-press app icon shortcuts | 🟡 Medium | Phase 3 |
| **Quick Settings Tile** | ❌ Not covered | ❌ Start/stop from quick settings | 🟢 Low | Phase 4 |
| **Share Sheet** | ❌ Not covered | ❌ Create task from share | 🔴 High | Phase 2 |
| **Voice Capture** | ❌ Not covered | ❌ Voice-to-task | 🟡 Medium | Phase 3 |
| **Camera Capture** | ✅ Camera integration | ⚠️ Partial: Missing task creation flow | 🟡 Medium | Phase 3 |
| **Smart Drafts** | ❌ Not covered | ❌ Context-aware follow-up suggestions | 🔴 High | Phase 3 |
| **Personalization** | ❌ Not covered | ❌ Learn preferences, smart defaults | 🟡 Medium | Phase 3 |
| **Onboarding** | ❌ Not covered | ❌ 60-second onboarding flow | 🔴 High | Phase 1 |
| **Open-to-Context** | ❌ Not covered | ❌ Resume last attempt on open | 🔴 High | Phase 2 |
| **Autonomy** | ❌ Not covered | ❌ Draft-only autonomy, scheduled windows | 🟡 Medium | Phase 4 |
| **Haptic Patterns** | ✅ Basic haptics | ⚠️ Partial: Missing semantic patterns | 🟢 Low | Phase 2 |
| **Animations** | ❌ Not covered | ❌ Micro-animations, confetti | 🟢 Low | Phase 4 |
| **Measurement** | ⚠️ Performance only | ❌ Engagement metrics, funnels, A/B tests | 🟡 Medium | Phase 3 |
| **Empty States** | ❌ Not covered | ❌ Helpful empty states with CTAs | 🟢 Low | Phase 2 |
| **Progressive Onboarding** | ❌ Not covered | ❌ Feature tips over time | 🟢 Low | Phase 4 |
| **Celebration Moments** | ❌ Not covered | ❌ Milestone celebrations | 🟢 Low | Phase 4 |

**Legend:**
- ✅ Fully covered
- ⚠️ Partially covered
- ❌ Not covered
- 🔴 High priority
- 🟡 Medium priority
- 🟢 Low priority

### 12.3 Priority Enhancements

**Must-Have (Phase 1-2):**
1. **Onboarding Flow** - 60-second setup
2. **Open-to-Context** - Resume last attempt
3. **Share Sheet Integration** - Create task from share
4. **Rich Notifications** - Inline actions, bundling
5. **Empty States** - Helpful CTAs

**Should-Have (Phase 3):**
6. **Widgets** - Resume, Quick Capture, My Tasks
7. **Smart Drafts** - Context-aware suggestions
8. **Voice Capture** - Voice-to-task
9. **Personalization** - Learn preferences
10. **Measurement** - Engagement metrics, funnels

**Nice-to-Have (Phase 4):**
11. **Dynamic Shortcuts** - Long-press shortcuts
12. **Autonomy** - Draft-only, scheduled windows
13. **Animations** - Micro-animations, confetti
14. **Progressive Onboarding** - Feature tips
15. **Celebration Moments** - Milestones

---

## 13. Implementation Roadmap

### 13.1 Updated Phase Plan

**Phase 1: Foundation (Weeks 1-2)**
- ✅ Setup Capacitor (Android)
- ✅ Configure mobile breakpoints
- ✅ Create bottom navigation component
- ✅ Create bottom sheet component
- ✅ Setup gesture library
- ✅ Mobile theme
- ✅ Safe area handling
- **➕ NEW: 60-second onboarding flow**
- **➕ NEW: Empty states with CTAs**

**Phase 2: Core Views (Weeks 3-5)**
- ✅ Kanban mobile view
- ✅ Chat mobile view
- ✅ Diffs mobile view
- ✅ Preview mobile view
- **➕ NEW: Open-to-context routing**
- **➕ NEW: Share sheet integration**
- **➕ NEW: Semantic haptic patterns**

**Phase 3: Advanced Features (Weeks 6-8)**
- ✅ Camera integration
- ✅ Push notifications setup
- ✅ Haptic feedback
- ✅ Share target
- ✅ Offline support
- ✅ Performance optimization
- **➕ NEW: Rich notification actions (RemoteInput, bundling)**
- **➕ NEW: Android widgets (Resume, Quick Capture, My Tasks)**
- **➕ NEW: Smart follow-up drafts**
- **➕ NEW: Voice-to-task capture**
- **➕ NEW: Personalization engine**
- **➕ NEW: Engagement metrics & funnels**

**Phase 4: Polish & Testing (Weeks 9-10)**
- ✅ All transitions smooth
- ✅ Haptics refined
- ✅ Dark mode optimized
- ✅ Landscape orientation
- ✅ User testing
- ✅ Bug fixes
- ✅ Performance profiling
- ✅ Accessibility audit
- **➕ NEW: Dynamic app shortcuts**
- **➕ NEW: Quick settings tile**
- **➕ NEW: Draft-only autonomy**
- **➕ NEW: Micro-animations & confetti**
- **➕ NEW: Progressive onboarding tips**
- **➕ NEW: Celebration moments**

### 13.2 Feature Flags

**New Feature Flags:**

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

### 13.3 Success Criteria Updates

**Original Success Criteria:**
- ✅ 100% feature parity with desktop
- ✅ Native feel (like ChatGPT mobile)
- ✅ Offline support for core features
- ✅ Touch optimized (all 44x44px minimum)
- ✅ Bundle: <500KB gzipped
- ✅ Load: <1.5s first paint (3G)
- ✅ FPS: 60fps (gestures/animations)
- ✅ Lighthouse: >90 mobile score

**New Success Criteria (Engagement):**
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

## 14. Risks & Mitigations

### 14.1 Technical Risks

**Battery Drain:**
- **Risk:** Background sync, notifications, widgets drain battery
- **Mitigation:** Use WorkManager with constraints, batch sync, respect battery saver mode
- **Monitoring:** Track battery usage in analytics

**Background Limits:**
- **Risk:** Android kills background processes, breaks autonomy
- **Mitigation:** Use foreground service for active attempts, push notifications for triggers
- **Monitoring:** Track process kill rate

**Notification Fatigue:**
- **Risk:** Too many notifications annoy users, get disabled
- **Mitigation:** Rate limits, bundling, quiet hours, digest mode, granular controls
- **Monitoring:** Track notification disable rate, CTR

**Privacy Concerns:**
- **Risk:** Users worry about data collection, autonomy
- **Mitigation:** Transparent privacy policy, opt-in analytics, local-first storage
- **Monitoring:** Track opt-in rates, privacy settings usage

### 14.2 UX Risks

**Complexity Creep:**
- **Risk:** Too many features overwhelm users
- **Mitigation:** Progressive disclosure, simple defaults, feature flags
- **Monitoring:** Track feature adoption, confusion signals

**Autonomy Overreach:**
- **Risk:** Devin does too much, users lose control
- **Mitigation:** Draft-only by default, explicit approval for merges, easy disable
- **Monitoring:** Track autonomy usage, revert rate

**Onboarding Drop-off:**
- **Risk:** Users abandon during onboarding
- **Mitigation:** 60-second flow, skip options, progressive onboarding
- **Monitoring:** Track onboarding funnel, completion rate

### 14.3 Product Risks

**Scope Creep:**
- **Risk:** Adding too many features delays launch
- **Mitigation:** Stick to 10-week plan, use feature flags for gradual rollout
- **Monitoring:** Track velocity, cut low-priority features if needed

**Platform Fragmentation:**
- **Risk:** Android-only limits audience
- **Mitigation:** Plan iOS for Phase 5, ensure web fallback works
- **Monitoring:** Track platform requests from users

---

## 15. Next Steps

### 15.1 Immediate Actions

1. **Review & Approve** this spec with stakeholders
2. **Update GitHub Issue #113** with enhancement checklist
3. **Update existing specs** with engagement deltas
4. **Create feature flag plan** for gradual rollout
5. **Set up analytics** for engagement metrics
6. **Design mockups** for new surfaces (widgets, notifications, onboarding)

### 15.2 Phase 1 Additions

- Implement 60-second onboarding flow
- Add empty states with helpful CTAs
- Set up engagement event tracking
- Create onboarding completion funnel

### 15.3 Phase 3 Priorities

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
**Next:** Update GitHub issue #113 and existing specs
