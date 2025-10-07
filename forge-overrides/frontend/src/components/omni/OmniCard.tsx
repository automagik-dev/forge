import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Loader2 } from 'lucide-react';
import type { ForgeProjectSettings, OmniConfig, RecipientType } from 'shared/forge-types';
import { api } from '@/lib/api';

interface OmniCardProps {
  value: ForgeProjectSettings;
  onChange: (settings: ForgeProjectSettings) => void;
}

export function OmniCard({ value, onChange }: OmniCardProps) {
  const [loading, setLoading] = useState(false);
  const [instances, setInstances] = useState<any[]>([]);

  useEffect(() => {
    // Load available Omni instances
    const loadInstances = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ instances: any[] }>('/api/forge/omni/instances');
        setInstances(response.data.instances || []);
      } catch (error) {
        console.error('Failed to load Omni instances:', error);
      } finally {
        setLoading(false);
      }
    };

    if (value.omni_enabled) {
      loadInstances();
    }
  }, [value.omni_enabled]);

  const updateOmniConfig = useCallback(
    (updates: Partial<OmniConfig>) => {
      const newConfig: OmniConfig = {
        enabled: value.omni_config?.enabled || false,
        host: value.omni_config?.host || null,
        api_key: value.omni_config?.api_key || null,
        instance: value.omni_config?.instance || null,
        recipient: value.omni_config?.recipient || null,
        recipient_type: value.omni_config?.recipient_type || null,
        ...updates,
      };

      onChange({
        ...value,
        omni_config: newConfig,
      });
    },
    [value, onChange]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Omni Notifications
        </CardTitle>
        <CardDescription>
          Configure Omni for push notifications about task completions and failures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="omni-enabled"
            checked={value.omni_enabled}
            onCheckedChange={(checked: boolean) => {
              onChange({
                ...value,
                omni_enabled: checked,
                omni_config: checked ? (value.omni_config || {
                  enabled: true,
                  host: null,
                  api_key: null,
                  instance: null,
                  recipient: null,
                  recipient_type: null,
                }) : null,
              });
            }}
          />
          <div className="space-y-0.5">
            <Label htmlFor="omni-enabled" className="cursor-pointer">
              Enable Omni notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive push notifications via Omni when tasks complete or fail
            </p>
          </div>
        </div>

        {value.omni_enabled && (
          <>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading Omni instances...
              </div>
            )}

            <div className="ml-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="omni-host">Omni Host</Label>
                <Input
                  id="omni-host"
                  placeholder="https://omni.example.com"
                  value={value.omni_config?.host || ''}
                  onChange={(e) => updateOmniConfig({ host: e.target.value || null })}
                />
                <p className="text-sm text-muted-foreground">
                  Your Omni server URL
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="omni-api-key">API Key</Label>
                <Input
                  id="omni-api-key"
                  type="password"
                  placeholder="Enter your Omni API key"
                  value={value.omni_config?.api_key || ''}
                  onChange={(e) => updateOmniConfig({ api_key: e.target.value || null })}
                />
              </div>

              {instances.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="omni-instance">Instance</Label>
                  <Select
                    value={value.omni_config?.instance || ''}
                    onValueChange={(val) => updateOmniConfig({ instance: val || null })}
                  >
                    <SelectTrigger id="omni-instance">
                      <SelectValue placeholder="Select an instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((inst) => (
                        <SelectItem key={inst.instance_name} value={inst.instance_name}>
                          {inst.display_name || inst.instance_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!instances.length && !loading && (
                <div className="space-y-2">
                  <Label htmlFor="omni-instance">Instance</Label>
                  <Input
                    id="omni-instance"
                    placeholder="default"
                    value={value.omni_config?.instance || ''}
                    onChange={(e) => updateOmniConfig({ instance: e.target.value || null })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="omni-recipient-type">Recipient Type</Label>
                <Select
                  value={value.omni_config?.recipient_type || ''}
                  onValueChange={(val: RecipientType | '') => updateOmniConfig({ recipient_type: val || null })}
                >
                  <SelectTrigger id="omni-recipient-type">
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PhoneNumber">Phone Number</SelectItem>
                    <SelectItem value="UserId">User ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="omni-recipient">Recipient</Label>
                <Input
                  id="omni-recipient"
                  placeholder={value.omni_config?.recipient_type === 'PhoneNumber' ? '+1234567890' : 'username or channel'}
                  value={value.omni_config?.recipient || ''}
                  onChange={(e) => updateOmniConfig({ recipient: e.target.value || null })}
                />
                <p className="text-sm text-muted-foreground">
                  {value.omni_config?.recipient_type === 'PhoneNumber' 
                    ? 'Enter phone number with country code (e.g., +1234567890)'
                    : 'Enter your Omni username or channel ID'}
                </p>
              </div>
            </div>

            {!value.omni_config?.host || !value.omni_config?.api_key ? (
              <Alert>
                <AlertDescription>
                  Please configure Omni host and API key to enable notifications.
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
