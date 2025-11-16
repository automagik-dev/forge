import type { ExecutorProfileId, BaseCodingAgent } from 'shared/types';
import { cn } from '@/lib/utils';
import {
  Bot,
  Sparkles,
  MousePointer2,
  Github,
  Zap,
  Code2,
  CodeXml,
  Blocks,
  Terminal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ProfileVariantBadgeProps {
  profileVariant: ExecutorProfileId | null;
  className?: string;
  showIcon?: boolean;
}

/**
 * Get the icon component for a given executor.
 * Can accept BaseCodingAgent enum or string.
 */
export function getProviderIcon(executor: BaseCodingAgent | string): LucideIcon {
  switch (executor) {
    case 'CLAUDE_CODE':
      return Bot;
    case 'GEMINI':
      return Sparkles;
    case 'CURSOR_AGENT':
      return MousePointer2;
    case 'COPILOT':
      return Github;
    case 'AMP':
      return Zap;
    case 'CODEX':
      return Code2;
    case 'OPENCODE':
      return CodeXml;
    case 'QWEN_CODE':
      return Blocks;
    default:
      return Terminal;
  }
}

/**
 * Get human-readable label for a given executor.
 * Can accept BaseCodingAgent enum or string.
 */
export function getProviderLabel(executor: BaseCodingAgent | string): string {
  switch (executor) {
    case 'CLAUDE_CODE':
      return 'Claude Code';
    case 'GEMINI':
      return 'Gemini';
    case 'CURSOR_AGENT':
      return 'Cursor';
    case 'COPILOT':
      return 'Copilot';
    case 'AMP':
      return 'Amp';
    case 'CODEX':
      return 'Codex';
    case 'OPENCODE':
      return 'OpenCode';
    case 'QWEN_CODE':
      return 'Qwen Code';
    default:
      return executor;
  }
}

export function ProfileVariantBadge({
  profileVariant,
  className,
  showIcon = true,
}: ProfileVariantBadgeProps) {
  if (!profileVariant) {
    return null;
  }

  const Icon = getProviderIcon(profileVariant.executor);
  const label = getProviderLabel(profileVariant.executor);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground',
        className
      )}
    >
      {showIcon && (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>{label}</span>
      {profileVariant.variant && (
        <>
          <span className="mx-0.5">/</span>
          <span className="font-medium">{profileVariant.variant}</span>
        </>
      )}
    </span>
  );
}
