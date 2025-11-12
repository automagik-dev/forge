import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { useIsMobile } from '@/components/mobile/MobileLayout';

export interface DialogOrSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Adaptive dialog component that renders:
 * - Dialog on desktop (modal with backdrop)
 * - BottomSheet on mobile (slide-up sheet with gestures)
 * 
 * This provides a consistent API while adapting to the platform.
 */
export function DialogOrSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className,
  contentClassName,
}: DialogOrSheetProps) {
  const isMobile = useIsMobile();

  const handleClose = () => {
    if (dismissible) {
      onOpenChange(false);
    }
  };

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={handleClose}
        title={title}
        description={description}
        dismissible={dismissible}
        showHandle={true}
        className={className}
        contentClassName={contentClassName}
      >
        <div className="px-4 py-3">
          {children}
          {footer && (
            <div className="mt-4 pt-4 border-t border-white/10">
              {footer}
            </div>
          )}
        </div>
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      uncloseable={!dismissible}
      className={className}
    >
      {(title || description) && (
        <DialogHeader>
          {title && <DialogTitle>{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
      )}
      <DialogContent className={contentClassName}>
        {children}
      </DialogContent>
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </Dialog>
  );
}

/**
 * Hook to manage DialogOrSheet state
 */
export function useDialogOrSheet() {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}
