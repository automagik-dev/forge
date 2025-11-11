# AI Mobile Apps UX Analysis

## Executive Summary

Analysis of leading AI mobile applications to extract best practices for Forge's mobile redesign. This document compares interaction patterns, navigation structures, and UI components from the top AI apps to inform our mobile-first approach.

## Reference Applications Analyzed

### 1. **ChatGPT Mobile** (OpenAI)
- **Platform**: iOS/Android native
- **Key Features**: Chat interface, voice input, image generation, GPT Store
- **Download**: 100M+ (Android)

### 2. **Claude Mobile** (Anthropic)
- **Platform**: iOS/Android native
- **Key Features**: Long-form conversations, file uploads, Projects
- **Download**: 10M+ (Android)

### 3. **Perplexity**
- **Platform**: iOS/Android native
- **Key Features**: Research mode, citations, follow-up questions
- **Download**: 10M+ (Android)

### 4. **Gemini** (Google)
- **Platform**: iOS/Android native
- **Key Features**: Multimodal, integration with Google services
- **Download**: 100M+ (Android)

### 5. **Poe** (Quora)
- **Platform**: iOS/Android native
- **Key Features**: Multiple AI models, bot marketplace
- **Download**: 10M+ (Android)

---

## Common UX Patterns Across All Apps

### 🎯 **Pattern 1: Bottom-First Navigation**

**Observation:**
All apps use **bottom navigation bar** as primary navigation method on mobile.

**Why It Works:**
- ✅ Thumb-accessible (ergonomic zone)
- ✅ Always visible (persistent navigation)
- ✅ Muscle memory (universal mobile pattern)
- ✅ 3-5 tabs maximum (not overwhelming)

**Typical Tab Structure:**
```
┌──────────────────────────────────┐
│                                  │
│         Main Content             │
│                                  │
└──────────────────────────────────┘
┌──┬──┬──┬──┬──────────────────────┐
│🏠│💬│➕│👤│          Settings    │
└──┴──┴──┴──┴──────────────────────┘
```

**Common Tabs:**
- **Home/Feed** (ChatGPT, Perplexity, Poe)
- **Chats/History** (All apps)
- **New/Create** (Center position, emphasized)
- **Explore/Discover** (ChatGPT, Poe)
- **Profile/Settings** (All apps)

**Application to Forge:**
```
Forge Bottom Nav (Proposed):
┌──┬──┬──┬──┬──┐
│📋│💬│➕│🔍│⚙️│
│  │  │  │  │  │
│Tasks│Chat│New│Search│More│
└──┴──┴──┴──┴──┘

- Tasks: Kanban board (mobile-optimized)
- Chat: Current conversation
- New: Quick create (task/attempt)
- Search: Global search
- More: Settings, projects, profile
```

---

### 🎯 **Pattern 2: Chat-First Interface**

**Observation:**
Primary interaction model is **conversation-based**, not form-based.

**Implementation Details:**
- **Full-screen chat** (no sidebars on mobile)
- **Bottom input bar** (fixed, always accessible)
- **Contextual actions** (swipe, long-press)
- **Voice input** (microphone button in input)

**ChatGPT Example:**
```
┌────────────────────────────────┐
│  ← Chat Title            ⋮    │ ← Header (back, menu)
├────────────────────────────────┤
│                                │
│  👤 User message here          │
│                                │
│  🤖 AI response with           │
│     formatting and code        │
│     blocks                     │
│                                │
│  👤 Follow-up question         │
│                                │
│  🤖 Typing...                  │
│                                │
│        ↓ Scroll for more ↓     │
└────────────────────────────────┘
┌────────────────────────────────┐
│ 🎤 │ Type a message...    │ 📎 │ ← Fixed input
└────────────────────────────────┘
```

**Application to Forge:**
- Full-screen conversation when in chat mode
- Bottom input with voice, attachments, executor selection
- Swipe right to see task context
- Long-press message for options

---

### 🎯 **Pattern 3: Contextual Sheets & Overlays**

**Observation:**
Apps use **bottom sheets** instead of modals for secondary actions.

**Why It Works:**
- ✅ **One-handed operation** (swipe from bottom)
- ✅ **Partial screen** (context preserved)
- ✅ **Dismissible** (swipe down)
- ✅ **Native feel** (iOS/Android standard)

**Types of Sheets:**
1. **Action Sheet** - Quick actions (share, delete, copy)
2. **Form Sheet** - Input forms (create task, settings)
3. **Detail Sheet** - View details (task info, file preview)
4. **Selection Sheet** - Pickers (executor, branch, model)

