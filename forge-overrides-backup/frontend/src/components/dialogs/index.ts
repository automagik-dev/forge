// Forge override: re-export upstream dialogs but use forge DisclaimerDialog
// This file overrides upstream/frontend/src/components/dialogs/index.ts

// Global app dialogs - use forge override for DisclaimerDialog
export { DisclaimerDialog } from './global/DisclaimerDialog';

// Re-export all other dialogs from upstream using relative paths
export { OnboardingDialog } from '../../../../../upstream/frontend/src/components/dialogs/global/OnboardingDialog';
export { PrivacyOptInDialog } from '../../../../../upstream/frontend/src/components/dialogs/global/PrivacyOptInDialog';
export { ReleaseNotesDialog } from '../../../../../upstream/frontend/src/components/dialogs/global/ReleaseNotesDialog';

// Authentication dialogs
export { GitHubLoginDialog } from '../../../../../upstream/frontend/src/components/dialogs/auth/GitHubLoginDialog';
export {
  ProvidePatDialog,
  type ProvidePatDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/auth/ProvidePatDialog';

// Project-related dialogs
export {
  ProjectFormDialog,
  type ProjectFormDialogProps,
  type ProjectFormDialogResult,
} from '../../../../../upstream/frontend/src/components/dialogs/projects/ProjectFormDialog';
export {
  ProjectEditorSelectionDialog,
  type ProjectEditorSelectionDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/projects/ProjectEditorSelectionDialog';

// Task-related dialogs
export {
  TaskFormDialog,
  type TaskFormDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/TaskFormDialog';

export { CreatePRDialog } from '../../../../../upstream/frontend/src/components/dialogs/tasks/CreatePRDialog';
export {
  EditorSelectionDialog,
  type EditorSelectionDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/EditorSelectionDialog';
export {
  DeleteTaskConfirmationDialog,
  type DeleteTaskConfirmationDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/DeleteTaskConfirmationDialog';
export {
  TaskTemplateEditDialog,
  type TaskTemplateEditDialogProps,
  type TaskTemplateEditResult,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/TaskTemplateEditDialog';
export {
  ChangeTargetBranchDialog,
  type ChangeTargetBranchDialogProps,
  type ChangeTargetBranchDialogResult,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/ChangeTargetBranchDialog';
export {
  RebaseDialog,
  type RebaseDialogProps,
  type RebaseDialogResult,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/RebaseDialog';
export {
  RestoreLogsDialog,
  type RestoreLogsDialogProps,
  type RestoreLogsDialogResult,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/RestoreLogsDialog';

// Settings dialogs
export {
  CreateConfigurationDialog,
  type CreateConfigurationDialogProps,
  type CreateConfigurationResult,
} from '../../../../../upstream/frontend/src/components/dialogs/settings/CreateConfigurationDialog';
export {
  DeleteConfigurationDialog,
  type DeleteConfigurationDialogProps,
  type DeleteConfigurationResult,
} from '../../../../../upstream/frontend/src/components/dialogs/settings/DeleteConfigurationDialog';

// Shared/Generic dialogs
export { ConfirmDialog, type ConfirmDialogProps } from '../../../../../upstream/frontend/src/components/dialogs/shared/ConfirmDialog';
export {
  FolderPickerDialog,
  type FolderPickerDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/shared/FolderPickerDialog';
