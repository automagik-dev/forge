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

export interface ArchiveTaskConfirmationDialogProps {
  task: TaskWithAttemptStatus;
}

const ArchiveTaskConfirmationDialog =
  NiceModal.create<ArchiveTaskConfirmationDialogProps>(({ task }) => {
    const modal = useModal();
    const [isArchiving, setIsArchiving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmArchive = async () => {
      setIsArchiving(true);
      setError(null);

      try {
        await tasksApi.update(task.id, {
          title: null,
          description: null,
          status: 'archived',
          parent_task_attempt: null,
          image_ids: null,
        });
        modal.resolve();
        modal.hide();
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to archive task';
        setError(errorMessage);
      } finally {
        setIsArchiving(false);
      }
    };

    const handleCancelArchive = () => {
      modal.reject();
      modal.hide();
    };

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && handleCancelArchive()}
      >
        <DialogContent data-testid="archive-confirmation-modal">
          <DialogHeader>
            <DialogTitle>Archive Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive{' '}
              <span className="font-semibold">"{task.title}"</span>?
            </DialogDescription>
          </DialogHeader>

          <Alert variant="default" className="mb-4">
            <strong>Note:</strong> Archived tasks can be viewed but will be hidden from the main workflow.
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-4">
              {error}
            </Alert>
          )}

          <DialogFooter>
            <Button
              data-testid="archive-modal-cancel"
              variant="outline"
              onClick={handleCancelArchive}
              disabled={isArchiving}
              autoFocus
            >
              Cancel
            </Button>
            <Button
              data-testid="archive-modal-confirm"
              onClick={handleConfirmArchive}
              disabled={isArchiving}
            >
              {isArchiving ? 'Archiving...' : 'Archive Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  });

export { ArchiveTaskConfirmationDialog };