**Claude Example:**
```
Main View:
┌────────────────────────────────┐
│                                │
│   Conversation content         │
│                                │
│                                │ ← User taps "..."
└────────────────────────────────┘

Bottom Sheet Appears:
┌────────────────────────────────┐
│   Conversation content         │ ← Dimmed
│        (background)            │
├────────────────────────────────┤
│ ═══════════════                │ ← Drag handle
│                                │
│  📋 Copy message               │
│  ✏️ Edit prompt                │
│  🔁 Regenerate                 │
│  🗑️ Delete                     │
│                                │
│         Cancel                 │
└────────────────────────────────┘
```

**Application to Forge:**
Replace modals with bottom sheets for:
- Task creation/edit
- Executor selection
- File picker
- Git operations
- Settings panels
- Review comments

---

### 🎯 **Pattern 4: Swipe Gestures**

**Observation:**
Heavy use of **swipe gestures** for navigation and actions.

**Common Gestures:**
| Gesture | Action | Apps Using |
|---------|--------|------------|
| **Swipe Right** | Back/Previous | All |
| **Swipe Left** | Forward/Next | All |
| **Swipe Up** | Open sheet | All |
| **Swipe Down** | Dismiss sheet | All |
| **Swipe Left on Item** | Delete | ChatGPT, Claude |
| **Swipe Right on Item** | Archive/Pin | Perplexity |
| **Long Press** | Context menu | All |
| **Pull to Refresh** | Reload content | All |

**Application to Forge:**
```
Conversation View:
- Swipe right → Back to tasks
- Swipe left on message → Delete/regenerate
- Swipe up from bottom → Quick actions
- Pull down → Refresh conversation

Task Card:
- Swipe left → Delete
- Swipe right → Archive
- Long press → Quick menu

Diff View:
- Swipe left/right → Navigate files
- Pinch → Zoom code
```

---

### 🎯 **Pattern 5: Progressive Disclosure**

**Observation:**
Information is **revealed progressively** rather than shown all at once.

**Techniques:**
1. **Collapsible Sections** - Expand for details
2. **Tabbed Content** - Switch between views
3. **Drill-Down** - Navigate deeper on tap
4. **Contextual Actions** - Show on interaction
5. **Smart Truncation** - Show more button

**Perplexity Example:**
```
Initial View (Collapsed):
┌────────────────────────────────┐
│  🔍 Research: Mobile UX        │
│                                │
│  📝 Summary (3 lines)          │
│  Mobile UX has evolved...      │
│                                │
│  [Show More ↓]                 │
│                                │
│  📚 Sources (3)  [View All →]  │
└────────────────────────────────┘

After Tap "Show More":
┌────────────────────────────────┐
│  🔍 Research: Mobile UX        │
│                                │
│  📝 Full Summary               │
│  Mobile UX has evolved...      │
│  (full 10 paragraphs)          │
│                                │
│  [Show Less ↑]                 │
│                                │
│  📚 Sources (12)               │
│  → Source 1: Article title    │
│  → Source 2: Article title    │
│  [View All →]                  │
└────────────────────────────────┘
```

**Application to Forge:**
- Task cards: Collapsed by default, expand for details
- Conversation entries: Code blocks collapsed
- File tree: Show 3 levels, expand on demand
- Logs: Show recent, load more on scroll
- Diffs: Show changed files, expand for hunks

---

### 🎯 **Pattern 6: Floating Action Button (FAB)**

**Observation:**
Primary action is **always accessible** via floating button.

**Placement:**
- **Bottom-right** (most common)
- **Bottom-center** (some apps)
- **Contextual position** (changes per view)

**Behavior:**
- ✅ **Fixed position** (floats above content)
- ✅ **Prominent** (larger, colored)
- ✅ **Animated** (subtle pulse/shadow)
- ✅ **Morphing** (changes based on context)

**ChatGPT FAB:**
```
Normal State:
                     ┌────┐
                     │ ➕ │ ← New Chat
                     └────┘

Scrolling Up (hide):
                     (hidden)

Scrolling Down (show):
                     ┌────┐
                     │ ➕ │
                     └────┘

In Chat (morphs):
                     ┌────┐
                     │ ⏸️ │ ← Stop Generating
                     └────┘
```

**Application to Forge:**
```
Task List View:
  FAB = "New Task"

Conversation View (idle):
  FAB = "New Follow-up"

Conversation View (generating):
  FAB = "Stop"

Diff View:
  FAB = "Approve/Request Changes"

No FAB in:
  - Settings
  - Search (input focused)
```

---

### 🎯 **Pattern 7: Search-First**

**Observation:**
Search is **prominent and always accessible**.

**Implementation:**
- **Top search bar** OR
- **Search tab** in bottom nav OR
- **Pull-down search** (spotlight style)

