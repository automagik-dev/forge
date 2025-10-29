// Global app dialogs
export { DisclaimerDialog } from '@/components/dialogs/global/DisclaimerDialog';
export { OnboardingDialog } from '@/components/dialogs/global/OnboardingDialog';
export { PrivacyOptInDialog } from '@/components/dialogs/global/PrivacyOptInDialog';
export { ReleaseNotesDialog } from '@/components/dialogs/global/ReleaseNotesDialog';

// Authentication dialogs
export { GitHubLoginDialog } from '@/components/dialogs/auth/GitHubLoginDialog';
export {
  ProvidePatDialog,
  type ProvidePatDialogProps,
} from '@/components/dialogs/auth/ProvidePatDialog';

// Project-related dialogs
export {
  ProjectFormDialog,
  type ProjectFormDialogProps,
  type ProjectFormDialogResult,
} from '@/components/dialogs/projects/ProjectFormDialog';
export {
  ProjectEditorSelectionDialog,
  type ProjectEditorSelectionDialogProps,
} from '@/components/dialogs/projects/ProjectEditorSelectionDialog';

// Task-related dialogs
export {
  TaskFormDialog,
  type TaskFormDialogProps,
} from '@/components/dialogs/tasks/TaskFormDialog';

export { CreatePRDialog } from '@/components/dialogs/tasks/CreatePRDialog';
export {
  EditorSelectionDialog,
  type EditorSelectionDialogProps,
} from '@/components/dialogs/tasks/EditorSelectionDialog';
export {
  DeleteTaskConfirmationDialog,
  type DeleteTaskConfirmationDialogProps,
} from '@/components/dialogs/tasks/DeleteTaskConfirmationDialog';
export {
  TaskTemplateEditDialog,
  type TaskTemplateEditDialogProps,
  type TaskTemplateEditResult,
} from '@/components/dialogs/tasks/TaskTemplateEditDialog';
export {
  ChangeTargetBranchDialog,
  type ChangeTargetBranchDialogProps,
  type ChangeTargetBranchDialogResult,
} from '@/components/dialogs/tasks/ChangeTargetBranchDialog';
export {
  RebaseDialog,
  type RebaseDialogProps,
  type RebaseDialogResult,
} from '@/components/dialogs/tasks/RebaseDialog';
export {
  RestoreLogsDialog,
  type RestoreLogsDialogProps,
  type RestoreLogsDialogResult,
} from '@/components/dialogs/tasks/RestoreLogsDialog';
export {
  ViewProcessesDialog,
  type ViewProcessesDialogProps,
} from '@/components/dialogs/tasks/ViewProcessesDialog';
export {
  GitActionsDialog,
  type GitActionsDialogProps,
} from '@/components/dialogs/tasks/GitActionsDialog';

// Settings dialogs
export {
  CreateConfigurationDialog,
  type CreateConfigurationDialogProps,
  type CreateConfigurationResult,
} from '@/components/dialogs/settings/CreateConfigurationDialog';
export {
  DeleteConfigurationDialog,
  type DeleteConfigurationDialogProps,
  type DeleteConfigurationResult,
} from '@/components/dialogs/settings/DeleteConfigurationDialog';

// Shared/Generic dialogs
export { ConfirmDialog, type ConfirmDialogProps } from '@/components/dialogs/shared/ConfirmDialog';
export {
  FolderPickerDialog,
  type FolderPickerDialogProps,
} from '@/components/dialogs/shared/FolderPickerDialog';
