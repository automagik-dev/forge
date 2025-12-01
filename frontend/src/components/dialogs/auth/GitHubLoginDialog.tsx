import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useUserSystem } from '@/components/config-provider';
import {
  Check,
  Clipboard,
  Github,
  Key,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { githubAuthApi } from '@/lib/api';
import { DeviceFlowStartResponse, DevicePollStatus } from 'shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

type AuthMethod = 'selection' | 'oauth' | 'pat';

const GitHubLoginDialog = NiceModal.create(() => {
  const modal = useModal();
  const {
    config,
    loading,
    githubTokenInvalid,
    reloadSystem,
    updateAndSaveConfig,
  } = useUserSystem();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('selection');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceState, setDeviceState] =
    useState<null | DeviceFlowStartResponse>(null);
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pat, setPat] = useState('');
  const [savingPat, setSavingPat] = useState(false);

  const isAuthenticated =
    !!(config?.github?.username && config?.github?.oauth_token) &&
    !githubTokenInvalid;

  const handleOAuthLogin = async () => {
    setFetching(true);
    setError(null);
    setDeviceState(null);
    try {
      const data = await githubAuthApi.start();
      setDeviceState(data);
      setPolling(true);
      setAuthMethod('oauth');
    } catch (e) {
      console.error(e);
      setError((e as Error)?.message || 'Network error');
    } finally {
      setFetching(false);
    }
  };

  const handlePATSave = async () => {
    if (!config || !pat.trim()) return;
    setSavingPat(true);
    setError(null);
    try {
      await updateAndSaveConfig({
        github: {
          ...config.github,
          pat,
        },
      });
      await reloadSystem();
      modal.resolve(true);
      modal.hide();
    } catch (e) {
      console.error(e);
      setError((e as Error)?.message || 'Failed to save Personal Access Token');
    } finally {
      setSavingPat(false);
    }
  };

  const handleBack = () => {
    setAuthMethod('selection');
    setError(null);
    setDeviceState(null);
    setPolling(false);
    setPat('');
  };

  // Poll for completion
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (polling && deviceState) {
      const poll = async () => {
        try {
          const poll_status = await githubAuthApi.poll();
          switch (poll_status) {
            case DevicePollStatus.SUCCESS:
              setPolling(false);
              setError(null);
              await reloadSystem();
              modal.resolve(true);
              modal.hide();
              setDeviceState(null);
              break;
            case DevicePollStatus.AUTHORIZATION_PENDING:
              timer = setTimeout(poll, deviceState.interval * 1000);
              break;
            case DevicePollStatus.SLOW_DOWN:
              timer = setTimeout(poll, (deviceState.interval + 5) * 1000);
          }
        } catch (e) {
          if ((e as Error)?.message === 'expired_token') {
            setPolling(false);
            setError('Device code expired. Please try again.');
            setDeviceState(null);
          } else {
            setPolling(false);
            setError((e as Error)?.message || 'Login failed.');
            setDeviceState(null);
          }
        }
      };
      timer = setTimeout(poll, deviceState.interval * 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [polling, deviceState, modal, reloadSystem]);

  // Automatically copy code to clipboard and open GitHub URL when deviceState is set
  useEffect(() => {
    if (deviceState?.user_code) {
      copyToClipboard(deviceState.user_code);
    }
  }, [deviceState?.user_code, deviceState?.verification_uri]);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for environments where clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.warn('Copy to clipboard failed:', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => {
        if (!open) {
          modal.resolve(isAuthenticated ? true : false);
          modal.hide();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Github className="h-6 w-6" />
            <DialogTitle>Sign in with GitHub</DialogTitle>
          </div>
          <DialogDescription className="text-left pt-1">
            Connect your GitHub account to create and manage pull requests
            directly from Automagik Forge.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <Loader message="Loading…" size={32} className="py-8" />
        ) : isAuthenticated ? (
          <div className="space-y-4 py-3">
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Check className="h-8 w-8 text-green-500" />
                  <Github className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-lg font-medium mb-1">
                  Successfully connected!
                </div>
                <div className="text-sm text-muted-foreground">
                  You are signed in as <b>{config?.github?.username ?? ''}</b>
                </div>
              </CardContent>
            </Card>
            <DialogFooter>
              <Button
                onClick={() => {
                  modal.resolve(true);
                  modal.hide();
                }}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : authMethod === 'oauth' && deviceState ? (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-10 h-10 bg-background border rounded-full flex items-center justify-center text-lg font-semibold">
                1
              </span>
              <div>
                <p className="text-sm font-medium mb-1">
                  Go to GitHub Device Authorization
                </p>
                <a
                  href={deviceState.verification_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline flex items-center gap-1"
                >
                  {deviceState.verification_uri}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-10 h-10 bg-background border rounded-full flex items-center justify-center text-lg font-semibold">
                2
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-3">Enter this code:</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold tracking-[0.2em] bg-muted border flex h-9 px-2 items-center">
                    <span>{deviceState.user_code}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(deviceState.user_code)}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              <Github className="h-3 w-3 flex-shrink-0" />
              <span>
                {copied
                  ? 'Code copied to clipboard! Complete the authorization on GitHub.'
                  : 'Waiting for you to authorize this application on GitHub...'}
              </span>
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  modal.resolve(false);
                  modal.hide();
                }}
              >
                Skip
              </Button>
            </DialogFooter>
          </div>
        ) : authMethod === 'pat' ? (
          <div className="space-y-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-2">1. Create a token on GitHub:</p>
                <a
                  href="https://github.com/settings/tokens/new?description=Automagik%20Forge&scopes=repo,workflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Open GitHub Token Settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="text-sm">
                <p className="font-medium mb-2">2. Required permissions:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      repo
                    </code>{' '}
                    - Full repository access
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500" />
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      workflow
                    </code>{' '}
                    - Update GitHub Actions
                  </li>
                </ul>
              </div>

              <div className="text-sm">
                <p className="font-medium mb-2">3. Paste your token here:</p>
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Save your token securely - you won't be able to see it
                  again on GitHub
                </p>
              </div>
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <DialogFooter className="gap-3 flex-col sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  modal.resolve(false);
                  modal.hide();
                }}
                disabled={savingPat}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handlePATSave}
                disabled={savingPat || !pat.trim()}
                className="flex-1"
              >
                <Key className="h-4 w-4 mr-2" />
                {savingPat ? 'Saving...' : 'Save Token'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Why do you need GitHub access?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Create pull requests</p>
                    <p className="text-xs text-muted-foreground">
                      Generate PRs directly from your task attempts
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Manage repositories</p>
                    <p className="text-xs text-muted-foreground">
                      Access your repos to push changes and create branches
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Streamline workflow</p>
                    <p className="text-xs text-muted-foreground">
                      Skip manual PR creation and focus on coding
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Choose your authentication method:
              </p>

              {/* OAuth Card */}
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setAuthMethod('oauth')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      <CardTitle className="text-base">
                        OAuth Device Flow
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm space-y-1 text-muted-foreground mb-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Easiest setup
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Automatic permissions
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Secure and revocable
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOAuthLogin();
                    }}
                    disabled={fetching}
                  >
                    <Github className="mr-2 h-4 w-4" />
                    {fetching ? 'Starting…' : 'Continue with OAuth'}
                  </Button>
                </CardContent>
              </Card>

              {/* PAT Card */}
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setAuthMethod('pat')}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    <CardTitle className="text-base">
                      Personal Access Token
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm space-y-1 text-muted-foreground mb-3">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      More control over permissions
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Works in restricted environments
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      Requires manual token creation
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAuthMethod('pat');
                    }}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Use PAT Instead
                  </Button>
                </CardContent>
              </Card>
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  modal.resolve(false);
                  modal.hide();
                }}
                className="w-full"
              >
                Skip for now
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

export { GitHubLoginDialog };
