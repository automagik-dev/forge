PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

CREATE TABLE tasks_new (
    id          BLOB PRIMARY KEY,
    project_id  BLOB NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'todo'
                   CHECK (status IN ('todo','inprogress','done','cancelled','inreview')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    parent_task_attempt BLOB REFERENCES task_attempts(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO tasks_new (id, project_id, title, description, status, created_at, updated_at, parent_task_attempt)
SELECT id, project_id, title, description, status, created_at, updated_at, parent_task_attempt
FROM tasks;

DROP TABLE tasks;

ALTER TABLE tasks_new RENAME TO tasks;

COMMIT;

PRAGMA foreign_keys=on;
