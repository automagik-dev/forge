/**
 * PostHog Analytics Event Types
 *
 * Privacy-First Rules:
 * ❌ NEVER: project names, task titles, file paths, code snippets, PII
 * ✅ ALWAYS: feature flags, counts, durations, anonymous IDs, success/failure booleans
 */

// ============================================================================
// Session & User Events
// ============================================================================

export interface SessionStartedEvent {
  is_returning_user: boolean;
  days_since_last_session: number | null;
  total_sessions: number;
}

export interface SessionEndedEvent {
  session_duration_seconds: number;
  events_captured_count: number;
}

export interface HeartbeatEvent {
  // Sent every 30s for concurrent user tracking
  active: boolean;
}

// ============================================================================
// Navigation Events
// ============================================================================

export type NavigationMethod = 'sidebar' | 'breadcrumb' | 'direct_url' | 'back_button' | 'link';

export interface PageVisitedEvent {
  page: 'projects' | 'tasks' | 'settings' | 'logs' | 'home';
  time_on_previous_page_seconds: number | null;
  navigation_method: NavigationMethod;
}

// ============================================================================
// Dev Server Events (Priority #1 - "Lovable" Feature)
// ============================================================================

export interface DevServerStartedEvent {
  attempt_id: string; // Anonymous UUID
  task_has_failed_before: boolean;
  is_first_use: boolean;
}

export interface DevServerStoppedEvent {
  attempt_id: string;
  duration_seconds: number;
  was_manual_stop: boolean;
}

export interface DevServerPreviewInteractedEvent {
  attempt_id: string;
  interaction_type: 'iframe_loaded' | 'url_changed' | 'refresh';
  preview_duration_seconds: number;
}

// ============================================================================
// View Mode Events
// ============================================================================

export type ViewMode = 'chat' | 'preview' | 'diffs' | 'kanban' | 'list' | null;
export type ViewModeChangeTrigger = 'url_param' | 'keyboard_shortcut' | 'ui_button';

export interface ViewModeSwitchedEvent {
  from_mode: ViewMode;
  to_mode: ViewMode;
  trigger: ViewModeChangeTrigger;
  task_selected: boolean;
}

export interface ViewModeSessionEvent {
  mode: Exclude<ViewMode, null>;
  duration_seconds: number;
  tasks_viewed_count: number;
}

// ============================================================================
// Task & Parent/Child Events
// ============================================================================

export type TaskCreationEntryPoint = 'task_form_dialog' | 'relationship_viewer' | 'breadcrumb' | 'badges';

export interface ChildTaskCreatedEvent {
  parent_task_id: string; // Anonymous UUID
  creation_entry_point: TaskCreationEntryPoint;
  parent_has_attempts: boolean;
  task_depth: number; // 1 = direct child, 2 = grandchild, etc.
}

export interface ParentTaskNavigatedEvent {
  from_task_id: string; // Anonymous UUID
  to_task_id: string; // Anonymous UUID
  navigation_entry_point: 'breadcrumb' | 'relationship_viewer' | 'relationship_badges';
  task_depth: number;
}

export interface TaskRelationshipViewerOpenedEvent {
  task_id: string; // Anonymous UUID
  has_parent: boolean;
  children_count: number;
}

// ============================================================================
// Kanban Events
// ============================================================================

export type TaskStatus = 'todo' | 'inprogress' | 'inreview' | 'done' | 'cancelled';

export interface KanbanTaskDraggedEvent {
  from_status: TaskStatus;
  to_status: TaskStatus;
  tasks_in_source_column: number;
  tasks_in_target_column: number;
}

export interface KanbanModeEnteredEvent {
  total_tasks: number;
  tasks_per_status: Record<TaskStatus, number>;
  entry_method: 'url' | 'view_switcher' | 'keyboard_shortcut';
}

// ============================================================================
// Keyboard Shortcut Events
// ============================================================================

export type KeyboardShortcut =
  | 'create_task'
  | 'nav_up'
  | 'nav_down'
  | 'open_details'
  | 'cycle_view'
  | 'delete_task'
  | 'toggle_sidebar'
  | 'search';

export type KeyboardContext = 'task_list' | 'task_detail' | 'kanban' | 'preview' | 'settings';

export interface KeyboardShortcutUsedEvent {
  shortcut: KeyboardShortcut;
  context: KeyboardContext;
  is_first_use: boolean;
}

// ============================================================================
// Breadcrumb Navigation Events
// ============================================================================

