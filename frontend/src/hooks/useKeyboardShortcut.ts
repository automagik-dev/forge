import type { ShortcutConfig } from '@/contexts/keyboard-shortcuts-context';
import type { EnableOnFormTags } from '@/keyboard/types';

// Forge override: disable all automatic keyboard shortcuts for now.
// We keep the public signatures so existing imports keep compiling, but the
// hook intentionally performs no registration or event binding.

export interface KeyboardShortcutOptions {
  enableOnContentEditable?: boolean;
  enableOnFormTags?: EnableOnFormTags;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  _config: ShortcutConfig,
  _options: KeyboardShortcutOptions = {}
): void {
  // no-op — shortcuts disabled in Forge override
}
