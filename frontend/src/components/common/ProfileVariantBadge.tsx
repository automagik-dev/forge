import type { ExecutorProfileId } from 'shared/types';
import { cn } from '@/lib/utils';
import { ProviderIcon, getProviderName } from '@/components/providers/ProviderIcon';

interface ProfileVariantBadgeProps {
  profileVariant: ExecutorProfileId | null;
  className?: string;
  showIcon?: boolean;
}

export function ProfileVariantBadge({
  profileVariant,
  className,
  showIcon = true,
}: ProfileVariantBadgeProps) {
  if (!profileVariant) {
    return null;
  }

  const label = getProviderName(profileVariant.executor);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground',
        className
      )}
    >
      {showIcon && (
        <ProviderIcon executor={profileVariant.executor} className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
      {profileVariant.variant && (
        <>
          <span className="mx-0.5">/</span>
          <span className="font-medium">{profileVariant.variant}</span>
        </>
      )}
    </span>
  );
}
