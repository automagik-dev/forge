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
    status?: 'sent' | 'processing' | 'error' | 'started';
    taskId?: string;      // Task UUID for workflow executions
    attemptId?: string;   // Task attempt UUID for follow-ups
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
