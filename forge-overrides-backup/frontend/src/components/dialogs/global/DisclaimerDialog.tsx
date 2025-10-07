import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

const DisclaimerDialog = NiceModal.create(() => {
  const modal = useModal();

  const handleAccept = () => {
    modal.resolve('accepted');
  };

  return (
    <Dialog open={modal.visible} uncloseable>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>Safety Notice</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-4 pt-4">
            <p>
              Automagik Forge launches coding agents with elevated workspace
              access. When an attempt starts we spawn an isolated git worktree,
              but the agent still runs commands, edits files, and installs
              dependencies on your machine.
            </p>
            <p>
              <strong>Stay in control:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Review command logs and diffs before accepting results.</li>
              <li>
                Keep backups for any repositories or data the agent can touch.
              </li>
              <li>
                Pause or stop attempts immediately if something unexpected
                happens.
              </li>
            </ul>
            <p>
              Learn how we isolate worktrees, clean up containers, and audit
              command history in the Automagik Forge safety guide:{' '}
              <a
                href="https://forge.automag.ik"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                https://forge.automag.ik
              </a>
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleAccept} variant="default">
            I Understand, Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export { DisclaimerDialog };
