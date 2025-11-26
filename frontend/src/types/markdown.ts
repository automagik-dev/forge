import { ReactNode, HTMLAttributes } from 'react';

/**
 * Shared types for markdown-to-jsx component overrides.
 * Using a generic base type with element-specific extensions for DRY approach.
 */

// Base type for all markdown element overrides
export interface MarkdownOverrideProps<E extends HTMLElement = HTMLElement>
  extends HTMLAttributes<E> {
  children?: ReactNode;
}

// Specific element types extending the base
export type MarkdownCodeProps = MarkdownOverrideProps<HTMLElement> & {
  className?: string;
};

export type MarkdownPreProps = MarkdownOverrideProps<HTMLPreElement> & {
  className?: string;
};

export type MarkdownImageProps = MarkdownOverrideProps<HTMLImageElement> & {
  src?: string;
  alt?: string;
  title?: string;
};

export type MarkdownLinkProps = MarkdownOverrideProps<HTMLAnchorElement> & {
  href?: string;
  title?: string;
};

// Generic props for simple elements (p, span, em, strong, etc.)
export type MarkdownTextProps = MarkdownOverrideProps<HTMLElement>;

// Heading props (h1-h6)
export type MarkdownHeadingProps = MarkdownOverrideProps<HTMLHeadingElement>;

// List props (ul, ol)
export type MarkdownListProps = MarkdownOverrideProps<HTMLUListElement | HTMLOListElement>;

// List item props
export type MarkdownListItemProps = MarkdownOverrideProps<HTMLLIElement>;

// Table props
export type MarkdownTableProps = MarkdownOverrideProps<HTMLTableElement>;
export type MarkdownTableHeadProps = MarkdownOverrideProps<HTMLTableSectionElement>;
export type MarkdownTableBodyProps = MarkdownOverrideProps<HTMLTableSectionElement>;
export type MarkdownTableRowProps = MarkdownOverrideProps<HTMLTableRowElement>;
export type MarkdownTableCellProps = MarkdownOverrideProps<HTMLTableCellElement>;

// Block elements
export type MarkdownBlockquoteProps = MarkdownOverrideProps<HTMLQuoteElement>;
export type MarkdownDivProps = MarkdownOverrideProps<HTMLDivElement>;
export type MarkdownHrProps = Omit<MarkdownOverrideProps<HTMLHRElement>, 'children'>;
