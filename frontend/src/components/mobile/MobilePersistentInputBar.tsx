import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform } from '@/lib/platform';

export interface MobilePersistentInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  isSending?: boolean;
  className?: string;
}

export function MobilePersistentInputBar({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  isSending = false,
  className,
}: MobilePersistentInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleSend = async () => {
    if (!value.trim() || disabled || isSending) return;

    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }

    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceRecording = async () => {
    if (Platform.isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

    setIsVoiceRecording(!isVoiceRecording);
    
    if (!isVoiceRecording) {
      console.log('[Voice Input] Starting recording...');
    } else {
      console.log('[Voice Input] Stopping recording...');
    }
  };

  const canSend = value.trim().length > 0 && !disabled && !isSending;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[var(--z-mobile-input-bar)]',
        'glass-heavy border-t border-white/15',
        'pb-safe',
        'font-secondary',
        className
      )}
    >
      <div className="flex items-end gap-2 p-3">
        {/* Voice input button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVoiceRecording}
          disabled={disabled || isSending}
          className={cn(
            'shrink-0 h-11 w-11 rounded-full',
            'touch-target',
            isVoiceRecording && 'bg-destructive text-destructive-foreground'
          )}
          aria-label={isVoiceRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isVoiceRecording ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        {/* Auto-expanding textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'w-full resize-none',
              'bg-background/50 backdrop-blur-sm',
              'border border-white/20 rounded-2xl',
              'px-4 py-3',
              'text-base text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-brand-magenta focus:border-transparent',
              'transition-all duration-200',
              'mobile-scroll',
              'touch-target-comfortable',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              minHeight: '44px',
              maxHeight: '120px',
            }}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className={cn(
            'shrink-0 h-11 w-11 rounded-full',
            'touch-target',
            'bg-brand-magenta hover:bg-brand-magenta/90',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200',
            canSend && 'scale-100',
            !canSend && 'scale-90 opacity-50'
          )}
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Voice recording indicator */}
      {isVoiceRecording && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span>Recording...</span>
          </div>
        </div>
      )}
    </div>
  );
}
