import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
}

interface LatestRelease {
  tag_name: string;
  html_url: string;
}

export function Footer() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Fetch health status
    fetch('/health')
      .then(res => res.json())
      .then(data => {
        setHealth({
          status: data.status === 'ok' ? 'healthy' : 'unhealthy',
          version: data.version || '0.0.0',
        });
      })
      .catch(() => {
        setHealth({ status: 'unhealthy', version: '0.0.0' });
      });

    // Fetch latest version from NPM registry
    fetch('https://registry.npmjs.org/automagik-forge/latest')
      .then(res => res.json())
      .then(data => {
        if (data.version) {
          setLatestRelease({
            tag_name: `v${data.version}`,
            html_url: `https://www.npmjs.com/package/automagik-forge/v/${data.version}`,
          });

          // Compare with current version
          if (health) {
            const currentVersion = health.version.replace(/^v/, '');
            const latestVersion = data.version;

            // Simple version comparison (works for semver)
            if (latestVersion > currentVersion) {
              setUpdateAvailable(true);
            }
          }
        }
      })
      .catch(() => {
        // Silently fail - update check is optional
      });
  }, [health]);

  const getHealthColor = () => {
    if (!health) return 'bg-gray-400';
    return health.status === 'healthy' ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <footer className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-1 text-xs text-muted-foreground">
        {/* Left: Logo, Tagline & Credits */}
        <div className="flex items-center gap-3">
          <a
            href="https://namastex.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/nmstx-logo.svg"
              alt="Namastex Labs"
              className="h-3.5 w-auto opacity-50 dark:opacity-100"
            />
          </a>
          <span className="text-muted-foreground/60">•</span>
          <span className="italic text-muted-foreground/80">
            AI that elevates human potential, not replaces it
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-muted-foreground/70">
            Crafted with 💙 by{' '}
            <a
              href="https://namastex.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              Automagik Genie
            </a>
          </span>
        </div>

        {/* Right: Version, Health, Update */}
        <div className="flex items-center gap-4">
          {/* Version */}
          {health && (
            <Link
              to="/release-notes"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <span>v{health.version}</span>
            </Link>
          )}

          {/* Update Available */}
          {updateAvailable && latestRelease && (
            <a
              href={latestRelease.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              title={`Update available: ${latestRelease.tag_name}`}
            >
              <Download className="w-3 h-3" />
              <span>Update available</span>
            </a>
          )}

          {/* Health Status */}
          {health && (
            <div className="flex items-center gap-1.5" title={`Status: ${health.status}`}>
              <div className={`w-2 h-2 rounded-full ${getHealthColor()} animate-pulse`} />
              <Activity className="w-3 h-3" />
              <span className="capitalize">{health.status}</span>
            </div>
          )}

          {!health && (
            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-3 h-3" />
              <span>Connecting...</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
