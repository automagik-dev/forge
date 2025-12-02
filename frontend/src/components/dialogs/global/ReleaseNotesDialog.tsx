import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles } from 'lucide-react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
}

export const ReleaseNotesDialog = NiceModal.create(() => {
  const modal = useModal();
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (modal.visible) {
      fetchLatestStableRelease();
    }
  }, [modal.visible]);

  const fetchLatestStableRelease = async () => {
    try {
      // Fetch from static releases.json to avoid GitHub API rate limits
      const response = await fetch('/releases.json');
      const releases = await response.json();

      // Find the first stable (non-prerelease) release
      const stableRelease = releases.find((r: GitHubRelease) => !r.prerelease);

      if (stableRelease) {
        setRelease(stableRelease);
      } else {
        setError('No stable release found');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load release notes'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllReleases = () => {
    window.open('/release-notes', '_blank');
  };

  const handleViewOnGitHub = () => {
    if (release) {
      window.open(release.html_url, '_blank');
    }
  };

  const formatReleaseBody = (body: string) => {
    // Simple markdown-to-HTML conversion for release notes
    return body
      .replace(
        /#{1,6}\s+(.+)/g,
        '<strong class="text-lg block mt-4 mb-2">$1</strong>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(
        /`(.+?)`/g,
        '<code class="px-1.5 py-0.5 bg-muted rounded text-sm font-mono">$1</code>'
      )
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mt-2">');
  };

  return (
    <Dialog
      open={modal.visible}
      onOpenChange={(open) => {
        if (!open) {
          modal.resolve();
          modal.hide();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-500" />
            Welcome to Automagik Forge {release?.tag_name}!
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : release ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm leading-relaxed">
                  <strong className="text-purple-600 dark:text-purple-400">
                    Hey there, magical developer! ✨
                  </strong>
                  <br />
                  Your friendly neighborhood Genie here with some exciting
                  updates! I've been working hard to make your coding experience
                  even more automagik. Check out what's new in this release:
                </p>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: formatReleaseBody(
                      release.body || 'No release notes available.'
                    ),
                  }}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground">
                <p>
                  Released on{' '}
                  {new Date(release.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleViewAllReleases}>
            View All Releases
          </Button>
          {release && (
            <Button variant="outline" onClick={handleViewOnGitHub}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          )}
          <Button
            onClick={() => {
              modal.resolve();
              modal.hide();
            }}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            Let's Create! ✨
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
