// FORGE CUSTOMIZATION: Selective dialog overrides
// This file uses upstream structure but imports Forge-customized dialogs locally
// Forge overrides: DisclaimerDialog, OnboardingDialog, PrivacyOptInDialog,
//                  ReleaseNotesDialog, GitHubLoginDialog, CreatePRDialog

// Global app dialogs - Forge overrides
export { DisclaimerDialog } from './global/DisclaimerDialog';
export { OnboardingDialog } from './global/OnboardingDialog';
export { PrivacyOptInDialog } from './global/PrivacyOptInDialog';
export { ReleaseNotesDialog } from './global/ReleaseNotesDialog';

// Authentication dialogs - GitHubLoginDialog is Forge override
export { GitHubLoginDialog } from './auth/GitHubLoginDialog';
export {
  ProvidePatDialog,
  type ProvidePatDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/auth/ProvidePatDialog';

// Project-related dialogs - all from upstream
export {
  ProjectFormDialog,
  type ProjectFormDialogProps,
  type ProjectFormDialogResult,
} from '../../../../../upstream/frontend/src/components/dialogs/projects/ProjectFormDialog';
export {
  ProjectEditorSelectionDialog,
  type ProjectEditorSelectionDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/projects/ProjectEditorSelectionDialog';

// Task-related dialogs - CreatePRDialog is Forge override
export {
  TaskFormDialog,
  type TaskFormDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/tasks/TaskFormDialog';

export { CreatePRDialog } from './tasks/CreatePRDialog';
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

// Settings dialogs - all from upstream
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

// Shared/Generic dialogs - all from upstream
export { ConfirmDialog, type ConfirmDialogProps } from '../../../../../upstream/frontend/src/components/dialogs/shared/ConfirmDialog';
export {
  FolderPickerDialog,
  type FolderPickerDialogProps,
} from '../../../../../upstream/frontend/src/components/dialogs/shared/FolderPickerDialog';
