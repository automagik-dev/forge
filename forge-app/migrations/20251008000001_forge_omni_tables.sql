-- Forge Omni Extension Tables
-- Single migration to add Omni notification support on top of upstream schema

-- Global Omni settings
CREATE TABLE IF NOT EXISTS forge_global_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    forge_config TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize global settings row
INSERT OR IGNORE INTO forge_global_settings (id, forge_config) VALUES (1, '{}');

-- Per-project Omni settings
CREATE TABLE IF NOT EXISTS forge_project_settings (
    project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    custom_executors TEXT,
    forge_config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Omni notification queue
CREATE TABLE IF NOT EXISTS forge_omni_notifications (
    id TEXT PRIMARY KEY,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    notification_type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_task_id ON forge_omni_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_status ON forge_omni_notifications(status);
CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_sent_at ON forge_omni_notifications(sent_at);

-- Triggers
CREATE TRIGGER IF NOT EXISTS update_forge_global_settings_updated_at
AFTER UPDATE ON forge_global_settings
BEGIN
    UPDATE forge_global_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_forge_project_settings_updated_at
AFTER UPDATE ON forge_project_settings
BEGIN
    UPDATE forge_project_settings SET updated_at = CURRENT_TIMESTAMP WHERE project_id = NEW.project_id;
END;
