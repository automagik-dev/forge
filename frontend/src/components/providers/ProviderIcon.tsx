import { Terminal, Bot } from 'lucide-react';
import { BaseCodingAgent } from 'shared/types';
import { siClaude, siGooglegemini, siGithubcopilot, siOpenai } from 'simple-icons';
import { useTheme } from '@/components/theme-provider';
import { ThemeMode } from 'shared/types';

type ProviderIconProps = {
  executor?: BaseCodingAgent | string | null;
  className?: string;
};

function getResolvedTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === ThemeMode.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme === ThemeMode.DARK ? 'dark' : 'light';
}

export function getProviderName(
  executor: BaseCodingAgent | string | undefined | null
): string {
  if (!executor) return 'Agent';
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
      return String(executor);
  }
}

export function ProviderIcon({
  executor,
  className = 'h-4 w-4',
}: ProviderIconProps) {
  const { theme } = useTheme();
  const resolvedTheme = getResolvedTheme(theme);
  const isDark = resolvedTheme === 'dark';

  const providerName = getProviderName(executor);

  if (!executor) {
    return <Terminal className={className} />;
  }

  // For simple-icons, we'll use inline SVG with the icon path
  let iconPath = '';
  let iconTitle = '';
  // Use explicit fill color to ensure proper rendering in both light and dark modes
  let fillColor = isDark ? '#ffffff' : '#000000';

  switch (executor) {
    case 'CLAUDE_CODE':
      iconPath = siClaude.path;
      iconTitle = siClaude.title;
      break;
    case 'GEMINI':
      iconPath = siGooglegemini.path;
      iconTitle = siGooglegemini.title;
      break;
    case 'CURSOR_AGENT':
      // Cursor can use the IDE icon we already have
      return (
        <img
          src={isDark ? '/ide/cursor-dark.svg' : '/ide/cursor-light.svg'}
          alt="Cursor"
          className={className}
        />
      );
    case 'COPILOT':
      iconPath = siGithubcopilot.path;
      iconTitle = siGithubcopilot.title;
      break;
    case 'CODEX':
      iconPath = siOpenai.path;
      iconTitle = siOpenai.title;
      break;
    case 'QWEN_CODE':
      // Use Bot icon for Qwen
      return <Bot className={className} />;
      break;
    case 'AMP':
    case 'OPENCODE':
      // Use Bot icon for providers without specific logos
      return <Bot className={className} />;
    default:
      // Fallback to generic terminal icon for unknown providers
      return <Terminal className={className} />;
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill={fillColor}
      aria-label={iconTitle}
      style={{
        color: isDark ? '#ffffff' : '#000000',
        // Ensure the SVG always uses explicit fill, not inherited color
        fillOpacity: 1,
      }}
    >
      <title>{providerName}</title>
      <path d={iconPath} fill={fillColor} />
    </svg>
  );
}