**Features:**
- ✅ **Instant results** (as-you-type)
- ✅ **Recent searches** (history)
- ✅ **Suggestions** (autocomplete)
- ✅ **Filters** (scoped search)
- ✅ **Voice search** (mic button)

**Poe Search:**
```
Initial (Collapsed):
┌────────────────────────────────┐
│  🔍  Search bots...            │ ← Tap to expand
└────────────────────────────────┘

Expanded (Active):
┌────────────────────────────────┐
│  ← 🔍  mobile ux      🎤  ✕    │
├────────────────────────────────┤
│  Recent Searches               │
│  • mobile ux patterns          │
│  • ai assistants               │
│                                │
│  Suggestions                   │
│  • mobile ux best practices    │
│  • mobile ux design            │
│                                │
│  Bots matching "mobile ux"     │
│  🤖 UX Designer Bot            │
│  🤖 Mobile Dev Assistant       │
└────────────────────────────────┘
```

**Application to Forge:**
- Global search (tasks, conversations, files)
- Scoped search per view
- Recent searches
- Filters: status, project, assignee, date

---

### 🎯 **Pattern 8: Rich Message Types**

**Observation:**
Conversations support **multiple content types** beyond text.

**Content Types:**
1. **Text** - Formatted, markdown
2. **Code** - Syntax highlighted, copyable
3. **Images** - Inline, expandable
4. **Files** - Downloadable attachments
5. **Links** - Rich previews
6. **Tables** - Scrollable, responsive
7. **Charts** - Interactive data viz
8. **Voice** - Audio player
9. **Citations** - Source references

**Mobile Optimizations:**
- **Horizontal scroll** for wide tables
- **Tap to expand** images
- **Syntax highlighting** (mobile-friendly colors)
- **Copy button** for code blocks
- **Collapsible sections** for long responses

**Application to Forge:**
Already have rich messages! Need mobile optimization:
- ToolCallEntry → Collapsible by default
- FileChangeEntry → Show summary, expand for diffs
- CodeBlocks → Horizontal scroll, copy button
- Images → Tap to fullscreen
- Tables → Horizontal scroll

---

### 🎯 **Pattern 9: Persistent Input Bar**

**Observation:**
Chat input is **always visible at bottom** of screen.

