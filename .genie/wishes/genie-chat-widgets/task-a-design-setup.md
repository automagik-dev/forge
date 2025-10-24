# Task A: Design & Components Setup

**Phase**: 1 of 4
**Agent**: `specialists/implementor`
**Status**: 🔴 Pending
**Created**: 2025-10-23

---

## Overview

This task establishes the foundation for Genie Chat Widgets by:
1. Creating React component structure for column headers and chat widgets
2. Setting up Lucide icon integration
3. Creating component stories (Storybook) for visual testing
4. Establishing TypeScript types for workflows and skills

---

## Discovery

### Context
The Kanban board currently uses generic column names and no AI agent integration. Users need to interact with sub-genie agents (Wishh, Forge, Review) directly from the board.

Reference Files:
- @.genie/wishes/genie-chat-widgets-wish.md (full spec)
- @.genie/wishes/genie-chat-widgets-mockup.md (visual mockup)

### Success Criteria
- [ ] All new components compile without TypeScript errors
- [ ] All components have Storybook stories
- [ ] Component types are properly defined
- [ ] Lucide icons integrate cleanly
- [ ] No breaking changes to existing Kanban board

---

## Implementation Plan

### Step 1: Create Type Definitions
**File**: `frontend-forge/src/components/genie-widgets/types.ts`

```typescript
import { ReactNode } from 'react';

// Workflow definition
export interface WorkflowDefinition {
  id: string;
  label: string;
  description: string;
  icon?: React.ComponentType<any>;
  genieType: 'wishh' | 'forge' | 'review';
  columnStatus: 'todo' | 'inprogress' | 'inreview';
  externalAgent?: string;
}

// Skill definition
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  genieType: 'wishh' | 'forge' | 'review';
  defaultEnabled?: boolean;
}

// Chat message
export interface ChatMessage {
  id: string;
  sender: 'user' | 'wishh' | 'forge' | 'review';
  content: string;
  timestamp: string;
  metadata?: {
    workflowId?: string;
    status?: 'sent' | 'processing' | 'error';
  };
}

// Sub-genie configuration
export interface SubGenieConfig {
  id: 'wishh' | 'forge' | 'review';
  name: string;
  columnStatus: 'todo' | 'inprogress' | 'inreview';
  icon: React.ComponentType<any>;
  color: string; // Tailwind color for UI theming
  workflows: WorkflowDefinition[];
  skills: SkillDefinition[];
}
```

### Step 2: Create Column Header Component
**File**: `frontend-forge/src/components/genie-widgets/ColumnHeader.tsx`

```typescript
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ColumnHeaderProps {
  columnName: 'Wish' | 'Forge' | 'Review';
  icon: LucideIcon;
  taskCount: number;
  isWidgetOpen: boolean;
  onIconClick: () => void;
  onMenuClick?: () => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  columnName,
  icon: IconComponent,
  taskCount,
  isWidgetOpen,
  onIconClick,
  onMenuClick,
}) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={onIconClick}
          className={`p-1.5 rounded-lg transition-all ${
            isWidgetOpen
              ? 'bg-blue-100 text-blue-600'
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          aria-label={`Toggle ${columnName} widget`}
          title={`Click to chat with ${columnName} agent`}
        >
          <IconComponent size={20} />
        </button>
        <span className="font-semibold text-gray-900">{columnName}</span>
        <span className="text-sm text-gray-500">({taskCount})</span>
      </div>
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600"
          aria-label="Column menu"
        >
          ⋮
        </button>
      )}
    </div>
  );
};
```

### Step 3: Create Chat Widget Component
**File**: `frontend-forge/src/components/genie-widgets/SubGenieWidget.tsx`

```typescript
import React, { useState } from 'react';
import { ChatMessage, WorkflowDefinition, SkillDefinition, SubGenieConfig } from './types';
import { WorkflowButton } from './WorkflowButton';
import { SkillToggle } from './SkillToggle';

interface SubGenieWidgetProps {
  config: SubGenieConfig;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onWorkflowClick: (workflowId: string) => void;
  onSkillToggle: (skillId: string, enabled: boolean) => void;
  chatHistory?: ChatMessage[];
  skillsState?: Record<string, boolean>;
  isLoading?: boolean;
}

