import * as React from 'react';
import { cn } from '@/lib/utils';

interface AutoExpandingTextareaProps extends React.ComponentProps<'textarea'> {
  maxRows?: number;
}

const AutoExpandingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandingTextareaProps
>(({ className, maxRows = 10, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    },
    [ref]
  );

  const { value, onInput, ...restProps } = props;

  const adjustHeight = React.useCallback(() => {
    const textarea = internalRef.current;
    if (!textarea) return;

    // Reset height to auto to get the natural height
    textarea.style.height = 'auto';

    // Calculate line height
    const style = window.getComputedStyle(textarea);
    const lineHeight = parseInt(style.lineHeight) || 20;
    const paddingTop = parseInt(style.paddingTop) || 0;
    const paddingBottom = parseInt(style.paddingBottom) || 0;

    // Calculate max height based on maxRows
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

    // Set the height to scrollHeight, but cap at maxHeight
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  // Adjust height on mount and when content changes
  React.useEffect(() => {
    adjustHeight();
  }, [adjustHeight, value]);

  // Adjust height on input
  const handleInput = React.useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onInput) {
        onInput(e);
      }
    },
    [adjustHeight, onInput]
  );

  return (
    <textarea
      className={cn(
        'bg-muted p-0 min-h-[80px] w-full text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words',
        className
      )}
      ref={setRefs}
      onInput={handleInput}
      {...restProps}
    />
  );
});

AutoExpandingTextarea.displayName = 'AutoExpandingTextarea';

export { AutoExpandingTextarea };
