import { useEffect, useState } from 'react';
import { Activity, AlertCircle, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
}

interface LatestRelease {
  tag_name: string;
  html_url: string;
}

export function Footer() {
  const { t } = useTranslation('common');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(
    null
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Fetch health status once on mount
    fetch('/health')
      .then((res) => res.json())
      .then((data) => {
        const currentVersion = data.version || '0.0.0';
        setHealth({
          status: data.status === 'ok' ? 'healthy' : 'unhealthy',
          version: currentVersion,
        });

        // Fetch latest version from NPM registry (once per page load)
        fetch('https://registry.npmjs.org/automagik-forge/latest')
          .then((res) => res.json())
          .then((npmData) => {
            if (npmData.version) {
              setLatestRelease({
                tag_name: `v${npmData.version}`,
                html_url: `https://www.npmjs.com/package/automagik-forge/v/${npmData.version}`,
              });

              // Proper semver comparison using localeCompare
              const current = currentVersion.replace(/^v/, '');
              const latest = npmData.version;

              // Split versions and compare numerically
              const currentParts = current
                .split(/[.-]/)
                .map((p: string) => parseInt(p) || 0);
              const latestParts = latest
                .split(/[.-]/)
                .map((p: string) => parseInt(p) || 0);

              // Compare major.minor.patch
              for (
                let i = 0;
                i < Math.max(currentParts.length, latestParts.length);
                i++
              ) {
                const curr = currentParts[i] || 0;
                const lat = latestParts[i] || 0;
                if (lat > curr) {
                  setUpdateAvailable(true);
                  break;
                } else if (lat < curr) {
                  break;
                }
              }
            }
          })
          .catch(() => {
            // Silently fail - update check is optional
          });
      })
      .catch(() => {
        setHealth({ status: 'unhealthy', version: '0.0.0' });
      });
  }, []); // Run only once on mount

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
              src="/logo-dark.svg"
              alt="Namastex Labs"
              className="h-3.5 w-auto dark:hidden"
            />
            <img
              src="/logo-light.svg"
              alt="Namastex Labs"
              className="h-3.5 w-auto hidden dark:block"
            />
          </a>
          <span className="text-muted-foreground/60">•</span>
          <span className="italic text-muted-foreground/80">
            {t('footer.tagline')}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-muted-foreground/70">
            {t('footer.crafted')}{' '}
            <a
              href="https://namastex.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground transition-colors"
            >
              Namastex Labs
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
              <span>{t('footer.updateAvailable')}</span>
            </a>
          )}

          {/* Health Status */}
          {health && (
            <div
              className="flex items-center gap-1.5"
              title={`Status: ${health.status}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${getHealthColor()} animate-pulse`}
              />
              <Activity className="w-3 h-3" />
              <span className="capitalize">{health.status}</span>
            </div>
          )}

          {!health && (
            <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="w-3 h-3" />
              <span>{t('footer.connecting')}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
