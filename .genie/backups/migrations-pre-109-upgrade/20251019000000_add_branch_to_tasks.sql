-- Add branch field to tasks table
-- This field stores the target branch name (e.g., "feat/wish-slug")
-- that will be created and pushed to remote for wish tasks
-- Worktrees still auto-created per attempt, but merge to this branch

ALTER TABLE tasks ADD COLUMN branch TEXT DEFAULT NULL;
