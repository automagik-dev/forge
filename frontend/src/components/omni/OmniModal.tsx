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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserSystem } from '@/components/config-provider';

interface OmniModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OmniModal({ open, onOpenChange }: OmniModalProps) {
  const { config, updateAndSaveConfig } = useUserSystem();
  const [host, setHost] = useState(config?.omni?.host || '');
  const [apiKey, setApiKey] = useState(config?.omni?.api_key || '');
  const [instance, setInstance] = useState(config?.omni?.instance || '');
  const [recipient, setRecipient] = useState(config?.omni?.recipient || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAndSaveConfig({
        omni: {
          enabled: config?.omni?.enabled ?? false,
          host: host || null,
          api_key: apiKey || null,
          instance: instance || null,
          recipient: recipient || null,
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save Omni configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Omni</DialogTitle>
          <DialogDescription>
            Enter your Omni instance details to enable notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="https://omni.example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Omni API key"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="instance">Instance</Label>
            <Input
              id="instance"
              value={instance}
              onChange={(e) => setInstance(e.target.value)}
              placeholder="Instance name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Notification recipient"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}