import { vi } from 'vitest';

export const Haptics = {
  impact: vi.fn().mockResolvedValue(undefined),
  notification: vi.fn().mockResolvedValue(undefined),
  vibrate: vi.fn().mockResolvedValue(undefined),
  selectionStart: vi.fn().mockResolvedValue(undefined),
  selectionChanged: vi.fn().mockResolvedValue(undefined),
  selectionEnd: vi.fn().mockResolvedValue(undefined),
};

export const ImpactStyle = {
  Heavy: 'Heavy',
  Medium: 'Medium',
  Light: 'Light',
};

export const NotificationType = {
  Success: 'Success',
  Warning: 'Warning',
  Error: 'Error',
};
