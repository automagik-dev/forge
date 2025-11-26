import { BottomSheet } from './BottomSheet';
import { Button } from '@/components/ui/button';
import { RefreshCw, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DiffActionSheetProps {
  open: boolean;
  onClose: () => void;
  onSync?: () => void;
  onApprove?: () => void;
  isSyncing?: boolean;
  isApproving?: boolean;
  canSync?: boolean;
  canApprove?: boolean;
  syncDisabledReason?: string | null;
  approveDisabledReason?: string | null;
}

export function DiffActionSheet({
  open,
  onClose,
  onSync,
  onApprove,
  isSyncing = false,
  isApproving = false,
  canSync = true,
  canApprove = true,
  syncDisabledReason,
  approveDisabledReason,
}: DiffActionSheetProps) {
  const { t } = useTranslation('common');

  const handleSync = () => {
    onSync?.();
    onClose();
  };

  const handleApprove = () => {
    onApprove?.();
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('mobile.diffActions.title')}
      description={t('mobile.diffActions.description')}
      snapPoints={[40]}
      className="font-secondary"
    >
      <div className="p-4 space-y-3">
        {/* Sync Button */}
        <Button
          onClick={handleSync}
          disabled={!canSync || isSyncing}
          variant="outline"
          className={cn(
            'w-full flex items-center justify-center gap-2 h-14',
            'touch-target-comfortable',
            'text-base font-medium'
          )}
          title={syncDisabledReason || undefined}
        >
          <RefreshCw className={cn('w-5 h-5', isSyncing && 'animate-spin')} />
          {isSyncing ? t('mobile.diffActions.syncing') : t('mobile.diffActions.sync')}
        </Button>

        {syncDisabledReason && !canSync && (
          <p className="text-xs text-muted-foreground text-center -mt-1">
            {syncDisabledReason}
          </p>
        )}

        {/* Approve Button */}
        <Button
          onClick={handleApprove}
          disabled={!canApprove || isApproving}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-14',
            'touch-target-comfortable',
            'text-base font-medium'
          )}
          title={approveDisabledReason || undefined}
        >
          <GitMerge className="w-5 h-5" />
          {isApproving ? t('mobile.diffActions.approving') : t('mobile.diffActions.approve')}
        </Button>

        {approveDisabledReason && !canApprove && (
          <p className="text-xs text-muted-foreground text-center -mt-1">
            {approveDisabledReason}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