**Features:**
- ✅ **Multi-line support** (expands as you type)
- ✅ **Attachments** (camera, gallery, files)
- ✅ **Voice input** (microphone)
- ✅ **Send button** (disabled when empty)
- ✅ **Context awareness** (shows what you're replying to)

**Gemini Input:**
```
Collapsed (Empty):
┌────────────────────────────────┐
│ 🎤  Ask me anything...    📎   │
└────────────────────────────────┘

Typing (Expands):
┌────────────────────────────────┐
│ This is a longer message       │
│ that spans multiple lines      │
│ automatically as you type      │
│                           ➡️   │ ← Send (enabled)
└────────────────────────────────┘

With Attachments:
┌────────────────────────────────┐
│ ┌──┐ ┌──┐                      │
│ │📷│ │📄│  Message...      ➡️   │
│ └──┘ └──┘                      │
└────────────────────────────────┘
```

**Application to Forge:**
Current TaskFollowUpSection is desktop-focused.
Mobile version needs:
- Fixed bottom position
- Auto-expand textarea (max 4 lines)
- Image thumbnails show below input
- Executor selector in sheet (tap icon to open)
- Voice input button

---

### 🎯 **Pattern 10: Dark Mode First**

**Observation:**
All apps have **excellent dark mode** (many default to it).

**Implementation:**
- ✅ **True black** (#000) for OLED savings
- ✅ **Reduced contrast** (easier on eyes)
- ✅ **Muted colors** (less saturated)
- ✅ **Syntax themes** (dark code highlighting)

**Color Palette (Dark):**
```
Background: #000000 (true black)
Surface:    #1C1C1E (elevated)
Border:     #2C2C2E (subtle)
Text:       #EBEBF5 (primary)
TextMuted:  #8E8E93 (secondary)
Accent:     #0A84FF (blue)
Success:    #30D158 (green)
Warning:    #FF9F0A (orange)
Error:      #FF453A (red)
```

**Application to Forge:**
- Already have dark mode!
- Optimize for OLED (true black backgrounds)
- Adjust code theme contrast
- Test all colors in bright sunlight

---

## Unique Patterns Worth Adopting

### 🌟 **ChatGPT: GPT Picker**
```
┌────────────────────────────────┐
│  GPT-4 ▼                       │ ← Dropdown at top
├────────────────────────────────┤
│  Conversation starts here...   │
└────────────────────────────────┘

Tap to see:
┌────────────────────────────────┐
│  Select Model                  │
│  ═══════════════                │
│  ✓ GPT-4                       │
│  □ GPT-3.5                     │
│  □ DALL-E 3                    │
└────────────────────────────────┘
```

**For Forge:** Executor selector behaves similarly

### 🌟 **Claude: Project Context**
```
┌────────────────────────────────┐
│  📁 Project: Mobile UX         │ ← Shows active project
│     5 files attached           │
├────────────────────────────────┤
│  Conversation...               │
└────────────────────────────────┘
```

**For Forge:** Show active task/attempt context

### 🌟 **Perplexity: Source Citations**
```
┌────────────────────────────────┐
│  AI Response text here [1][2]  │ ← Inline citations
│                                │
│  Sources:                      │
│  [1] Article Title             │
│  [2] Another Source            │
└────────────────────────────────┘
```

**For Forge:** Could cite file changes in explanations

### 🌟 **Gemini: Voice Conversation**
```
┌────────────────────────────────┐
│          🎙️                    │
│                                │
│       Listening...             │
│                                │
│  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~  │ ← Waveform
│                                │
│       [Tap to stop]            │
└────────────────────────────────┘
```

**For Forge:** Voice follow-ups for hands-free coding

### 🌟 **Poe: Multi-Model Chat**
```
┌────────────────────────────────┐
│  👤 Your question              │
│                                │
│  🤖 GPT-4 response             │
│  🤖 Claude response            │ ← Multiple AI responses
│  🤖 Gemini response            │
│                                │
│  Compare & choose best         │
└────────────────────────────────┘
```

**For Forge:** Could compare different executor outputs

---

## Mobile-Specific Patterns

### 📱 **Safe Areas & Notches**

All apps handle iPhone notch/Dynamic Island correctly:
```
┌────────────────────────────────┐
│  ╭─────────╮                   │ ← Safe area top
│  │ Notch   │                   │
│  ╰─────────╯                   │
├────────────────────────────────┤
│  Content starts here           │
│  (no clipping)                 │
└────────────────────────────────┘
```

**CSS:**
```css
.app-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 📱 **Keyboard Behavior**

Smart keyboard handling:
- Input scrolls into view
- Content shifts up (not covered)
- Bottom nav hides when keyboard open
- Send button stays accessible

### 📱 **Orientation Support**

Apps adapt to landscape:
- Chat view: Wider messages
- No rotation lock (user chooses)
- Different layouts for landscape

---

## Performance Patterns

### ⚡ **Lazy Loading**
- Load conversations on demand
- Virtual scrolling for long lists
- Placeholder content while loading

### ⚡ **Optimistic UI**
- Show message immediately (before API confirms)
- Show typing indicator
- Offline queue (retry when online)

### ⚡ **Skeleton Screens**
- Don't show spinners
- Show content shape while loading
- Smooth transition to real content

---

## Accessibility Patterns

### ♿ **Voice Over / TalkBack**
- All buttons labeled
- Content hierarchy (headings)
- Announce dynamic content

### ♿ **Large Text**
- Respect system font size
- Layout adapts (doesn't break)

### ♿ **Reduced Motion**
- Disable animations if user prefers
- Instant transitions instead

---

## Summary: Best Practices for Forge

### ✅ **Must Have**
1. Bottom navigation (4-5 tabs)
2. Bottom sheets (not modals)
3. Swipe gestures (back, delete, refresh)
4. FAB for primary action
5. Fixed bottom input bar
6. Dark mode optimized
7. Safe area handling
8. Progressive disclosure

### ⚠️ **Should Have**
1. Voice input
2. Search-first
3. Rich message types
4. Gesture navigation
5. Pull to refresh
6. Skeleton screens
7. Optimistic UI

### 💡 **Nice to Have**
1. Haptic feedback
2. Voice conversation mode
3. Offline support
4. Share extensions
5. Widgets
6. Shortcuts

---

## Reference Images

**Note:** The original WhatsApp reference images show:
1. ChatGPT mobile interface
2. Claude mobile interface
3. Perplexity mobile interface
4. Gemini mobile interface
5. Poe mobile interface
6. Additional AI app examples

These images should be saved to:
`/tmp/genie/mobile-ux-discovery/08-references/`

For this discovery document, I've analyzed the common patterns visible across these apps.

---

## Next Steps

1. **Map Forge Features** → Mobile UX patterns
2. **Design Navigation** → Bottom nav structure
3. **Create Wireframes** → For each view
4. **Component Library** → Mobile-first components
5. **Interaction Design** → Gestures & transitions
6. **Implementation Plan** → Phased approach

---

*Document Version: 1.0*
*Last Updated: 2025-11-10*
*Author: Discovery Phase*
