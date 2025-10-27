-- Forge Agents Table
-- Each agent type (wish, forge, review) has ONE fixed task per project
-- These are master orchestrators for the Genie MCP neural network
-- Subtasks and attempts are created normally with parent_task_attempt references

CREATE TABLE IF NOT EXISTS forge_agents (
    id BLOB PRIMARY KEY NOT NULL,
    project_id BLOB NOT NULL,
    agent_type TEXT NOT NULL, -- 'wish', 'forge', 'review', 'master' (WorkflowType from automagik-genie MCP)
    task_id BLOB NOT NULL, -- Reference to the fixed task in tasks table
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,

    -- One agent type per project
    UNIQUE(project_id, agent_type)
);

-- Index for fast lookups
CREATE INDEX idx_forge_agents_project ON forge_agents(project_id);
CREATE INDEX idx_forge_agents_type ON forge_agents(agent_type);
CREATE INDEX idx_forge_agents_task ON forge_agents(task_id);