export type BreadcrumbType = 'project' | 'task_parent' | 'task_child';

export interface BreadcrumbClickedEvent {
  breadcrumb_type: BreadcrumbType;
  depth: number;
  current_view: Exclude<ViewMode, null>;
}

// ============================================================================
// Executor Events (Backend Enhancement)
// ============================================================================

// Matches backend BaseCodingAgent enum values
export type ExecutorType =
  | 'CLAUDE_CODE'
  | 'AMP'
  | 'GEMINI'
  | 'CODEX'
  | 'OPENCODE'
  | 'CURSOR_AGENT'
  | 'QWEN_CODE'
  | 'COPILOT'
  | 'unknown'; // Fallback for error cases

export interface ExecutorSelectedEvent {
  executor: ExecutorType;
  is_default: boolean;
  context: 'new_task' | 'retry_after_failure' | 'settings_change';
}

export interface ExecutorPerformanceEvent {
  executor: ExecutorType;
  success: boolean;
  duration_seconds: number;
  error_type: 'timeout' | 'api_error' | 'execution_error' | null;
  had_dev_server: boolean; // Correlation tracking
}

export interface TaskCreatedEvent {
  executor: ExecutorType;
  has_description: boolean;
  prompt_length: number; // Length of task description
  is_subtask: boolean;
}

export interface TaskCompletedEvent {
  executor: ExecutorType;
  duration_seconds: number;
  attempt_count: number;
  success: boolean;
  had_dev_server: boolean;
}

export interface FirstSuccessEvent {
  time_to_first_success_minutes: number;
  attempts_before_success: number;
  executor_used: ExecutorType;
  days_since_signup: number;
}

export interface TokenUsageEvent {
  executor: ExecutorType;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  task_id: string; // Hashed UUID
}

// ============================================================================
// GitHub Integration Events
// ============================================================================

export type GitHubFeature = 'pr_created' | 'branch_switched' | 'rebase' | 'pr_opened_in_github';
export type GitHubAuthMethod = 'oauth' | 'pat';

export interface GitHubFeatureUsedEvent {
  feature: GitHubFeature;
  from_view: Exclude<ViewMode, null>;
  has_auth: boolean;
}

export interface GitHubAuthFlowEvent {
  auth_method: GitHubAuthMethod;
  success: boolean;
  is_first_auth: boolean;
}

// ============================================================================
// Union Type for All Events
// ============================================================================

export type AnalyticsEvent =
  | { event: 'session_started'; properties: SessionStartedEvent }
  | { event: 'session_ended'; properties: SessionEndedEvent }
  | { event: '$heartbeat'; properties: HeartbeatEvent }
  | { event: 'page_visited'; properties: PageVisitedEvent }
  | { event: 'dev_server_started'; properties: DevServerStartedEvent }
  | { event: 'dev_server_stopped'; properties: DevServerStoppedEvent }
  | { event: 'dev_server_preview_interacted'; properties: DevServerPreviewInteractedEvent }
  | { event: 'view_mode_switched'; properties: ViewModeSwitchedEvent }
  | { event: 'view_mode_session'; properties: ViewModeSessionEvent }
  | { event: 'child_task_created'; properties: ChildTaskCreatedEvent }
  | { event: 'parent_task_navigated'; properties: ParentTaskNavigatedEvent }
  | { event: 'task_relationship_viewer_opened'; properties: TaskRelationshipViewerOpenedEvent }
  | { event: 'kanban_task_dragged'; properties: KanbanTaskDraggedEvent }
  | { event: 'kanban_mode_entered'; properties: KanbanModeEnteredEvent }
  | { event: 'keyboard_shortcut_used'; properties: KeyboardShortcutUsedEvent }
  | { event: 'breadcrumb_clicked'; properties: BreadcrumbClickedEvent }
  | { event: 'executor_selected'; properties: ExecutorSelectedEvent }
  | { event: 'executor_performance'; properties: ExecutorPerformanceEvent }
  | { event: 'task_created'; properties: TaskCreatedEvent }
  | { event: 'task_completed'; properties: TaskCompletedEvent }
  | { event: 'first_success'; properties: FirstSuccessEvent }
  | { event: 'token_usage'; properties: TokenUsageEvent }
  | { event: 'github_feature_used'; properties: GitHubFeatureUsedEvent }
  | { event: 'github_auth_flow'; properties: GitHubAuthFlowEvent };
