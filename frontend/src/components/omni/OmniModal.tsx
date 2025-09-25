import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

const OmniModalImpl = () => {
  const modal = useModal();

  return (
    <Dialog open={modal.visible} onOpenChange={() => modal.hide()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6" />
            <DialogTitle>Omni Configuration</DialogTitle>
          </div>
          <DialogDescription>
            Omni notifications are now configured in the forge UI served at the root path.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground py-4">
          <p>
            Use the forge control panel to connect Omni instances, choose recipients, and toggle
            delivery channels. The legacy dialog remains for reference only.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => modal.hide()}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const OmniModal = NiceModal.create(OmniModalImpl);
