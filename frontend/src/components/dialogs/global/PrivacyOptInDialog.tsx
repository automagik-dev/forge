import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useUserSystem } from '@/components/config-provider';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useState } from 'react';

const PrivacyOptInDialog = NiceModal.create(() => {
  const modal = useModal();
  const { config } = useUserSystem();
  const [contactEmailOptIn, setContactEmailOptIn] = useState(true);
  const [contactUsernameOptIn, setContactUsernameOptIn] = useState(false);

  // Check if user is authenticated with GitHub
  const isGitHubAuthenticated =
    config?.github?.username && config?.github?.oauth_token;

  // Check if user is a namastexer
  const isNamestexer = config?.github?.primary_email?.endsWith('@namastex.ai');

  const handleOptIn = () => {
    modal.resolve({
      analytics_enabled: true,
      contact_email_opt_in: contactEmailOptIn,
      contact_username_opt_in: contactUsernameOptIn,
    });
    modal.hide();
  };

  const handleOptOut = () => {
    modal.resolve({
      analytics_enabled: false,
      contact_email_opt_in: false,
      contact_username_opt_in: false,
    });
    modal.hide();
  };

  return (
    <Dialog open={modal.visible} uncloseable={true}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary text-primary-foreground" />
            <DialogTitle>Help Us Build Better</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-1">
            Share anonymous usage data to help us build the features you need,
            fix bugs faster, and keep Forge blazing fast.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">How this helps you:</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Faster bug fixes</p>
                  <p className="text-xs text-muted-foreground">
                    We'll know about crashes before you report them
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Features you actually want
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We prioritize based on what you use most
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Optimized performance</p>
                  <p className="text-xs text-muted-foreground">
                    We focus optimization where you spend your time
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">What we track:</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Which features you use (not what you type)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Performance metrics (load times, not content)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Error types (what broke, not your data)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Browser & OS (for compatibility)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Anonymous session patterns</span>
              </div>
            </div>
          </div>

          <div className="bg-green-500/10 p-3 rounded-lg">
            <p className="text-xs font-medium text-green-700 dark:text-green-400">
              🔒 Your privacy protected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No task content, code, project names, or personal messages. Just
              anonymous patterns to improve the app.
            </p>
          </div>

          {/* Special notice for Namastexers */}
          {isNamestexer && (
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-400">
                🚀 Namastex Team Member
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                As part of the team, we track additional metrics to ensure
                product quality. This is mandatory for @namastex.ai accounts.
              </p>
            </div>
          )}

          {/* Optional contact consent for non-namastexers */}
          {isGitHubAuthenticated && !isNamestexer && (
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-xs font-medium">Stay connected (optional):</p>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="contact-email"
                  checked={contactEmailOptIn}
                  onChange={(e) => setContactEmailOptIn(e.target.checked)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="contact-email"
                  className="text-xs cursor-pointer"
                >
                  <span className="font-medium">Share email for updates</span>
                  <p className="text-muted-foreground mt-0.5">
                    Critical updates only. No spam, no marketing.
                  </p>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="contact-username"
                  checked={contactUsernameOptIn}
                  onChange={(e) => setContactUsernameOptIn(e.target.checked)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="contact-username"
                  className="text-xs cursor-pointer"
                >
                  <span className="font-medium">Share GitHub username</span>
                  <p className="text-muted-foreground mt-0.5">
                    Let us credit you in release notes and contributors list.
                  </p>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
            <Settings className="h-3 w-3 flex-shrink-0" />
            <span>You can change these preferences anytime in Settings.</span>
          </div>
        </div>

        <DialogFooter className="gap-3 flex-col sm:flex-row pt-2">
          <Button variant="outline" onClick={handleOptOut} className="flex-1">
            <XCircle className="h-4 w-4 mr-2" />
            No thanks
          </Button>
          <Button onClick={handleOptIn} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Yes, help improve Automagik Forge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export { PrivacyOptInDialog };
