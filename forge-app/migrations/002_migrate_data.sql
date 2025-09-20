-- Migration script to transfer existing forge data from modified upstream tables
-- to auxiliary tables

-- Note: This migration assumes the upstream database is available
-- and contains tasks with branch_template field that needs to be migrated

-- Migrate branch_template data from tasks table to auxiliary table
-- This will be run once during the migration from fork to upstream-library architecture
--
-- INSERT INTO forge_task_extensions (task_id, branch_template)
-- SELECT id, branch_template
-- FROM tasks
-- WHERE branch_template IS NOT NULL
-- ON CONFLICT(task_id) DO UPDATE SET
--     branch_template = excluded.branch_template,
--     updated_at = CURRENT_TIMESTAMP;

-- Note: Uncomment the above INSERT statement when running the actual migration
-- Currently commented out as the upstream tables don't exist yet in this setup

-- Create compatibility view for applications expecting the old schema
CREATE VIEW IF NOT EXISTS enhanced_tasks AS
SELECT
    t.*,
    fx.branch_template as forge_branch_template,
    fx.omni_settings as forge_omni_settings,
    fx.genie_metadata as forge_genie_metadata
FROM (
    -- Placeholder for upstream tasks table
    -- In production, this will be: FROM upstream.tasks t
    SELECT
        '00000000-0000-0000-0000-000000000000' as id,
        '00000000-0000-0000-0000-000000000000' as project_id,
        'Sample Task' as title,
        'Sample Description' as description,
        'todo' as status,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
) t
LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id;

-- Create view for enhanced projects with forge settings
CREATE VIEW IF NOT EXISTS enhanced_projects AS
SELECT
    p.*,
    fps.custom_executors as forge_custom_executors,
    fps.forge_config as forge_config
FROM (
    -- Placeholder for upstream projects table
    -- In production, this will be: FROM upstream.projects p
    SELECT
        '00000000-0000-0000-0000-000000000000' as id,
        'Sample Project' as name,
        'Sample Repository' as repository,
        CURRENT_TIMESTAMP as created_at,
        CURRENT_TIMESTAMP as updated_at
) p
LEFT JOIN forge_project_settings fps ON p.id = fps.project_id;