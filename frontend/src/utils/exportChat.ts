import type { PatchTypeWithKey } from '@/hooks/useConversationHistory';
import type { TaskAttempt, TaskWithAttemptStatus } from 'shared/types';

interface ExportMetadata {
  task?: TaskWithAttemptStatus | null;
  attempt?: TaskAttempt;
  projectId?: string;
}

/**
 * Formats a timestamp for display in the export
 */
function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * Formats the frontmatter metadata for the export
 */
function generateFrontmatter(metadata: ExportMetadata, messageCount: number): string {
  const now = new Date().toISOString();
  const { task, attempt, projectId } = metadata;

  return `---
export_version: "1.0"
export_date: "${now}"
task_id: "${task?.id || 'unknown'}"
attempt_id: "${attempt?.id || 'unknown'}"
project_id: "${projectId || 'unknown'}"
task_name: "${task?.title || 'Untitled Task'}"
branch: "${attempt?.branch || 'unknown'}"
created_at: "${attempt?.created_at || ''}"
updated_at: "${attempt?.updated_at || ''}"
message_count: ${messageCount}
---

`;
}

/**
 * Formats a user message entry
 */
function formatUserMessage(content: string, timestamp: string | null): string {
  const ts = formatTimestamp(timestamp);
  return `## [USER]${ts ? ` ${ts}` : ''}\n\n${content}\n\n`;
}

/**
 * Formats an assistant message entry
 */
function formatAssistantMessage(content: string, timestamp: string | null): string {
  const ts = formatTimestamp(timestamp);
  return `## [ASSISTANT]${ts ? ` ${ts}` : ''}\n\n${content}\n\n`;
}

/**
 * Formats thinking block
 */
function formatThinking(content: string, timestamp: string | null): string {
  const ts = formatTimestamp(timestamp);
  if (!content.trim()) return '';

  return `### [THINKING]${ts ? ` ${ts}` : ''}

<details>
<summary>Assistant's thoughts</summary>

${content}

</details>

`;
}

/**
 * Formats a tool use entry
 */
function formatToolUse(
  entry: {
    tool_name: string;
    action_type: {
      action: string;
      path?: string;
      command?: string;
      result?: { output?: string };
      query?: string;
      url?: string;
      tool_name?: string;
      arguments?: unknown;
      result?: unknown;
    };
    status: { status: string };
  },
  timestamp: string | null
): string {
  const ts = formatTimestamp(timestamp);
  const { tool_name, action_type, status } = entry;

  let title = `[TOOL] ${tool_name}`;
  let details = '';

  // Format based on action type
  if (action_type.action === 'file_read') {
    title += ` - Read \`${action_type.path}\``;
  } else if (action_type.action === 'file_edit') {
    title += ` - Edit \`${action_type.path}\``;
  } else if (action_type.action === 'command_run') {
    title += ` - Run command`;
    details = `**Command:** \`${action_type.command}\`\n\n`;
    if (action_type.result?.output) {
      details += `**Output:**\n\`\`\`\n${action_type.result.output}\n\`\`\`\n\n`;
    }
  } else if (action_type.action === 'search') {
    title += ` - Search: "${action_type.query}"`;
  } else if (action_type.action === 'web_fetch') {
    title += ` - Fetch: ${action_type.url}`;
  } else if (action_type.action === 'tool') {
    title += ` - ${action_type.tool_name}`;
    if (action_type.arguments) {
      details = `**Arguments:**\n\`\`\`json\n${JSON.stringify(action_type.arguments, null, 2)}\n\`\`\`\n\n`;
    }
    if (action_type.result) {
      details += `**Result:**\n\`\`\`json\n${JSON.stringify(action_type.result, null, 2)}\n\`\`\`\n\n`;
    }
  }

  const statusText = status.status === 'success' ? '✓ Success' :
                     status.status === 'failed' ? '✗ Failed' :
                     status.status === 'pending_approval' ? '⏳ Pending Approval' :
                     status.status === 'denied' ? '⛔ Denied' :
                     status.status;

  let result = `### ${title}\n**Status:** ${statusText}`;
  if (ts) result += `\n**Timestamp:** ${ts}`;
  result += '\n\n';

  if (details) {
    result += `<details>\n<summary>Details</summary>\n\n${details}</details>\n\n`;
  }

  return result;
}

/**
 * Formats a system message
 */
function formatSystemMessage(content: string, timestamp: string | null): string {
  const ts = formatTimestamp(timestamp);
  return `### [SYSTEM]${ts ? ` ${ts}` : ''}\n\n${content}\n\n`;
}

/**
 * Formats an error message
 */
function formatErrorMessage(
  content: string,
  errorType: { type: string },
  timestamp: string | null
): string {
  const ts = formatTimestamp(timestamp);
  const typeStr = errorType.type === 'setup_required' ? 'Setup Required' : 'Error';
  return `### [ERROR - ${typeStr}]${ts ? ` ${ts}` : ''}\n\n${content}\n\n`;
}

/**
 * Converts chat entries to markdown format
 */
export function exportChatToMarkdown(
  entries: PatchTypeWithKey[],
  metadata: ExportMetadata
): string {
  let markdown = generateFrontmatter(metadata, entries.length);
  markdown += '# Chat Conversation Export\n\n';

  for (const entry of entries) {
    if (entry.type !== 'NORMALIZED_ENTRY') continue;

    const { entry_type, content, timestamp } = entry.content;

    switch (entry_type.type) {
      case 'user_message':
        markdown += formatUserMessage(content, timestamp);
        break;

      case 'assistant_message':
        markdown += formatAssistantMessage(content, timestamp);
        break;

      case 'thinking':
        markdown += formatThinking(content, timestamp);
        break;

      case 'tool_use':
        markdown += formatToolUse(entry_type, timestamp);
        break;

      case 'system_message':
        markdown += formatSystemMessage(content, timestamp);
        break;

      case 'error_message':
        markdown += formatErrorMessage(content, entry_type.error_type, timestamp);
        break;

      case 'user_feedback':
        markdown += `### [USER FEEDBACK]${timestamp ? ` ${formatTimestamp(timestamp)}` : ''}\n\nDenied tool: ${entry_type.denied_tool}\n\n${content}\n\n`;
        break;

      case 'loading':
      case 'next_action':
        // Skip these UI-only entries
        break;
    }
  }

  return markdown;
}

/**
 * Downloads the markdown content as a file
 */
export function downloadMarkdownFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generates a filename for the export
 */
export function generateExportFilename(metadata: ExportMetadata): string {
  const { task, attempt } = metadata;
  const timestamp = new Date().toISOString().split('T')[0];
  const taskName = task?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'chat';
  const attemptShort = attempt?.id.slice(0, 8) || 'unknown';
  return `${taskName}-${attemptShort}-${timestamp}.md`;
}
