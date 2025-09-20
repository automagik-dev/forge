-- Migrate existing data from tasks table to auxiliary tables
-- This migration moves forge-specific data to the new auxiliary tables

-- Migrate branch_template data from tasks to forge_task_extensions
INSERT INTO forge_task_extensions (task_id, branch_template)
SELECT id, branch_template
FROM tasks
WHERE branch_template IS NOT NULL;

-- Note: Other migrations will handle omni settings and genie metadata
-- as those features are implemented

-- Create a view for enhanced tasks that combines upstream tasks with forge extensions
CREATE VIEW enhanced_tasks AS
SELECT
    t.*,
    fte.branch_template,
    fte.omni_settings,
    fte.genie_metadata
FROM tasks t
LEFT JOIN forge_task_extensions fte ON t.id = fte.task_id;

-- Create a view for enhanced projects that combines upstream projects with forge settings
CREATE VIEW enhanced_projects AS
SELECT
    p.*,
    fps.custom_executors,
    fps.forge_config
FROM projects p
LEFT JOIN forge_project_settings fps ON p.id = fps.project_id;