// Chat message for genie widgets
export interface ChatMessage {
  id: string;
  sender: 'user' | 'wish' | 'forge' | 'review';
  content: string;
  timestamp: string;
  metadata?: {
    workflowId?: string;
    status?: 'sent' | 'processing' | 'error' | 'started';
    taskId?: string; // Task UUID for workflow executions
    attemptId?: string; // Task attempt UUID for follow-ups
  };
}
