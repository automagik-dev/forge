# Task B: Widget Implementation & State Management

**Phase**: 2 of 4
**Agent**: `specialists/implementor`, `specialists/tests`
**Status**: 🔴 Pending
**Created**: 2025-10-23

---

## Overview

This task integrates the widgets created in Task A with state management, workflow definitions, and mock API integration. By the end, the column headers will be clickable and open interactive chat panels.

---

## Discovery

### Existing Components
Reference from Task A:
- ColumnHeader
- SubGenieWidget
- WorkflowButton
- SkillToggle
- Type definitions

### Configuration Data
We need to define the workflows and skills for each sub-genie (Wishh, Forge, Review).

### State Management
Determine where to store:
- Chat history per column
- Skill toggles per column
- Widget open/close state

Options: React Context, Zustand, TanStack Query. **Recommendation**: Start with local component state + Context for cross-column state.

---

## Implementation Plan

### Step 1: Create Sub-Genie Configuration
**File**: `frontend-forge/src/config/genie-configs.ts`

```typescript
import {
  Sparkles,
  Hammer,
  Target,
  Zap,
  BookOpen,
  RefreshCw,
  GitBranch,
  TestTube,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { SubGenieConfig } from '@/components/genie-widgets';

export const GENIE_CONFIGS: Record<'wishh' | 'forge' | 'review', SubGenieConfig> = {
  wishh: {
    id: 'wishh',
    name: 'Wishh (Planner)',
    columnStatus: 'todo',
    icon: Sparkles,
    color: 'purple',
    workflows: [
      {
        id: 'refine_spec',
        label: 'Refine Spec',
        description: 'Refine task specification and requirements',
        icon: BookOpen,
        genieType: 'wishh',
        columnStatus: 'todo',
      },
      {
        id: 'analyze_deps',
        label: 'Analyze Dependencies',
        description: 'Identify task dependencies and blockers',
        icon: Zap,
        genieType: 'wishh',
        columnStatus: 'todo',
      },
      {
        id: 'create_from_idea',
        label: 'Create from Idea',
        description: 'Convert rough idea into structured task',
        icon: Sparkles,
        genieType: 'wishh',
        columnStatus: 'todo',
      },
      {
        id: 'prioritize',
        label: 'Prioritize',
        description: 'Reorder tasks by priority',
        icon: Target,
        genieType: 'wishh',
        columnStatus: 'todo',
      },
    ],
    skills: [
      {
        id: 'quick_analysis',
        name: 'Quick Analysis',
        description: 'Fast mode (skip deep analysis)',
        icon: Zap,
        genieType: 'wishh',
        defaultEnabled: false,
      },
      {
        id: 'auto_tag',
        name: 'Auto-Tag',
        description: 'Automatically tag tasks by type',
        icon: BookOpen,
        genieType: 'wishh',
        defaultEnabled: false,
      },
    ],
  },

  forge: {
    id: 'forge',
    name: 'Forge (Executor)',
    columnStatus: 'inprogress',
    icon: Hammer,
    color: 'orange',
    workflows: [
      {
        id: 'start_build',
        label: 'Start Build',
        description: 'Initiate code generation or build process',
        icon: Hammer,
        genieType: 'forge',
        columnStatus: 'inprogress',
      },
      {
        id: 'run_tests',
        label: 'Run Tests',
        description: 'Execute test suite',
        icon: TestTube,
        genieType: 'forge',
        columnStatus: 'inprogress',
      },
      {
        id: 'update_status',
        label: 'Update Status',
        description: 'Get execution status and logs',
        icon: RefreshCw,
        genieType: 'forge',
        columnStatus: 'inprogress',
      },
      {
        id: 'create_branch',
        label: 'Create Branch',
        description: '(Git Agent) Create feature branch',
        icon: GitBranch,
        genieType: 'forge',
        columnStatus: 'inprogress',
        externalAgent: 'git_agent',
      },
      {
        id: 'sync_branch',
        label: 'Sync Branch',
        description: '(Git Agent) Sync with main',
        icon: RefreshCw,
        genieType: 'forge',
        columnStatus: 'inprogress',
        externalAgent: 'git_agent',
      },
    ],
    skills: [
      {
        id: 'fast_mode',
        name: 'Fast Mode',
        description: 'Skip non-essential checks, build faster',
        icon: Zap,
        genieType: 'forge',
        defaultEnabled: false,
      },
      {
        id: 'verbose_logs',
        name: 'Verbose Logs',
        description: 'Show all build output',
        icon: FileText,
        genieType: 'forge',
        defaultEnabled: false,
      },
    ],
  },

  review: {
    id: 'review',
    name: 'Review (Validator)',
    columnStatus: 'inreview',
    icon: Target,
    color: 'blue',
    workflows: [
      {
        id: 'run_qa',
        label: 'Run QA Suite',
        description: 'Execute quality assurance tests',
        icon: TestTube,
        genieType: 'review',
        columnStatus: 'inreview',
      },
      {
        id: 'generate_summary',
        label: 'Generate Summary',
        description: 'Auto-generate code review summary',
        icon: FileText,
        genieType: 'review',
        columnStatus: 'inreview',
      },
      {
        id: 'approve_move',
        label: 'Approve & Move',
        description: 'Approve task and move to Done',
        icon: CheckCircle2,
        genieType: 'review',
        columnStatus: 'inreview',
      },
      {
        id: 'request_changes',
        label: 'Request Changes',
        description: 'Flag issues for rework',
        icon: RefreshCw,
        genieType: 'review',
        columnStatus: 'inreview',
      },
    ],
    skills: [
      {
        id: 'express_review',
        name: 'Express Review',
        description: 'Fast-track approval for low-risk changes',
        icon: Zap,
        genieType: 'review',
        defaultEnabled: false,
      },
      {
        id: 'detailed_report',
        name: 'Detailed Report',
        description: 'Generate comprehensive review report',
        icon: FileText,
        genieType: 'review',
        defaultEnabled: false,
      },
    ],
  },
};
```

