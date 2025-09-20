-- Auxiliary tables for forge-specific extensions
-- These tables reference upstream tables via foreign keys

-- Table for task-specific forge extensions
CREATE TABLE IF NOT EXISTS forge_task_extensions (
    task_id TEXT PRIMARY KEY,  -- UUID as TEXT, references upstream tasks.id
    branch_template TEXT,
    omni_settings TEXT,  -- JSON stored as TEXT for SQLite
    genie_metadata TEXT,  -- JSON stored as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for project-specific forge settings
CREATE TABLE IF NOT EXISTS forge_project_settings (
    project_id TEXT PRIMARY KEY,  -- UUID as TEXT, references upstream projects.id
    custom_executors TEXT,  -- JSON stored as TEXT
    forge_config TEXT,  -- JSON stored as TEXT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Omni notification history
CREATE TABLE IF NOT EXISTS forge_omni_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,  -- References upstream tasks.id
    notification_type TEXT NOT NULL,
    recipient TEXT,
    recipient_type TEXT,  -- 'phone' or 'user_id'
    instance_name TEXT,
    message TEXT,
    status TEXT,  -- 'sent', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_omni_notifications_task_id ON forge_omni_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_omni_notifications_created_at ON forge_omni_notifications(created_at);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_forge_task_extensions_timestamp
AFTER UPDATE ON forge_task_extensions
BEGIN
    UPDATE forge_task_extensions SET updated_at = CURRENT_TIMESTAMP WHERE task_id = NEW.task_id;
END;

CREATE TRIGGER IF NOT EXISTS update_forge_project_settings_timestamp
AFTER UPDATE ON forge_project_settings
BEGIN
    UPDATE forge_project_settings SET updated_at = CURRENT_TIMESTAMP WHERE project_id = NEW.project_id;
END;