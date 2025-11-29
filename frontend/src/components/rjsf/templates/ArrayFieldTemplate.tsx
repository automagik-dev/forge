import {
  ArrayFieldTemplateProps,
  ArrayFieldTemplateItemType,
} from '@rjsf/utils';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { RJSFArrayItemExtended } from '@/types/rjsf';

export const ArrayFieldTemplate = (props: ArrayFieldTemplateProps) => {
  const { canAdd, items, onAddClick, disabled, readonly } = props;

  if (!items || (items.length === 0 && !canAdd)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        {items.length > 0 &&
          items.map((element: ArrayFieldTemplateItemType) => (
            <ArrayItem
              key={element.key}
              element={element}
              disabled={disabled}
              readonly={readonly}
            />
          ))}
      </div>

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddClick}
          disabled={disabled || readonly}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      )}
    </div>
  );
};

interface ArrayItemProps {
  element: ArrayFieldTemplateItemType;
  disabled?: boolean;
  readonly?: boolean;
}

const ArrayItem = ({ element, disabled, readonly }: ArrayItemProps) => {
  const { children } = element;
  // Type assertion for RJSF v6 beta properties not in official types
  const elementExtended = element as unknown as RJSFArrayItemExtended;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">{children}</div>

      {/* Remove button */}
      {elementExtended.buttonsProps?.hasRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={elementExtended.buttonsProps.onDropIndexClick(
            elementExtended.buttonsProps.index
          )}
          disabled={
            disabled || readonly || elementExtended.buttonsProps.disabled
          }
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 shrink-0"
          title="Remove item"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
