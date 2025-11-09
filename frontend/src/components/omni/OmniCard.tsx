import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NiceModal from '@ebay/nice-modal-react';
import type { ForgeProjectSettings } from 'shared/forge-types';

interface OmniCardProps {
  value: ForgeProjectSettings;
  onChange: (settings: ForgeProjectSettings) => void;
}

export function OmniCard({ value, onChange }: OmniCardProps) {
  const isConfigured = !!(
    value.omni_config?.host && 
    value.omni_config?.api_key &&
    value.omni_config?.instance &&
    value.omni_config?.recipient
  );

  const handleDisconnect = () => {
    onChange({
      ...value,
      omni_enabled: false,
      omni_config: {
        enabled: false,
        host: null,
        api_key: null,
        instance: null,
        recipient: null,
        recipient_type: null,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Omni Integration
        </CardTitle>
        <CardDescription>
          Send task notifications via WhatsApp, Discord, or Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="omni-enabled"
            checked={value.omni_enabled && isConfigured}
            onCheckedChange={(checked: boolean) => {
              onChange({
                ...value,
                omni_enabled: checked,
                omni_config: value.omni_config ? {
                  ...value.omni_config,
                  enabled: checked,
                } : null,
              });
            }}
            disabled={!isConfigured}
          />
          <div className="space-y-0.5">
            <Label htmlFor="omni-enabled" className="cursor-pointer">
              Enable Omni Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Send task completion notifications to external messaging platforms
            </p>
          </div>
        </div>
        
        {isConfigured ? (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">
                Connected to {value.omni_config?.instance}
              </p>
              <p className="text-sm text-muted-foreground">
                Recipient: {value.omni_config?.recipient}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Manage <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => NiceModal.show('omni-modal', { forgeSettings: value, onChange })}>
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDisconnect}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Omni server to send notifications to WhatsApp, Discord, or Telegram.
            </p>
            <Button onClick={() => NiceModal.show('omni-modal', { forgeSettings: value, onChange })}>
              Configure Omni
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
