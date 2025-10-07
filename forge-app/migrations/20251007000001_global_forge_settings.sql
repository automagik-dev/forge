-- Global forge settings table (not tied to any project)
CREATE TABLE IF NOT EXISTS forge_global_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Enforce single row
    forge_config TEXT NOT NULL, -- JSON for forge-specific global settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to maintain updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_forge_global_settings_updated_at
AFTER UPDATE ON forge_global_settings
BEGIN
    UPDATE forge_global_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
