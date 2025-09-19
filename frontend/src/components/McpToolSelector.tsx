import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { clsx } from 'clsx';
import { McpToolInfo } from 'shared/types';

interface McpToolSelectorProps {
  availableTools: McpToolInfo[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function McpToolSelector({
  availableTools,
  selected,
  onChange,
  disabled = false,
}: McpToolSelectorProps) {
  const handleToggle = (toolId: string, checked: boolean) => {
    if (checked) {
      if (selected.includes(toolId)) return;
      onChange([...selected, toolId]);
    } else {
      if (!selected.includes(toolId)) return;
      onChange(selected.filter((value) => value !== toolId));
    }
  };

  if (availableTools.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        No MCP tools are currently available.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">MCP Tools</Label>
      <p className="text-xs text-muted-foreground">
        Enable or disable individual MCP tools for this agent configuration. Leaving all unchecked will
        disable Automagik Forge MCP tools for this agent.
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        {availableTools.map((tool) => {
          const isChecked = selected.includes(tool.id);
          return (
            <label
              key={tool.id}
              className={clsx(
                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                isChecked
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/60 hover:bg-muted/50'
              )}
            >
              <Checkbox
                id={`mcp-tool-${tool.id}`}
                checked={isChecked}
                onCheckedChange={(value) =>
                  handleToggle(tool.id, value === true)
                }
                disabled={disabled}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{tool.name}</p>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
