-- Data migration script to move forge-specific data from upstream tables to auxiliary tables
-- This migration is idempotent and can be run multiple times safely

-- Migrate branch_template data from tasks table to forge_task_extensions
-- Note: Only migrates if data exists and hasn't been migrated yet
INSERT OR REPLACE INTO forge_task_extensions (task_id, branch_template)
SELECT
    CAST(id AS TEXT),
    branch_template
FROM tasks
WHERE branch_template IS NOT NULL
    AND branch_template != ''
    AND NOT EXISTS (
        SELECT 1 FROM forge_task_extensions
        WHERE task_id = CAST(tasks.id AS TEXT)
    );

-- Update existing records if branch_template has changed
UPDATE forge_task_extensions
SET
    branch_template = (
        SELECT branch_template
        FROM tasks
        WHERE CAST(tasks.id AS TEXT) = forge_task_extensions.task_id
            AND tasks.branch_template IS NOT NULL
            AND tasks.branch_template != ''
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1 FROM tasks
    WHERE CAST(tasks.id AS TEXT) = forge_task_extensions.task_id
        AND tasks.branch_template IS NOT NULL
        AND tasks.branch_template != ''
        AND tasks.branch_template != forge_task_extensions.branch_template
);

-- IMPORTANT: Do NOT drop the branch_template column from tasks table yet
-- This allows for rollback if needed. The column will be dropped in a future migration
-- after verifying the auxiliary table approach works correctly.

-- Add a migration log entry (if we have a migrations table)
-- This helps track what migrations have been run
CREATE TABLE IF NOT EXISTS forge_migration_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

INSERT INTO forge_migration_log (migration_name, notes)
VALUES (
    '002_migrate_data',
    'Migrated branch_template data from tasks table to forge_task_extensions auxiliary table'
);

-- Verification query (commented out, but can be run manually to verify migration)
-- SELECT
--     COUNT(*) as total_branch_templates_in_tasks,
--     (SELECT COUNT(*) FROM forge_task_extensions WHERE branch_template IS NOT NULL) as migrated_to_auxiliary
-- FROM tasks
-- WHERE branch_template IS NOT NULL;