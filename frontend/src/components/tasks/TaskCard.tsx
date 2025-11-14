import { useCallback, useEffect, useRef, useState } from 'react';
import { KanbanCard } from '@/components/ui/shadcn-io/kanban';
import { CheckCircle, Loader2, XCircle, Play, Bot, Paperclip, Clock, Link2, Server, Archive } from 'lucide-react';
import type { TaskWithAttemptStatus, ImageResponse } from 'shared/types';
import { ActionsDropdown } from '@/components/ui/ActionsDropdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { imagesApi } from '@/lib/api';
import NiceModal from '@ebay/nice-modal-react';
import { H4 } from '@/components/ui/typography';

type Task = TaskWithAttemptStatus;

interface TaskCardProps {
  task: Task;
  index: number;
  status: string;
  onViewDetails: (task: Task) => void;
  isOpen?: boolean;
}

// Helper: Strip markdown images from description
function stripMarkdownImages(text: string | null): string {
  if (!text) return '';
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Remove ![alt](url)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Helper: Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export function TaskCard({
  task,
  index,
  status,
  onViewDetails,
  isOpen,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [images, setImages] = useState<ImageResponse[]>([]);

  const handleClick = useCallback(() => {
    onViewDetails(task);
  }, [task, onViewDetails]);

  const handlePlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!task) return;
      NiceModal.show('create-attempt', {
        taskId: task.id,
        latestAttempt: null,
      });
    },
    [task]
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!task) return;
      NiceModal.show('archive-task-confirmation', {
        task,
      });
    },
    [task]
  );

  const localRef = useRef<HTMLDivElement>(null);

  // Fetch images if task has image markdown
  useEffect(() => {
    const hasImageMarkdown = task.description?.includes('![');
    if (!hasImageMarkdown) return;

    imagesApi
      .getTaskImages(task.id)
      .then((imgs) => setImages(imgs.slice(0, 3))) // First 3 for card preview
      .catch((err) => {
        console.error('Failed to load task images:', err);
        setImages([]);
      });
  }, [task.id, task.description]);

  useEffect(() => {
    if (!isOpen || !localRef.current) return;
    const el = localRef.current;
    requestAnimationFrame(() => {
      el.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'smooth',
      });
    });
  }, [isOpen]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <KanbanCard
        key={task.id}
        id={task.id}
        name={task.title}
        index={index}
        parent={status}
        onClick={handleClick}
        isOpen={isOpen}
        forwardedRef={localRef}
      >
      <div className="flex flex-1 gap-2 items-center min-w-0">
        <H4 className="flex-1 min-w-0 line-clamp-2 font-light text-sm">
          {task.title}
        </H4>
        <div className="flex items-center space-x-1">
          {/* In Progress Spinner */}
          {task.has_in_progress_attempt && (
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          )}
          {/* Merged Indicator */}
          {task.has_merged_attempt && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
          {/* Failed Indicator */}
          {task.last_attempt_failed && !task.has_merged_attempt && (
            <XCircle className="h-3 w-3 text-destructive" />
          )}
          {/* Play Button (on hover, only when no attempts exist) */}
          {isHovered && !task.executor && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handlePlay}
                aria-label="Start new attempt"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          )}
          {/* Archive Button (on hover, only for non-archived tasks) */}
          {isHovered && status !== 'archived' && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleArchive}
                aria-label="Archive task"
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          )}
          {/* Actions Menu */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <ActionsDropdown task={task} />
          </div>
        </div>
      </div>

      {/* Description (cleaned, no markdown images) */}
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {stripMarkdownImages(task.description)}
        </p>
      )}

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <div className="flex gap-1.5 items-center mt-2">
          {images.map((img) => (
            <img
              key={img.id}
              src={`/api/images/${img.id}/file`}
              alt={img.original_name}
              className="w-10 h-10 object-cover rounded border border-border"
              loading="lazy"
              onClick={(e) => e.stopPropagation()}
            />
          ))}
          {images.length === 3 && task.description?.match(/!\[/g)?.length && task.description.match(/!\[/g)!.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{task.description.match(/!\[/g)!.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metadata Badges */}
      <div className="flex flex-wrap gap-1.5 items-center mt-2">
        {/* Executor Badge */}
        {task.executor && (
          <Badge variant="secondary" className="text-xs gap-1 h-5 px-1.5 bg-secondary/70 dark:bg-secondary text-foreground dark:text-secondary-foreground">
            <Bot className="h-3 w-3" />
            <span>{task.executor}</span>
          </Badge>
        )}

        {/* Subtask Badge */}
        {task.parent_task_attempt && (
          <Badge variant="outline" className="text-xs gap-1 h-5 px-1.5">
            <Link2 className="h-3 w-3" />
            <span>Subtask</span>
          </Badge>
        )}

        {/* Dev Server Badge */}
        {task.dev_server_id && (
          <Badge variant="outline" className="text-xs gap-1 h-5 px-1.5">
            <Server className="h-3 w-3" />
            <span>Dev</span>
          </Badge>
        )}

        {/* Attachment Count */}
        {images.length > 0 && (
          <Badge variant="outline" className="text-xs gap-1 h-5 px-1.5">
            <Paperclip className="h-3 w-3" />
            <span>{images.length}</span>
          </Badge>
        )}

        {/* Time Badge */}
        <Badge variant="outline" className="text-xs text-muted-foreground gap-1 h-5 px-1.5 border-none bg-transparent">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(task.updated_at)}</span>
        </Badge>
      </div>
    </KanbanCard>
    </div>
  );
}
