-- Forge Omni notification queue and triggers
-- Enqueues execution lifecycle events for asynchronous Omni delivery.

-- Add metadata column to capture structured payloads (JSON)
ALTER TABLE forge_omni_notifications
    ADD COLUMN metadata TEXT;

-- Queue notifications when execution processes transition to a terminal state
CREATE TRIGGER IF NOT EXISTS forge_queue_omni_on_execution
AFTER UPDATE OF status ON execution_processes
WHEN NEW.status IN ('completed', 'failed', 'killed')
  AND OLD.status IS NOT NEW.status
  AND NEW.run_reason = 'coding_agent'
BEGIN
    INSERT OR IGNORE INTO forge_omni_notifications (
        id,
        task_id,
        notification_type,
        recipient,
        message,
        status,
        metadata
    )
    SELECT
        printf('execution-%s', NEW.id),
        ta.task_id,
        CASE NEW.status
            WHEN 'completed' THEN 'execution_completed'
            WHEN 'failed' THEN 'execution_failed'
            ELSE 'execution_cancelled'
        END,
        '',
        '',
        'pending',
        json_object(
            'execution_process_id', NEW.id,
            'task_attempt_id', NEW.task_attempt_id,
            'status', NEW.status,
            'executor', ta.executor,
            'branch', ta.branch,
            'base_branch', ta.base_branch,
            'project_id', t.project_id
        )
    FROM task_attempts ta
    JOIN tasks t ON t.id = ta.task_id
    WHERE ta.id = NEW.task_attempt_id; END;
