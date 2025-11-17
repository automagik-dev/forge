import { ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface ViewPRButtonProps {
  prUrl: string;
  prNumber: number;
}

export function ViewPRButton({ prUrl, prNumber }: ViewPRButtonProps) {
  const { t } = useTranslation('tasks');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-0.5 h-6 px-2 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-100/70 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200/70 dark:hover:bg-blue-800/40 transition-colors"
          >
            <span className="text-[10px]">#{prNumber}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{t('git.tooltips.viewPr', { number: prNumber })}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
