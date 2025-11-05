-- Forge Task Attempt Config Table
-- Stores forge-specific configuration for task attempts
-- Default to use_worktree=TRUE for backward compatibility (existing behavior)
-- Master Genie tasks will explicitly set use_worktree=FALSE to run on current branch

CREATE TABLE IF NOT EXISTS forge_task_attempt_config (
    task_attempt_id BLOB PRIMARY KEY NOT NULL,
    use_worktree BOOLEAN NOT NULL DEFAULT 1, -- TRUE = create worktree, FALSE = use main repo
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (task_attempt_id) REFERENCES task_attempts(id) ON DELETE CASCADE
);

-- Index for fast lookups
CREATE INDEX idx_forge_task_attempt_config_attempt ON forge_task_attempt_config(task_attempt_id);
