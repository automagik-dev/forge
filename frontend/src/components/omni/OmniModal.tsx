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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MessageSquare } from 'lucide-react';
import { useUserSystem } from '@/components/config-provider';
import { omniApi } from './api';
import { OmniInstance } from './types';

interface OmniModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OmniModal({ open, onOpenChange }: OmniModalProps) {
  const { config, updateAndSaveConfig } = useUserSystem();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instances, setInstances] = useState<OmniInstance[]>([]);
  
  const [formData, setFormData] = useState({
    host: config?.omni?.host || 'http://localhost:8882',
    api_key: config?.omni?.api_key || '',
    instance: config?.omni?.instance || '',
    recipient: config?.omni?.recipient || '',
    recipient_type: config?.omni?.recipient_type || 'PhoneNumber',
  });

  const validateAndLoadInstances = async () => {
    if (!formData.host || !formData.api_key) {
      setError('Host and API key are required');
      return;
    }
    
    setValidating(true);
    setError(null);
    
    try {
      const result = await omniApi.validateConfig(formData.host, formData.api_key);
      if (result.valid) {
        setInstances(result.instances);
        if (result.instances.length === 0) {
          setError('No instances found');
        }
      } else {
        setError(result.error || 'Invalid configuration');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to validate configuration');
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.instance || !formData.recipient) {
      setError('Please select an instance and enter a recipient');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await updateAndSaveConfig({
        omni: {
          enabled: true,
          host: formData.host,
          api_key: formData.api_key,
          instance: formData.instance,
          recipient: formData.recipient,
          recipient_type: formData.recipient_type as any,
        },
      });
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const selectedInstance = instances.find(i => i.instance_name === formData.instance);
  const isDiscord = selectedInstance?.channel_type === 'discord';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6" />
            <DialogTitle>Configure Omni Integration</DialogTitle>
          </div>
          <DialogDescription>
            Connect to your Omni server to send notifications
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="host">Server Host</Label>
            <Input
              id="host"
              placeholder="http://localhost:8882"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your API key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            />
          </div>
          
          {instances.length === 0 && (
            <Button 
              onClick={validateAndLoadInstances}
              disabled={validating}
              className="w-full"
            >
              {validating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Load Instances'
              )}
            </Button>
          )}
          
          {instances.length > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="instance">Instance</Label>
                <Select
                  value={formData.instance}
                  onValueChange={(value) => setFormData({ ...formData, instance: value })}
                >
                  <SelectTrigger id="instance">
                    <SelectValue placeholder="Select an instance" />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem 
                        key={instance.instance_name} 
                        value={instance.instance_name}
                      >
                        {instance.display_name} ({instance.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient">
                  {isDiscord ? 'User ID' : 'Phone Number'}
                </Label>
                <Input
                  id="recipient"
                  placeholder={isDiscord ? 'Discord User ID' : '5512982298888'}
                  value={formData.recipient}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    recipient: e.target.value,
                    recipient_type: isDiscord ? 'UserId' : 'PhoneNumber'
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  {isDiscord 
                    ? 'Enter the Discord user ID to receive notifications'
                    : 'Enter phone number with country code (e.g., 5512982298888)'}
                </p>
              </div>
            </>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || instances.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}