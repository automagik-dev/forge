# PostHog Analytics Dashboards - Implementation Guide

**Issue:** #75
**Status:** ✅ Frontend Implementation Complete
**Privacy:** ✅ Zero Personal Data Collected

---

## 📊 Dashboard Configuration Guide

This document provides step-by-step instructions for creating 5 PostHog dashboards to analyze Automagik Forge usage patterns.

---

## Dashboard 1: Product Health

**Purpose:** Daily check-in on core metrics
**Access:** PostHog → Dashboards → "+ New Dashboard" → "Product Health"

### Widgets to Create:

#### 1. Daily Active Users (DAU)
- **Type:** Insight → Trends
- **Event:** `session_started`
- **Aggregation:** Unique users
- **Time Range:** Last 30 days
- **Visualization:** Line chart
- **Goal:** Monitor user engagement trends

#### 2. Session Duration (Average)
- **Type:** Insight → Trends
- **Event:** `session_ended`
- **Property:** `session_duration_seconds`
- **Aggregation:** Average
- **Time Range:** Last 30 days
- **Visualization:** Line chart with smoothing

#### 3. Concurrent Users (Real-time)
- **Type:** Insight → Trends
- **Event:** `$heartbeat`
- **Aggregation:** Unique users (last 5 minutes)
- **Time Range:** Last 24 hours
- **Visualization:** Number with trend indicator
- **Refresh:** Auto-refresh every 30s

#### 4. Page Navigation Flow
- **Type:** Insight → User Paths
- **Start Event:** `session_started`
- **Path Events:** `page_visited`
- **Visualization:** Sankey diagram
- **Insight:** Understand user navigation patterns

#### 5. Events Per Session
- **Type:** Insight → Trends
- **Event:** `session_ended`
- **Property:** `events_captured_count`
- **Aggregation:** Average
- **Visualization:** Number + trend

---

## Dashboard 2: Feature Adoption

**Purpose:** What features are users actually using?

### Widgets to Create:

#### 1. Dev Server Usage Rate
- **Type:** Insight → Trends
- **Event:** `dev_server_started`
- **Aggregation:** Unique users (% of DAU)
- **Time Range:** Last 30 days
- **Visualization:** Line chart with % axis
- **Insight:** Track the "lovable" feature adoption

#### 2. Dev Server First-Time Users
- **Type:** Insight → Trends
- **Event:** `dev_server_started`
- **Filter:** `is_first_use = true`
- **Aggregation:** Count
- **Visualization:** Bar chart (weekly)

#### 3. View Mode Distribution
- **Type:** Insight → Trends
- **Event:** `view_mode_switched`
- **Breakdown:** `to_mode` property
- **Aggregation:** Count
- **Visualization:** Pie chart or stacked bar
- **Insight:** Which view modes are most popular?

#### 4. View Mode Triggers
- **Type:** Insight → Trends
- **Event:** `view_mode_switched`
- **Breakdown:** `trigger` property (keyboard_shortcut, ui_button, url_param)
- **Visualization:** Stacked bar chart
- **Insight:** How do users discover view modes?

#### 5. Kanban Adoption
- **Type:** Insight → Funnel
- **Steps:**
  1. `session_started`
  2. `page_visited` (page = "tasks")
  3. `kanban_task_dragged`
- **Visualization:** Funnel with conversion %
- **Insight:** What % of users actively use Kanban?

---

## Dashboard 3: User Segmentation

**Purpose:** Identify power users vs casual users

### Create User Cohorts First:

#### Cohort: Power Users
- **Criteria:**
  - Performed `keyboard_shortcut_used` at least 5 times (last 30 days)
  - Performed `dev_server_started` at least 1 time (last 30 days)
  - `session_started` count > 10 (last 30 days)

#### Cohort: Regular Users
- **Criteria:**
  - `session_started` count 3-10 (last 30 days)
  - NOT in Power Users cohort

#### Cohort: Casual Users
- **Criteria:**
  - `session_started` count 1-2 (last 30 days)

### Widgets:

#### 1. User Distribution
- **Type:** Insight → Trends
- **Cohorts:** Power, Regular, Casual
- **Aggregation:** Unique users
- **Visualization:** Pie chart

#### 2. Feature Adoption by Segment
- **Type:** Insight → Table
- **Rows:** User cohorts
- **Columns:** Feature events (dev_server_started, view_mode_switched, kanban_task_dragged, keyboard_shortcut_used)
- **Values:** % of segment that used feature

#### 3. Retention by Segment
- **Type:** Retention Table
- **Start Event:** `session_started`
- **Return Event:** `session_started`
- **Cohorts:** Power, Regular, Casual
- **Time Range:** 8 weeks
- **Insight:** Which segment has best retention?

#### 4. Keyboard Shortcuts by Segment
- **Type:** Insight → Trends
- **Event:** `keyboard_shortcut_used`
- **Breakdown:** `shortcut` property
- **Filter:** Only Power Users cohort
- **Visualization:** Bar chart
- **Insight:** What shortcuts do power users rely on?

---

## Dashboard 4: User Flow & Navigation

**Purpose:** Understand how users navigate the app

### Widgets:

#### 1. Entry Points
- **Type:** Insight → Trends
- **Event:** `page_visited`
- **Filter:** `time_on_previous_page_seconds = null` (first page)
- **Breakdown:** `page` property
- **Visualization:** Pie chart
- **Insight:** Where do users start?

#### 2. Navigation Methods
- **Type:** Insight → Trends
- **Event:** `page_visited`
- **Breakdown:** `navigation_method` property
- **Visualization:** Stacked bar chart
- **Insight:** Are users using sidebar, breadcrumbs, or direct URLs?

