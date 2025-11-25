import { ReactNode } from 'react';

/**
 * Local type definitions for RJSF (React JSON Schema Form) templates.
 * These provide stable types decoupled from the beta library's unstable types.
 */

// Form template props - minimal interface for what we actually use
export interface RJSFFormTemplateProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

// Extended ArrayFieldTemplateItemType for RJSF v6 beta properties
// The official types may not include buttonsProps yet
export interface RJSFArrayItemButtonsProps {
  hasRemove?: boolean;
  disabled?: boolean;
  index: number;
  onDropIndexClick: (index: number) => () => void;
}

export interface RJSFArrayItemExtended {
  key: string;
  children: ReactNode;
  index: number;
  buttonsProps?: RJSFArrayItemButtonsProps;
}
