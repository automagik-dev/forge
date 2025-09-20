-- Auxiliary tables for forge-specific features
-- These extend upstream tables without modifying them

-- Task extensions table for forge-specific task metadata
CREATE TABLE forge_task_extensions (
    task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template TEXT,
    omni_settings TEXT, -- JSON string for OmniConfig
    genie_metadata TEXT, -- JSON string for Genie-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Project extensions table for forge-specific project settings
CREATE TABLE forge_project_settings (
    project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    custom_executors TEXT, -- JSON string for custom executor configurations
    forge_config TEXT, -- JSON string for forge-specific config
    omni_config TEXT, -- JSON string for project-specific Omni settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Omni notifications tracking
CREATE TABLE forge_omni_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 'task_created', 'task_completed', 'task_failed'
    settings TEXT, -- JSON string for notification-specific settings
    sent_at TIMESTAMP,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forge_task_extensions_task_id ON forge_task_extensions(task_id);
CREATE INDEX idx_forge_project_settings_project_id ON forge_project_settings(project_id);
CREATE INDEX idx_forge_omni_notifications_task_id ON forge_omni_notifications(task_id);
CREATE INDEX idx_forge_omni_notifications_status ON forge_omni_notifications(status);

-- Views for convenient access that join upstream and forge data
CREATE VIEW enhanced_tasks AS
SELECT
    t.*,
    fx.branch_template,
    fx.omni_settings,
    fx.genie_metadata
FROM tasks t
LEFT JOIN forge_task_extensions fx ON t.id = fx.task_id;

CREATE VIEW enhanced_projects AS
SELECT
    p.*,
    fps.custom_executors,
    fps.forge_config,
    fps.omni_config
FROM projects p
LEFT JOIN forge_project_settings fps ON p.id = fps.project_id;

-- Trigger to update updated_at timestamp
CREATE TRIGGER forge_task_extensions_updated_at
    AFTER UPDATE ON forge_task_extensions
    FOR EACH ROW
BEGIN
    UPDATE forge_task_extensions SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;

CREATE TRIGGER forge_project_settings_updated_at
    AFTER UPDATE ON forge_project_settings
    FOR EACH ROW
BEGIN
    UPDATE forge_project_settings SET updated_at = CURRENT_TIMESTAMP WHERE project_id = NEW.project_id;
END;