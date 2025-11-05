# Genie Chat Widgets

Agent orchestration widgets integrated into Kanban board columns.

## Overview

- **Wish** (To Do) - Planner agent widget
- **Forge** (In Progress) - Executor agent widget
- **Review** (In Review) - Validator agent widget

## Backend Integration

Tasks with `status: "agent"` appear in widgets:
- `status = "agent"` AND `agent = "wish"` → Wish widget
- `status = "agent"` AND `agent = "forge"` → Forge widget
- `status = "agent"` AND `agent = "review"` → Review widget

Widget shows running executors count for that agent, including attempts and subtasks.

Clicking widget opens task attempt view (same as regular tasks).

## Files

**Components**: `forge-overrides/frontend/src/components/genie-widgets/`
**State**: `forge-overrides/frontend/src/context/SubGenieContext.tsx`
**Config**: `forge-overrides/frontend/src/config/genie-configs.ts`
**Integration**: `forge-overrides/frontend/src/main.tsx` (SubGenieProvider)