export const SubGenieWidget: React.FC<SubGenieWidgetProps> = ({
  config,
  isOpen,
  onClose,
  onSendMessage,
  onWorkflowClick,
  onSkillToggle,
  chatHistory = [],
  skillsState = {},
  isLoading = false,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <config.icon size={20} />
          <span className="font-semibold">{config.name}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close widget"
        >
          ✕
        </button>
      </div>

      {/* Chat Display */}
      <div className="flex-1 bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
        {chatHistory.length === 0 ? (
          <p className="text-gray-400 text-sm">No messages yet...</p>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className="mb-2">
              <p className="text-xs text-gray-500 font-semibold">
                {msg.sender === 'user' ? 'You' : config.name}
              </p>
              <p className="text-sm text-gray-800">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Ask ${config.name}...`}
          className="flex-1 p-2 border border-gray-300 rounded text-sm resize-none"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      {/* Workflows */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Workflows</p>
        <div className="flex flex-wrap gap-2">
          {config.workflows.map((workflow) => (
            <WorkflowButton
              key={workflow.id}
              workflow={workflow}
              onClick={() => onWorkflowClick(workflow.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Skills */}
      {config.skills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {config.skills.map((skill) => (
              <SkillToggle
                key={skill.id}
                skill={skill}
                isEnabled={skillsState[skill.id] || skill.defaultEnabled || false}
                onChange={(enabled) => onSkillToggle(skill.id, enabled)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Step 4: Create WorkflowButton Component
**File**: `frontend-forge/src/components/genie-widgets/WorkflowButton.tsx`

```typescript
import React from 'react';
import { WorkflowDefinition } from './types';

interface WorkflowButtonProps {
  workflow: WorkflowDefinition;
  onClick: () => void;
  isLoading?: boolean;
}

export const WorkflowButton: React.FC<WorkflowButtonProps> = ({
  workflow,
  onClick,
  isLoading = false,
}) => {
  const Icon = workflow.icon;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
      title={workflow.description}
    >
      {Icon && <Icon size={16} />}
      <span>{workflow.label}</span>
    </button>
  );
};
```

### Step 5: Create SkillToggle Component
**File**: `frontend-forge/src/components/genie-widgets/SkillToggle.tsx`

```typescript
import React, { useState } from 'react';
import { SkillDefinition } from './types';

interface SkillToggleProps {
  skill: SkillDefinition;
  isEnabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const SkillToggle: React.FC<SkillToggleProps> = ({
  skill,
  isEnabled,
  onChange,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = skill.icon;

  return (
    <div className="relative">
      <button
        onClick={() => onChange(!isEnabled)}
        className={`p-2 rounded-lg transition-all ${
          isEnabled
            ? 'bg-blue-100 text-blue-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={skill.description}
      >
        <Icon size={18} />
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
          {skill.name}
        </div>
      )}
    </div>
  );
};
```

### Step 6: Create Storybook Stories
**File**: `frontend-forge/src/components/genie-widgets/SubGenieWidget.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Sparkles, Hammer, Target, ZapOff, AlertCircle } from 'lucide-react';
import { SubGenieWidget } from './SubGenieWidget';
import { SubGenieConfig } from './types';

const wishConfig: SubGenieConfig = {
  id: 'wishh',
  name: 'Wishh',
  columnStatus: 'todo',
  icon: Sparkles,
  color: 'purple',
  workflows: [
    {
      id: 'refine_spec',
      label: 'Refine Spec',
      description: 'Refine task specification',
      genieType: 'wishh',
      columnStatus: 'todo',
    },
    {
      id: 'analyze_deps',
      label: 'Analyze Dependencies',
      description: 'Identify task dependencies',
      genieType: 'wishh',
      columnStatus: 'todo',
    },
  ],
  skills: [
    {
      id: 'quick_analysis',
      name: 'Quick Analysis',
      description: 'Fast mode (skip deep analysis)',
      icon: ZapOff,
      genieType: 'wishh',
    },
  ],
};

const meta: Meta<typeof SubGenieWidget> = {
  component: SubGenieWidget,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WishOpen: Story = {
  args: {
    config: wishConfig,
    isOpen: true,
    onClose: () => {},
    onSendMessage: (msg) => console.log('Message:', msg),
    onWorkflowClick: (id) => console.log('Workflow:', id),
    onSkillToggle: (id, enabled) => console.log('Skill:', id, enabled),
    chatHistory: [
      {
        id: '1',
        sender: 'user',
        content: 'Can you refine the spec for this task?',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        sender: 'wishh',
        content: 'Of course! I've analyzed the requirements and updated the spec.',
        timestamp: new Date().toISOString(),
      },
    ],
    skillsState: { quick_analysis: false },
  },
};

export const WishClosed: Story = {
  args: {
    ...WishOpen.args,
    isOpen: false,
  },
};

export const WishLoading: Story = {
  args: {
    ...WishOpen.args,
    isLoading: true,
  },
};
```

### Step 7: Create Index/Barrel Export
**File**: `frontend-forge/src/components/genie-widgets/index.ts`

```typescript
export { ColumnHeader } from './ColumnHeader';
export { SubGenieWidget } from './SubGenieWidget';
export { WorkflowButton } from './WorkflowButton';
export { SkillToggle } from './SkillToggle';
export type {
  WorkflowDefinition,
  SkillDefinition,
  ChatMessage,
  SubGenieConfig,
} from './types';
```

---

## Verification

### Commands to Run
```bash
# Type checking
pnpm --filter frontend-forge exec tsc --noEmit

# Linting
pnpm --filter frontend-forge run lint

# Storybook (optional, for visual inspection)
pnpm --filter frontend-forge run storybook
```

### Checklist
- [ ] All TypeScript files compile without errors
- [ ] No ESLint violations
- [ ] All components render in Storybook
- [ ] All props are properly typed
- [ ] No breaking changes to existing code

---

## Evidence Artifacts

Store in `.genie/wishes/genie-chat-widgets/qa/`:
- [ ] TypeScript compilation output (success/failure)
- [ ] Linting report
- [ ] Storybook screenshots (if applicable)
- [ ] Component code review checklist

---

## Blockers & Notes

- **Assumption**: `frontend-forge` directory exists and is properly configured
- **Dependency**: Lucide React icons must be installed
- **Out of Scope**: Backend API endpoints; this task creates only components

---

## Next Task
→ **Task B: Widget Implementation** - Integrate widgets into column headers and add state management

