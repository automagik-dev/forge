-- Auxiliary tables for forge extensions
-- These tables store forge-specific data without modifying upstream schema

-- Table for task extensions (branch templates, omni settings, genie metadata)
CREATE TABLE IF NOT EXISTS forge_task_extensions (
    task_id TEXT PRIMARY KEY,  -- UUID as TEXT to match SQLite conventions
    branch_template TEXT,
    omni_settings TEXT,  -- JSON blob for Omni notification preferences
    genie_metadata TEXT, -- JSON blob for Genie-related metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for project-level forge settings
CREATE TABLE IF NOT EXISTS forge_project_settings (
    project_id TEXT PRIMARY KEY,  -- UUID as TEXT
    custom_executors TEXT,  -- JSON blob for custom executor configurations
    forge_config TEXT,      -- JSON blob for project-specific forge config
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Omni notification history and configuration
CREATE TABLE IF NOT EXISTS forge_omni_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,  -- Can be NULL for system-level notifications
    notification_type TEXT NOT NULL,
    settings TEXT NOT NULL,  -- JSON blob with notification details
    status TEXT DEFAULT 'pending',  -- pending, sent, failed
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Genie wish execution history
CREATE TABLE IF NOT EXISTS forge_genie_wishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wish_id TEXT NOT NULL,
    task_id TEXT,  -- Associated task if any
    execution_status TEXT DEFAULT 'pending',  -- pending, running, completed, failed
    input_params TEXT,  -- JSON blob of input parameters
    output_data TEXT,   -- JSON blob of execution results
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_forge_task_extensions_updated
    ON forge_task_extensions(updated_at);

CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_task
    ON forge_omni_notifications(task_id);

CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_status
    ON forge_omni_notifications(status);

CREATE INDEX IF NOT EXISTS idx_forge_genie_wishes_task
    ON forge_genie_wishes(task_id);

CREATE INDEX IF NOT EXISTS idx_forge_genie_wishes_status
    ON forge_genie_wishes(execution_status);

-- Compatibility view that joins tasks with their forge extensions
-- This allows existing queries to work with minimal changes
CREATE VIEW IF NOT EXISTS enhanced_tasks AS
SELECT
    t.*,
    fx.branch_template,
    fx.omni_settings,
    fx.genie_metadata
FROM tasks t
LEFT JOIN forge_task_extensions fx ON CAST(t.id AS TEXT) = fx.task_id;

-- View for projects with forge settings
CREATE VIEW IF NOT EXISTS enhanced_projects AS
SELECT
    p.*,
    fps.custom_executors,
    fps.forge_config
FROM projects p
LEFT JOIN forge_project_settings fps ON CAST(p.id AS TEXT) = fps.project_id;