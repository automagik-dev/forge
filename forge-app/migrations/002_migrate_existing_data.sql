-- Migrate existing branch_template data from tasks table to forge_task_extensions
-- This migration moves existing data to the new auxiliary table structure

-- Insert existing branch_template data into forge_task_extensions
INSERT OR IGNORE INTO forge_task_extensions (task_id, branch_template, created_at, updated_at)
SELECT id, branch_template, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM tasks
WHERE branch_template IS NOT NULL AND branch_template != '';

-- Remove the branch_template column from tasks table after migration
-- Note: This should be done after confirming all data is migrated successfully
-- ALTER TABLE tasks DROP COLUMN branch_template;