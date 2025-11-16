import { useEffect, useState } from 'react';

const STORAGE_KEY = 'forge:defaultBaseBranch';

/**
 * Hook to manage the default base branch for new task attempts.
 * This is stored per-project in localStorage.
 * Returns null if no preference is saved, allowing fallback to current branch.
 */
export function useDefaultBaseBranch(projectId: string | undefined) {
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    // Load from localStorage
    const stored = localStorage.getItem(`${STORAGE_KEY}:${projectId}`);
    if (stored) {
      setDefaultBranch(stored);
    } else {
      // Return null if no preference - let CreateAttemptDialog use current branch
      setDefaultBranch(null);
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
