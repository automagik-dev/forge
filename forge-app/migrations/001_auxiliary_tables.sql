-- Create auxiliary tables for forge-specific features
-- This migration creates tables to store forge extensions data

-- Table for task-specific extensions (branch templates, omni settings, etc.)
CREATE TABLE forge_task_extensions (
    task_id INTEGER PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template TEXT,
    omni_settings JSONB,
    genie_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for project-specific forge settings
CREATE TABLE forge_project_settings (
    project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    custom_executors JSONB,
    forge_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for omni notification history
CREATE TABLE forge_omni_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    instance_name TEXT NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed', 'pending'
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_forge_task_extensions_task_id ON forge_task_extensions(task_id);
CREATE INDEX idx_forge_project_settings_project_id ON forge_project_settings(project_id);
CREATE INDEX idx_forge_omni_notifications_task_id ON forge_omni_notifications(task_id);
CREATE INDEX idx_forge_omni_notifications_status ON forge_omni_notifications(status);