-- Create auxiliary tables for forge extensions
-- These tables store forge-specific data without modifying upstream schema

-- Forge task extensions (e.g., branch templates per task)
CREATE TABLE IF NOT EXISTS forge_task_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forge project settings (future: project-specific configurations)
CREATE TABLE IF NOT EXISTS forge_project_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forge omni notifications (e.g., notification history or configs per task/project)
CREATE TABLE IF NOT EXISTS forge_omni_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    instance_name TEXT,
    recipient TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent',
    message TEXT
);

-- Views for compatibility (join upstream tables with extensions)
CREATE OR REPLACE VIEW tasks_with_extensions AS
SELECT 
    t.*,
    fte.branch_template
FROM tasks t
LEFT JOIN forge_task_extensions fte ON t.id = fte.task_id;

CREATE OR REPLACE VIEW projects_with_settings AS
SELECT 
    p.*,
    fps.settings
FROM projects p
LEFT JOIN forge_project_settings fps ON p.id = fps.project_id;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forge_task_extensions_task_id ON forge_task_extensions(task_id);
CREATE INDEX IF NOT EXISTS idx_forge_project_settings_project_id ON forge_project_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_task_id ON forge_omni_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_project_id ON forge_omni_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_forge_omni_notifications_sent_at ON forge_omni_notifications(sent_at);