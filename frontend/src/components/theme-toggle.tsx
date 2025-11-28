import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/theme-provider';
import { ThemeMode } from 'shared/types';

const THEME_OPTIONS = [
  {
    mode: ThemeMode.LIGHT,
    icon: Sun,
    label: 'Light',
  },
  {
    mode: ThemeMode.DARK,
    icon: Moon,
    label: 'Dark',
  },
  {
    mode: ThemeMode.SYSTEM,
    icon: Monitor,
    label: 'System',
  },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const getCurrentIcon = () => {
    const currentOption = THEME_OPTIONS.find(opt => opt.mode === theme);
    return currentOption?.icon || Sun;
  };

  const Icon = getCurrentIcon();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ mode, icon: OptionIcon, label }) => (
          <DropdownMenuItem
            key={mode}
            onClick={() => setTheme(mode)}
            className={theme === mode ? 'bg-accent' : ''}
          >
            <OptionIcon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
