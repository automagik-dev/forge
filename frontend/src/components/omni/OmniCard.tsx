import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { useUserSystem } from '@/components/config-provider';
import { OmniModal } from './OmniModal';

export function OmniCard() {
  const { config, updateAndSaveConfig } = useUserSystem();
  const [showOmniModal, setShowOmniModal] = useState(false);

  const isConfigured = !!(
    config?.omni?.host &&
    config?.omni?.api_key &&
    config?.omni?.instance &&
    config?.omni?.recipient
  );

  const handleDisconnect = useCallback(async () => {
    if (!config) return;
    await updateAndSaveConfig({
      omni: {
        enabled: false,
        host: null,
        api_key: null,
        instance: null,
        recipient: null,
        recipient_type: null,
      },
    });
  }, [config, updateAndSaveConfig]);

  const handleToggleEnabled = useCallback(
    async (checked: boolean) => {
      if (!config?.omni) return;
      await updateAndSaveConfig({
        omni: {
          ...config.omni,
          enabled: checked,
        },
      });
    },
    [config, updateAndSaveConfig]
  );

  if (!config) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Omni Notifications
          </CardTitle>
          <CardDescription>
            Configure Omni to receive notifications about task completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConfigured ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="omni-enabled"
                    checked={config.omni?.enabled ?? false}
                    onCheckedChange={handleToggleEnabled}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="omni-enabled" className="cursor-pointer">
                      Enable Omni Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to Omni when tasks complete
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Manage <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowOmniModal(true)}>
                      Configure
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDisconnect}>
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {config.omni?.enabled && (
                <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                  <p>Instance: {config.omni.instance}</p>
                  <p>Recipient: {config.omni.recipient}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect to Omni to receive notifications when tasks complete.
              </p>
              <div className="flex items-center space-x-2 opacity-50">
                <Checkbox
                  id="omni-disabled"
                  checked={false}
                  disabled={true}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="omni-disabled" className="cursor-not-allowed">
                    Enable Omni Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Configure Omni first to enable notifications
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowOmniModal(true)}>
                Configure Omni
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <OmniModal
        open={showOmniModal}
        onOpenChange={setShowOmniModal}
      />
    </>
  );
}