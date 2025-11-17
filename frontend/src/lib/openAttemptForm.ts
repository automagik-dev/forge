import NiceModal from '@ebay/nice-modal-react';
import type { CreateAttemptDialogProps } from '@/components/dialogs/tasks/CreateAttemptDialog';

/**
 * Open the create attempt dialog programmatically
 * This follows the same pattern as openTaskForm
 */
export function openAttemptForm(props: CreateAttemptDialogProps) {
  return NiceModal.show('create-attempt', props);
}