#### 3. Time Spent Per Page
- **Type:** Insight → Trends
- **Event:** `page_visited`
- **Property:** `time_on_previous_page_seconds`
- **Breakdown:** `page` property
- **Aggregation:** Average
- **Visualization:** Bar chart
- **Insight:** Which pages are most engaging?

#### 4. User Journey Paths
- **Type:** Paths
- **Start:** `session_started`
- **Path Events:** `page_visited`, `view_mode_switched`
- **Max Steps:** 8
- **Visualization:** Sankey diagram
- **Insight:** Common user flows

---

## Dashboard 5: Keyboard Shortcuts & Power Features

**Purpose:** Measure power user feature adoption

### Widgets:

#### 1. Most Used Shortcuts
- **Type:** Insight → Trends
- **Event:** `keyboard_shortcut_used`
- **Breakdown:** `shortcut` property
- **Aggregation:** Count
- **Visualization:** Bar chart (horizontal)
- **Sort:** Descending by count

#### 2. First-Time Shortcut Discovery
- **Type:** Insight → Trends
- **Event:** `keyboard_shortcut_used`
- **Filter:** `is_first_use = true`
- **Breakdown:** `shortcut` property
- **Time Range:** Last 30 days
- **Visualization:** Line chart
- **Insight:** How quickly do users discover shortcuts?

#### 3. Shortcut Usage by Context
- **Type:** Insight → Trends
- **Event:** `keyboard_shortcut_used`
- **Breakdown:** `context` property
- **Visualization:** Stacked bar chart
- **Insight:** Where are shortcuts being used?

#### 4. Dev Server → Task Success Correlation
- **Type:** Insight → Trends
- **Event:** `dev_server_started`
- **Time Range:** Last 7 days
- **Breakdown:** `task_has_failed_before` property
- **Visualization:** Stacked bar
- **Insight:** Are users using dev server after failures?

---

## 🎯 Key Insights to Extract

### Week 1 Questions:
1. **What % of users are using dev server preview?** (Dashboard 2, Widget 1)
2. **Which view mode is most popular?** (Dashboard 2, Widget 3)
3. **What % of users drag tasks in Kanban?** (Dashboard 2, Widget 5)
4. **Are keyboard shortcuts being discovered?** (Dashboard 5, Widget 2)

### Week 2-4 Questions:
5. **What % of users are Power Users?** (Dashboard 3, Widget 1)
6. **Do Power Users have better retention?** (Dashboard 3, Widget 3)
7. **What's the most common user journey?** (Dashboard 4, Widget 4)
8. **Which features correlate with retention?** (Cross-dashboard analysis)

---

## 🔒 Privacy Compliance Checklist

Before launching dashboards, verify:

- [ ] No `project_name`, `task_title`, or `file_path` properties in any event
- [ ] All `task_id`, `attempt_id`, `project_id` are UUIDs (not human-readable)
- [ ] No error messages containing user code or paths
- [ ] All events use aggregate metrics (counts, averages, booleans)
- [ ] Privacy policy updated to list tracked events

**Test:** Go to PostHog → Live Events → Click any event → Verify no personal data visible

---

## 📈 Success Metrics (30 Days Post-Launch)

**Data Quality:**
- ✅ 90%+ of sessions have at least 1 tracked event (beyond auto-events)
- ✅ 0 privacy violations reported
- ✅ All 5 dashboards loading without errors

**Actionable Insights:**
- ✅ Identify top 3 most-used features (by unique user %)
- ✅ Identify bottom 20% of features (<5% adoption)
- ✅ Segment users into Power/Regular/Casual with confidence
- ✅ Measure keyboard shortcut discovery rate

**Product Decisions:**
- ✅ Deprecate or improve 1 low-usage feature
- ✅ Double down on 1 high-usage feature (e.g., dev server)
- ✅ Improve onboarding for features with <20% discovery rate

---

## 🚀 Quick Start Checklist

**Day 1: Create Dashboards 1 & 2**
- [ ] Create "Product Health" dashboard with 5 widgets
- [ ] Create "Feature Adoption" dashboard with 5 widgets
- [ ] Generate synthetic events to test visualizations

**Day 2: Create Dashboard 3 (Segmentation)**
- [ ] Create Power Users cohort
- [ ] Create Regular Users cohort
- [ ] Create Casual Users cohort
- [ ] Create "User Segmentation" dashboard with 4 widgets

**Day 3: Create Dashboards 4 & 5**
- [ ] Create "User Flow" dashboard with 4 widgets
- [ ] Create "Keyboard Shortcuts" dashboard with 4 widgets
- [ ] Test all dashboards with real user data

**Day 4: Share & Monitor**
- [ ] Share dashboard links with product team
- [ ] Set up Slack notifications for key metrics
- [ ] Schedule weekly dashboard review meeting

---

## 📚 PostHog Documentation References

- **Creating Dashboards:** https://posthog.com/docs/product-analytics/dashboards
- **User Paths:** https://posthog.com/docs/product-analytics/paths
- **Retention Analysis:** https://posthog.com/docs/product-analytics/retention
- **Cohorts:** https://posthog.com/docs/product-analytics/cohorts
- **Funnels:** https://posthog.com/docs/product-analytics/funnels

---

## 🔄 Maintenance

**Weekly:**
- Review DAU/WAU trends (Dashboard 1)
- Check for new feature adoption patterns (Dashboard 2)

**Monthly:**
- Update user cohorts (recalculate Power/Regular/Casual)
- Review retention metrics (Dashboard 3)
- Identify underused features for improvement/deprecation

**Quarterly:**
- Deep dive into user journey paths (Dashboard 4)
- Correlate feature usage with retention
- Plan feature prioritization based on data
