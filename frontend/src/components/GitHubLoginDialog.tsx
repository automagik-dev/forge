import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { useConfig } from './config-provider';

function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'missing_credentials':
      return 'Server is missing GitHub App credentials.';
    case 'exchange_failed':
      return 'Failed to exchange code for access token. Please try again.';
    case 'no_access_token':
      return 'No access token received from GitHub.';
    case 'user_fetch_failed':
      return 'Failed to fetch user info from GitHub.';
    case 'email_fetch_failed':
      return 'Failed to fetch your email from GitHub.';
    case 'config_save_failed':
      return 'Failed to save your login info. Please try again.';
    default:
      return 'An unknown error occurred during GitHub login.';
  }
}

export function GitHubLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { config, loading } = useConfig();
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('oauth_error');
    if (oauthError) {
      setError(getOAuthErrorMessage(oauthError));
      params.delete('oauth_error');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const isAuthenticated = !!(
    config?.github?.username && config?.github?.token
  );

  const handleLogin = async () => {
    setFetching(true);
    setError(null);
    try {
      const state = encodeURIComponent(window.location.href);
      const res = await fetch(`/api/auth/github/login?state=${state}`);
      const data = await res.json();
      if (data.success && data.data) {
        window.location.href = data.data;
      } else {
        setError(data.message || 'Failed to get GitHub login URL');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setFetching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in with GitHub</DialogTitle>
          <DialogDescription>
            Connect your GitHub account to use all features of Vibe Kanban.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center">Loading…</div>
        ) : isAuthenticated ? (
          <div className="py-8 text-center">
            <div className="mb-2">You are signed in as <b>{config?.github?.username ?? ''}</b>.</div>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <>
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <DialogFooter>
              <Button onClick={handleLogin} disabled={fetching}>
                {fetching ? 'Redirecting…' : 'Sign in with GitHub'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 