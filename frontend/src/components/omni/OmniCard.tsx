// no local state needed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export function OmniCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Omni Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Omni notifications are now managed by the forge control panel served at
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">/</code>.
        </p>
        <p className="leading-relaxed">
          Visit the forge UI to update credentials, toggle notification channels, and
          configure project-level overrides. Legacy settings remain available in read-only
          mode until migration is complete.
        </p>
      </CardContent>
    </Card>
  );
}
