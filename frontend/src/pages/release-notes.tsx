import { useEffect, useState } from 'react';
import { ExternalLink, Calendar, Tag } from 'lucide-react';
import { H1, H2 } from '@/components/ui/typography';

interface GitHubRelease {
  id: number;
  name: string;
  tag_name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
}

export default function ReleaseNotesPage() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch from static releases.json to avoid GitHub API rate limits
    fetch('/releases.json')
      .then((res) => res.json())
      .then((data) => {
        setReleases(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading release notes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600">
          <p>Failed to load releases: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <H1 className="text-gray-900 dark:text-white mb-2">Release Notes</H1>
          <p className="text-gray-600 dark:text-gray-400">
            Latest updates and improvements to Automagik Forge
          </p>
        </div>

        <div className="space-y-6">
          {releases.map((release) => (
            <div
              key={release.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <H2 className="text-gray-900 dark:text-white">
                      {release.name || release.tag_name}
                    </H2>
                    {release.prerelease && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                        Pre-release
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      <span>{release.tag_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(release.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                >
                  View on GitHub
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <div
                  className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: release.body
                      .replace(/#{1,6}\s+(.+)/g, '<strong>$1</strong>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(
                        /`(.+?)`/g,
                        '<code class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">$1</code>'
                      )
                      .replace(/\n\n/g, '</p><p class="mt-2">')
                      .replace(/^/, '<p>')
                      .replace(/$/, '</p>'),
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {releases.length === 0 && (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No releases yet.
          </div>
        )}
      </div>
    </div>
  );
}
