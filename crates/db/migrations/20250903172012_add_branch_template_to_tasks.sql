-- Add branch_template column to tasks table for user-defined branch naming patterns
ALTER TABLE tasks ADD COLUMN branch_template TEXT;