import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from 'react-spring';
import { H2 } from '@/components/ui/typography';

export interface TasksDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  contentClassName?: string;
}

export function TasksDrawer({
  open,
  onClose,
  children,
  title = 'Tasks',
  className,
  contentClassName
}: TasksDrawerProps) {
  const drawerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.85, 400) : 320;

  const [{ x }, api] = useSpring(() => ({
    x: open ? 0 : -drawerWidth,
    config: { tension: 300, friction: 30 }
  }));

  useEffect(() => {
    if (open) {
      api.start({ x: 0 });
      document.body.style.overflow = 'hidden';
      if (Platform.isNative()) {
        Haptics.impact({ style: ImpactStyle.Light });
      }
    } else {
      api.start({ x: -drawerWidth });
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, drawerWidth, api]);

  const bind = useDrag(
    ({ last, velocity: [vx], direction: [dx], movement: [mx], cancel }) => {
      // Only allow dragging to close (left direction)
      if (dx > 0) {
        cancel();
        return;
      }

      if (last) {
        const currentX = x.get();

        // If dragged left significantly or with velocity, close
        if (vx < -0.5 || (dx < 0 && currentX < -drawerWidth / 3)) {
          onClose();
          if (Platform.isNative()) {
            Haptics.impact({ style: ImpactStyle.Medium });
          }
        } else {
          // Snap back open
          api.start({ x: 0 });
        }
      } else {
        api.start({ x: Math.min(0, mx), immediate: true });
      }
    },
    {
      from: () => [x.get(), 0],
      filterTaps: true,
      bounds: { left: -drawerWidth, right: 0 },
      rubberband: true
    }
  );

  const handleBackdropClick = () => {
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-mobile-sheet)]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      <animated.div
        {...bind()}
        style={{
          transform: x.to(v => `translateX(${v}px)`),
          touchAction: 'pan-y',
          width: drawerWidth
        }}
        className={cn(
          'absolute top-0 left-0 bottom-0',
          'glass-heavy',
          'shadow-2xl',
          'flex flex-col',
          'font-secondary',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <H2 className="text-lg">{title}</H2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 touch-target transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          'flex-1 overflow-y-auto mobile-scroll',
          'pb-safe',
          contentClassName
        )}>
          {children}
        </div>
      </animated.div>
    </div>,
    document.body
  );
}

/**
 * Hook to manage tasks drawer state
 */
export function useTasksDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    open,
    close,
    toggle
  };
}
