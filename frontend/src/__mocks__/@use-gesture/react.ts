import { vi } from 'vitest';

export const useDrag = vi.fn((handler, config) => {
  return () => ({
    onMouseDown: vi.fn(),
    onTouchStart: vi.fn(),
  });
});

export const useGesture = vi.fn(() => {
  return () => ({});
});

export const useWheel = vi.fn(() => {
  return () => ({});
});

export const usePinch = vi.fn(() => {
  return () => ({});
});

export const useScroll = vi.fn(() => {
  return () => ({});
});

export const useMove = vi.fn(() => {
  return () => ({});
});

export const useHover = vi.fn(() => {
  return () => ({});
});
