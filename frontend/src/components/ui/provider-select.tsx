import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProviderIcon } from '@/components/providers/ProviderIcon';
import type { BaseCodingAgent } from 'shared/types';

type ProviderSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  providers: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

/**
 * Reusable provider selector with icons
 * Displays provider icons in both trigger and dropdown items
 */
export function ProviderSelect({
  value,
  onValueChange,
  providers,
  placeholder = 'Select provider',
  disabled = false,
  id,
  className,
}: ProviderSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {providers.map((provider) => (
          <SelectItem key={provider} value={provider}>
            <div className="flex items-center gap-2">
              <ProviderIcon
                executor={provider as BaseCodingAgent}
                className="h-4 w-4"
              />
              <span>{provider}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
