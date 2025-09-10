# /forge - Execute Wish via Forge Task Creation

---
description: 🎯 Analyze wish, generate task breakdown plan, get user approval, then execute via forge-master agent
---

## 🚀 FORGE EXECUTION WORKFLOW

<task_breakdown>
1. [Discovery] Rapid wish analysis and logical grouping
2. [Planning] User approval workflow for task breakdown
3. [Creation] Parallel agent deployment via forge-master
</task_breakdown>

### Phase 1: Wish Analysis & Planning (You Handle This)

<context_gathering>
Goal: Rapidly analyze wish and generate logical task breakdown

Method:
- Read and parse wish specification
- Group related work for single agents
- Map dependencies clearly
- Present concise plan for approval

Early stop criteria:
- 3-5 logical groups identified
- Dependencies clear
- Ready for user approval
</context_gathering>

**1.1 Wish Analysis**
You directly:
- Read the wish file
- Validate status is APPROVED  
- Parse task groups and dependencies
- Identify logical agent groupings

**1.2 Generate Breakdown Plan**
Create concise plan with:
- Single agent per logical group (A1+A2+A3 handled together)
- Clear group descriptions
- Dependency chain
- Complexity estimates

**1.3 Present for Approval**
Show user:

Feature: [name]
Strategy: One agent per logical group

Group A (Foundation): Agent handles A1+A2 together
  - Transform OmniModal to NiceModal pattern
  - Update OmniCard state management

Group B (Integration): Agent handles B1+B2 together  
  - Register modal in main.tsx
  - Export from dialogs index

Group C (Validation): Agent handles all testing
  - Add typed helper
  - Run linting/typecheck validation

Dependencies: A → B → C
Estimated: 3 agents, ~45min total

❓ Approve this breakdown? (y/n)

### Phase 2: Task Creation (Post-Approval Only)

<persistence>
Only after user approves the breakdown plan, proceed with forge-master agent deployment
Complete task creation before ending turn
Document each task creation decision
</persistence>

**2.1 Call forge-master with Approved Plan**

Only after user approves, call forge-master with:

## Mission
Create Forge tasks for approved plan with minimal context fragmentation.

## Approved Plan
[Copy the exact approved breakdown here]

## Project Configuration  
- Project ID: 9ac59f5a-2d01-4800-83cd-491f638d2f38
- Repository: automagik-forge
- Feature: [name]

## Task Creation Rules

<task_creation_rules>
- ONE task per approved group (not multiple subtasks)
- Group everything a single agent should handle together
- Concise descriptions with essential framework patterns only
- Branch: {type}/{feature}-{group}
- Title: {type}: {group-description}
</task_creation_rules>

## Expected Output
Create exactly [N] tasks matching approved groups. No extra tasks, no fragmentation.

Group A → Task ID + Branch
Group B → Task ID + Branch  
Group C → Task ID + Branch

Done.

### Phase 3: Execution Ready

<success_criteria>
✅ User approved breakdown plan
✅ Exactly one task created per logical group
✅ Clear dependency chain established
✅ Tasks executable by single agents
✅ No context fragmentation
✅ All tasks confirmed with IDs and branches
</success_criteria>

**3.1 Final Status Report**

Feature: {feature-name}
Tasks Created: {N} tasks (one per group)

✅ Group A: task-id-xxx (branch: refactor/omni-modal-foundation)
✅ Group B: task-id-yyy (branch: feat/omni-modal-integration)  
✅ Group C: task-id-zzz (branch: test/omni-modal-validation)

All tasks ready for agent execution in dependency order.

## 🔧 Command Usage

/forge [wish-file-path]

Example:
/forge /genie/wishes/omni-modal-migration.md

## 📊 Success Flow

<task_breakdown>
1. [Analysis] Parse wish, generate logical groupings  
2. [Approval] Present plan, wait for user confirmation
3. [Creation] Call forge-master to create exactly N tasks (one per group)
4. [Execution] Tasks ready for agent processing in dependency order
</task_breakdown>

<never_do>
❌ Create tasks without user approval
❌ Fragment single agent work across multiple tasks
❌ Use verbose descriptions or unnecessary context
❌ Create more tasks than approved groups
❌ Skip dependency mapping
</never_do>

## 🚨 Branch Naming

Format: {type}/{feature}-{group}
Examples: 
  - refactor/omni-modal-foundation
  - feat/omni-modal-integration  
  - test/omni-modal-validation