### Step 2: Create React Context for Widget State
**File**: `frontend-forge/src/context/SubGenieContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ChatMessage } from '@/components/genie-widgets';

interface WidgetState {
  isOpen: boolean;
  chatHistory: ChatMessage[];
  skillsEnabled: Record<string, boolean>;
}

interface SubGenieContextType {
  // State per sub-genie
  widgets: Record<'wishh' | 'forge' | 'review', WidgetState>;
  // Actions
  toggleWidget: (genieId: 'wishh' | 'forge' | 'review') => void;
  closeWidget: (genieId: 'wishh' | 'forge' | 'review') => void;
  addMessage: (
    genieId: 'wishh' | 'forge' | 'review',
    message: ChatMessage
  ) => void;
  toggleSkill: (
    genieId: 'wishh' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ) => void;
}

const SubGenieContext = createContext<SubGenieContextType | undefined>(undefined);

export const SubGenieProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [widgets, setWidgets] = useState<Record<'wishh' | 'forge' | 'review', WidgetState>>({
    wishh: { isOpen: false, chatHistory: [], skillsEnabled: {} },
    forge: { isOpen: false, chatHistory: [], skillsEnabled: {} },
    review: { isOpen: false, chatHistory: [], skillsEnabled: {} },
  });

  const toggleWidget = useCallback((genieId: 'wishh' | 'forge' | 'review') => {
    setWidgets((prev) => ({
      ...prev,
      [genieId]: {
        ...prev[genieId],
        isOpen: !prev[genieId].isOpen,
      },
    }));
  }, []);

  const closeWidget = useCallback((genieId: 'wishh' | 'forge' | 'review') => {
    setWidgets((prev) => ({
      ...prev,
      [genieId]: { ...prev[genieId], isOpen: false },
    }));
  }, []);

  const addMessage = useCallback(
    (genieId: 'wishh' | 'forge' | 'review', message: ChatMessage) => {
      setWidgets((prev) => ({
        ...prev,
        [genieId]: {
          ...prev[genieId],
          chatHistory: [...prev[genieId].chatHistory, message],
        },
      }));
    },
    []
  );

  const toggleSkill = useCallback(
    (genieId: 'wishh' | 'forge' | 'review', skillId: string, enabled: boolean) => {
      setWidgets((prev) => ({
        ...prev,
        [genieId]: {
          ...prev[genieId],
          skillsEnabled: {
            ...prev[genieId].skillsEnabled,
            [skillId]: enabled,
          },
        },
      }));
    },
    []
  );

  return (
    <SubGenieContext.Provider
      value={{ widgets, toggleWidget, closeWidget, addMessage, toggleSkill }}
    >
      {children}
    </SubGenieContext.Provider>
  );
};

export const useSubGenie = () => {
  const context = useContext(SubGenieContext);
  if (!context) {
    throw new Error('useSubGenie must be used within SubGenieProvider');
  }
  return context;
};
```

