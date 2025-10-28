import React, { useEffect, useState } from 'react';
import { useUserSystem } from '@/components/config-provider';
import { Loader } from '@/components/ui/loader';
import NiceModal from '@ebay/nice-modal-react';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { config, loading, githubTokenInvalid } = useUserSystem();
  const [authRequired, setAuthRequired] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load auth requirement flag from backend
  useEffect(() => {
    const checkAuthRequired = async () => {
      try {
        const response = await fetch('/api/forge/auth-required');
        const data = await response.json();
        setAuthRequired(data.auth_required ?? false);
      } catch (error) {
        console.error('Failed to check auth requirement:', error);
        setAuthRequired(false); // Default to not required if check fails
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthRequired();
  }, []);

  // Check if user is authenticated
  const isAuthenticated =
    !!(config?.github?.username && config?.github?.oauth_token) &&
    !githubTokenInvalid;

  // If auth is required but user is not authenticated, show login
  if (authRequired && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {loading || authLoading ? (
          <Loader message="Loading authentication..." size={32} />
        ) : (
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Authentication Required</h1>
              <p className="text-muted-foreground">
                Please sign in with GitHub to continue
              </p>
            </div>
            <button
              onClick={() => {
                NiceModal.show('github-login');
              }}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign in with GitHub
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show loading while checking auth status
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader message="Loading..." size={32} />
      </div>
    );
  }

  // Auth not required or user is authenticated, show app
  return <>{children}</>;
};
