import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';
import { useIsMobile } from '@/components/mobile/MobileLayout';

export interface FloatingActionButtonProps {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  hideOnScroll?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * Floating Action Button (FAB) for mobile interfaces
 * - Fixed position at bottom-right
 * - Context-aware actions
 * - Auto-hide on scroll up (optional)
 * - Haptic feedback on native platforms
 * 
 * Usage:
 * - Task List: "New Task"
 * - Conversation (idle): "New Follow-up"
 * - Conversation (generating): "Stop"
 * - Diff View: "Approve/Request Changes"
 */
export function FloatingActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  className,
  hideOnScroll = true,
  variant = 'primary',
}: FloatingActionButtonProps) {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!hideOnScroll || !isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll, isMobile]);

  const handleClick = async () => {
    if (disabled) return;

    if (Platform.isNative()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }

    onClick();
  };

  if (!isMobile) {
    return null;
  }

  const variantStyles = {
    primary: 'bg-brand-magenta hover:bg-brand-magenta/90 text-white shadow-glow-magenta',
    secondary: 'glass-medium hover:glass-light text-foreground border border-white/15',
    danger: 'bg-destructive hover:bg-destructive/90 text-white shadow-lg',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'fixed z-[var(--z-mobile-fab)] rounded-full',
        'flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        label ? 'h-14 px-6 gap-2' : 'h-14 w-14',
        
        'bottom-20 right-6 mb-safe',
        
        variantStyles[variant],
        
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-20 opacity-0 scale-90 pointer-events-none',
        
        className
      )}
    >
      <span className="text-2xl">{icon}</span>
      {label && (
        <span className="font-secondary font-medium text-sm">{label}</span>
      )}
    </button>
  );
}

/**
 * Hook for managing FAB state and context-aware actions
 */
export function useFAB() {
  const [fabConfig, setFabConfig] = useState<FloatingActionButtonProps | null>(null);

  return {
    fabConfig,
    setFabConfig,
    clearFAB: () => setFabConfig(null),
  };
}