### Step 3: Create API Service Layer
**File**: `frontend-forge/src/services/subGenieApi.ts`

```typescript
import { ChatMessage } from '@/components/genie-widgets';

// Mock API service (replace with real endpoints later)
export class SubGenieApiService {
  private baseUrl = '/api/genie';

  async sendMessage(
    genieId: 'wishh' | 'forge' | 'review',
    message: string,
    columnStatus: string
  ): Promise<{ response: string; action?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${genieId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, column: columnStatus }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('SubGenie API error:', error);
      // Return mock response for development
      return {
        response: `${genieId} received: "${message}". (Mock response)`,
      };
    }
  }

  async triggerWorkflow(
    genieId: 'wishh' | 'forge' | 'review',
    workflowId: string,
    columnStatus: string,
    context?: Record<string, any>
  ): Promise<{ status: string; result?: any }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${genieId}/workflow/${workflowId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ columnStatus, context }),
        }
      );

      if (!response.ok) {
        throw new Error(`Workflow error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Workflow API error:', error);
      // Mock response
      return {
        status: 'queued',
        result: `Workflow "${workflowId}" queued. (Mock)`,
      };
    }
  }

  async toggleSkill(
    genieId: 'wishh' | 'forge' | 'review',
    skillId: string,
    enabled: boolean
  ): Promise<{ skillId: string; enabled: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${genieId}/skill/${skillId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error(`Skill error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Skill API error:', error);
      // Mock response
      return { skillId, enabled };
    }
  }
}

export const subGenieApi = new SubGenieApiService();
```

### Step 4: Create Custom Hook
**File**: `frontend-forge/src/hooks/useSubGenieWidget.ts`

```typescript
import { useCallback, useState } from 'react';
import { useSubGenie } from '@/context/SubGenieContext';
import { ChatMessage } from '@/components/genie-widgets';
import { subGenieApi } from '@/services/subGenieApi';

export const useSubGenieWidget = (
  genieId: 'wishh' | 'forge' | 'review',
  columnStatus: string
) => {
  const { widgets, toggleWidget, closeWidget, addMessage, toggleSkill } =
    useSubGenie();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Add user message
      addMessage(genieId, {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Send to API
      setIsLoading(true);
      try {
        const result = await subGenieApi.sendMessage(
          genieId,
          message,
          columnStatus
        );

        // Add response
        addMessage(genieId, {
          id: `msg-${Date.now() + 1}`,
          sender: genieId,
          content: result.response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [genieId, columnStatus, addMessage]
  );

  const handleWorkflowClick = useCallback(
    async (workflowId: string) => {
      setIsLoading(true);
      try {
        const result = await subGenieApi.triggerWorkflow(
          genieId,
          workflowId,
          columnStatus
        );

        addMessage(genieId, {
          id: `msg-${Date.now()}`,
          sender: genieId,
          content: `Workflow "${workflowId}" ${result.status}. ${
            result.result ? result.result : ''
          }`,
          timestamp: new Date().toISOString(),
          metadata: { workflowId, status: result.status as any },
        });
      } catch (error) {
        console.error('Error triggering workflow:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [genieId, columnStatus, addMessage]
  );

  const handleSkillToggle = useCallback(
    async (skillId: string, enabled: boolean) => {
      try {
        await subGenieApi.toggleSkill(genieId, skillId, enabled);
        toggleSkill(genieId, skillId, enabled);

        addMessage(genieId, {
          id: `msg-${Date.now()}`,
          sender: genieId,
          content: `Skill "${skillId}" ${enabled ? 'enabled' : 'disabled'}.`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error toggling skill:', error);
      }
    },
    [genieId, toggleSkill, addMessage]
  );

  return {
    isOpen: widgets[genieId].isOpen,
    chatHistory: widgets[genieId].chatHistory,
    skillsState: widgets[genieId].skillsEnabled,
    isLoading,
    toggleWidget: () => toggleWidget(genieId),
    closeWidget: () => closeWidget(genieId),
    onSendMessage: handleSendMessage,
    onWorkflowClick: handleWorkflowClick,
    onSkillToggle: handleSkillToggle,
  };
};
```

### Step 5: Create Column Component with Widgets
**File**: `frontend-forge/src/components/genie-widgets/ColumnWithWidget.tsx`

```typescript
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ColumnHeader, SubGenieWidget, SubGenieConfig } from '@/components/genie-widgets';
import { useSubGenieWidget } from '@/hooks/useSubGenieWidget';

interface ColumnWithWidgetProps {
  config: SubGenieConfig;
  taskCount: number;
  children: React.ReactNode; // Tasks in column
}

export const ColumnWithWidget: React.FC<ColumnWithWidgetProps> = ({
  config,
  taskCount,
  children,
}) => {
  const {
    isOpen,
    chatHistory,
    skillsState,
    isLoading,
    toggleWidget,
    closeWidget,
    onSendMessage,
    onWorkflowClick,
    onSkillToggle,
  } = useSubGenieWidget(config.id, config.columnStatus);

  return (
    <div className="flex flex-col gap-0 h-full">
      <ColumnHeader
        columnName={config.name.split(' ')[0] as any} // Extract "Wishh", "Forge", etc.
        icon={config.icon}
        taskCount={taskCount}
        isWidgetOpen={isOpen}
        onIconClick={toggleWidget}
      />

      <div className="flex-1 overflow-y-auto p-4">
        {isOpen && (
          <SubGenieWidget
            config={config}
            isOpen={isOpen}
            onClose={closeWidget}
            onSendMessage={onSendMessage}
            onWorkflowClick={onWorkflowClick}
            onSkillToggle={onSkillToggle}
            chatHistory={chatHistory}
            skillsState={skillsState}
            isLoading={isLoading}
          />
        )}

        {/* Tasks column content */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
```

---

## Verification

### Commands
```bash
# Type check
pnpm --filter frontend-forge exec tsc --noEmit

# Lint
pnpm --filter frontend-forge run lint

# Test (if applicable)
pnpm --filter frontend-forge run test
```

### Checklist
- [ ] All files compile without TypeScript errors
- [ ] No ESLint violations
- [ ] SubGenieContext works correctly
- [ ] useSubGenieWidget hook works correctly
- [ ] Mock API calls execute without errors
- [ ] Widgets open/close when icons are clicked

---

## Evidence Artifacts
Store in `.genie/wishes/genie-chat-widgets/qa/`:
- [ ] TypeScript compilation report
- [ ] Linting report
- [ ] Test execution report (if applicable)
- [ ] Manual interaction testing log

---

## Next Task
→ **Task C: Integration with Kanban** - Wire widgets into the actual Kanban board component

