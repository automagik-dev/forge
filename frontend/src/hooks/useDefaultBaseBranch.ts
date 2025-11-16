import { useEffect, useState } from 'react';

const STORAGE_KEY = 'forge:defaultBaseBranch';

/**
 * Hook to manage the default base branch for new task attempts.
 * This is stored per-project in localStorage.
 */
export function useDefaultBaseBranch(projectId: string | undefined) {
  const [defaultBranch, setDefaultBranch] = useState<string>('main');

  useEffect(() => {
    if (!projectId) return;

    // Load from localStorage
    const stored = localStorage.getItem(`${STORAGE_KEY}:${projectId}`);
    if (stored) {
      setDefaultBranch(stored);
    } else {
      // Default to 'main' if not set
      setDefaultBranch('main');
    }
  }, [projectId]);

  const updateDefaultBranch = (branch: string) => {
    if (!projectId) return;

    setDefaultBranch(branch);
    localStorage.setItem(`${STORAGE_KEY}:${projectId}`, branch);
  };

  return {
    defaultBranch,
    setDefaultBranch: updateDefaultBranch,
  };
}
