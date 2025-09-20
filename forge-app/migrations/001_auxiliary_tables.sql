-- Create auxiliary tables for forge-specific features
-- These tables extend the upstream schema without modifying it

-- Table for task-specific forge extensions (branch templates, omni settings, etc.)
CREATE TABLE forge_task_extensions (
    task_id INTEGER PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template TEXT,
    omni_settings JSONB,  -- Stores Omni notification settings for the task
    genie_metadata JSONB, -- Stores Genie/Claude integration metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for project-specific forge settings
CREATE TABLE forge_project_settings (
    project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    custom_executors JSONB,  -- Custom executor configurations
    forge_config JSONB,      -- Additional forge-specific project settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forge_task_extensions_task_id ON forge_task_extensions(task_id);
CREATE INDEX idx_forge_project_settings_project_id ON forge_project_settings(project_id);