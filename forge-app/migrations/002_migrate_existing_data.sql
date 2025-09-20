-- Migration to populate auxiliary tables from existing data
-- This migration handles the transition from embedded fields to auxiliary tables

-- Insert default forge_task_extensions for existing tasks
-- This ensures all tasks have an entry in the extensions table
INSERT OR IGNORE INTO forge_task_extensions (task_id, branch_template, omni_settings, genie_metadata)
SELECT
    id as task_id,
    NULL as branch_template,  -- Will be populated as tasks are updated
    NULL as omni_settings,    -- Default to no Omni notifications
    NULL as genie_metadata    -- Default to no Genie metadata
FROM tasks;

-- Insert default forge_project_settings for existing projects
INSERT OR IGNORE INTO forge_project_settings (project_id, custom_executors, forge_config)
SELECT
    id as project_id,
    NULL as custom_executors,  -- Default to no custom executors
    NULL as forge_config       -- Default to no additional config
FROM projects;

-- Note: Actual data migration from embedded fields would happen here
-- For example, if branch_template was previously stored in tasks table:
-- UPDATE forge_task_extensions
-- SET branch_template = tasks.branch_template
-- FROM tasks
-- WHERE forge_task_extensions.task_id = tasks.id;