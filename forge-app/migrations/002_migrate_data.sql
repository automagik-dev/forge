-- Migrate existing data from upstream tables to auxiliary tables
-- This script handles the transition from the fork to the new architecture

-- Migrate branch_template from tasks table to forge_task_extensions
-- Only migrate tasks that have a branch_template value
INSERT INTO forge_task_extensions (task_id, branch_template)
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL
AND branch_template != '';

-- Note: After this migration is complete and verified, the branch_template column
-- should be removed from the upstream tasks table in a future migration
-- For now, we keep it to ensure data integrity during the transition

-- Migrate any existing Omni configurations from project settings if they exist
-- This is a placeholder - actual data depends on how Omni was previously stored
-- INSERT INTO forge_project_settings (project_id, omni_config)
-- SELECT id, omni_settings
-- FROM projects
-- WHERE omni_settings IS NOT NULL;

-- Log the migration results
-- Note: SQLite doesn't have a standard logging mechanism, so we'll rely on
-- the application to verify the migration was successful

-- Verification queries (to be run manually after migration):
-- SELECT COUNT(*) as total_tasks FROM tasks;
-- SELECT COUNT(*) as tasks_with_branch_template FROM tasks WHERE branch_template IS NOT NULL;
-- SELECT COUNT(*) as migrated_extensions FROM forge_task_extensions WHERE branch_template IS NOT NULL;

-- The counts should match: tasks_with_branch_template == migrated_extensions