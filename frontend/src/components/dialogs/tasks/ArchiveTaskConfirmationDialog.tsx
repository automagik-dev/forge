import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { tasksApi } from '@/lib/api';
import type { TaskWithAttemptStatus } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

export interface CancelTaskConfirmationDialogProps {
  task: TaskWithAttemptStatus;
}

const CancelTaskConfirmationDialog =
  NiceModal.create<CancelTaskConfirmationDialogProps>(({ task }) => {
    const modal = useModal();
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmCancel = async () => {
      setIsCancelling(true);
      setError(null);

      try {
        await tasksApi.update(task.id, {
          title: null,
          description: null,
          status: 'cancelled',
          parent_task_attempt: null,
          image_ids: null,
        });
        modal.resolve();
        modal.hide();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to cancel task';
        setError(errorMessage);
      } finally {
        setIsCancelling(false);
      }
    };

    const handleCancelDialog = () => {
      modal.reject();
      modal.hide();
    };

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && handleCancelDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel{' '}
              <span className="font-semibold">"{task.title}"</span>?
            </DialogDescription>
          </DialogHeader>

          <Alert variant="default" className="mb-4">
            <strong>Note:</strong> Cancelled tasks can be viewed but will be hidden from the main workflow.
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDialog}
              disabled={isCancelling}
              autoFocus
            >
              Back
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  });

// Export with new name
export { CancelTaskConfirmationDialog };

// Backward compatibility alias
export { CancelTaskConfirmationDialog as ArchiveTaskConfirmationDialog };
export type { CancelTaskConfirmationDialogProps as ArchiveTaskConfirmationDialogProps };
