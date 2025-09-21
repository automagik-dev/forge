// no local state needed
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
import { useUserSystem } from '@/components/config-provider';

export function OmniCard() {
  const { config, updateConfig } = useUserSystem();
  // NiceModal controls the OmniModal; no local state needed
  
  const isConfigured = !!(
    config?.omni?.host && 
    config?.omni?.api_key &&
    config?.omni?.instance &&
    config?.omni?.recipient
  );

  return (
    <>
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
              checked={config?.omni?.enabled ?? false}
              onCheckedChange={(checked: boolean) =>
                updateConfig({
                  omni: {
                    enabled: checked,
                    host: config?.omni?.host ?? null,
                    api_key: config?.omni?.api_key ?? null,
                    instance: config?.omni?.instance ?? null,
                    recipient: config?.omni?.recipient ?? null,
                    recipient_type: config?.omni?.recipient_type ?? null,
                  },
                })
              }
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
                  Connected to {config.omni.instance}
                </p>
                <p className="text-sm text-muted-foreground">
                  Recipient: {config.omni.recipient}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Manage <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => NiceModal.show('omni-modal')}>
                    Configure
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      updateConfig({
                        omni: {
                          enabled: false,
                          host: null,
                          api_key: null,
                          instance: null,
                          recipient: null,
                          recipient_type: null,
                        },
                      });
                    }}
                  >
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
              <Button onClick={() => NiceModal.show('omni-modal')}>
                Configure Omni
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
    </>
  );
}
