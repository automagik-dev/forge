import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from '@react-spring/web';
import { H2 } from '@/components/ui/typography';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[];
  initialSnap?: number;
  dismissible?: boolean;
  showHandle?: boolean;
  className?: string;
  contentClassName?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  snapPoints = [90],
  initialSnap = 0,
  dismissible = true,
  showHandle = true,
  className,
  contentClassName,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const sheetRef = useRef<HTMLDivElement>(null);

  const snapOffsets = snapPoints.map(
    (point) => window.innerHeight * (1 - point / 100)
  );

  const [{ y }, api] = useSpring(() => ({
    y: open ? snapOffsets[currentSnap] : window.innerHeight,
    config: { tension: 300, friction: 30 },
  }));

  useEffect(() => {
    if (open) {
      api.start({ y: snapOffsets[currentSnap] });
      document.body.style.overflow = 'hidden';
    } else {
      api.start({ y: window.innerHeight });
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, currentSnap, snapOffsets, api]);

  useEffect(() => {
    const handleResize = () => {
      const newSnapOffsets = snapPoints.map(
        (point) => window.innerHeight * (1 - point / 100)
      );
      if (open) {
        api.start({ y: newSnapOffsets[currentSnap] });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, currentSnap, snapPoints, api]);

  const bind = useDrag(
    ({
      last,
      velocity: [, vy],
      direction: [, dy],
      movement: [, my],
      cancel,
    }) => {
      if (!dismissible && dy > 0) {
        cancel();
        return;
      }

      if (last) {
        const currentOffset = snapOffsets[currentSnap];
        const newY = Math.max(
          0,
          Math.min(window.innerHeight, currentOffset + my)
        );

        if (vy > 0.5 || (dy > 0 && newY > currentOffset + 50)) {
          if (currentSnap < snapPoints.length - 1) {
            setCurrentSnap(currentSnap + 1);
            if (Platform.isNative()) {
              Haptics.impact({ style: ImpactStyle.Light });
            }
          } else if (dismissible) {
            onClose();
            if (Platform.isNative()) {
              Haptics.impact({ style: ImpactStyle.Medium });
            }
          }
        } else if (vy < -0.5 || (dy < 0 && newY < currentOffset - 50)) {
          if (currentSnap > 0) {
            setCurrentSnap(currentSnap - 1);
            if (Platform.isNative()) {
              Haptics.impact({ style: ImpactStyle.Light });
            }
          }
        } else {
          api.start({ y: snapOffsets[currentSnap] });
        }
      } else {
        api.start({ y: snapOffsets[currentSnap] + my, immediate: true });
      }
    },
    {
      from: () => [0, y.get()],
      filterTaps: true,
      bounds: { top: 0, bottom: window.innerHeight },
      rubberband: true,
    }
  );

  const handleBackdropClick = () => {
    if (dismissible) {
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-mobile-sheet)]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      <animated.div
        ref={sheetRef}
        {...bind()}
        style={{
          transform: y.to((v) => `translateY(${v}px)`),
          touchAction: 'none',
        }}
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'glass-heavy rounded-t-2xl',
          'shadow-2xl',
          'flex flex-col',
          'max-h-[95vh]',
          'font-secondary',
          className
        )}
      >
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-8 h-1 bg-muted-foreground/40 rounded-full" />
          </div>
        )}

        {(title || description) && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && <H2 className="text-lg">{title}</H2>}
                {description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              {dismissible && (
                <button
                  onClick={onClose}
                  className="ml-4 p-1 rounded-full hover:bg-white/10 touch-target transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        <div
          className={cn(
            'flex-1 overflow-y-auto mobile-scroll',
            'pb-safe',
            contentClassName
          )}
        >
          {children}
        </div>
      </animated.div>
    </div>,
    document.body
  );
}
