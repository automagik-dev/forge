-- Create auxiliary table for forge-specific task extensions
-- This table stores branch templates and other forge-specific data
CREATE TABLE forge_task_extensions (
    task_id INTEGER PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
    branch_template TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);