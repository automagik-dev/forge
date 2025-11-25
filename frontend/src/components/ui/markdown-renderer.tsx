import Markdown from 'markdown-to-jsx';
import { memo, useMemo, useState, useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Check, Clipboard } from 'lucide-react';
import { writeClipboardViaBridge } from '@/vscode/bridge';
import MermaidDiagram from '@/components/ui/mermaid-diagram.tsx';
import type {
  MarkdownCodeProps,
  MarkdownPreProps,
  MarkdownImageProps,
  MarkdownTextProps,
  MarkdownHeadingProps,
  MarkdownListProps,
  MarkdownListItemProps,
  MarkdownTableProps,
  MarkdownTableHeadProps,
  MarkdownTableBodyProps,
  MarkdownTableRowProps,
  MarkdownTableCellProps,
  MarkdownBlockquoteProps,
  MarkdownHrProps,
} from '@/types/markdown';

const HIGHLIGHT_LINK =
  'rounded-sm bg-muted/50 px-1 py-0.5 underline-offset-2 transition-colors';
const HIGHLIGHT_LINK_HOVER = 'hover:bg-muted';
const HIGHLIGHT_CODE = 'rounded-sm bg-muted/50 px-1 py-0.5 font-mono text-sm';

function sanitizeHref(href?: string): string | undefined {
  if (typeof href !== 'string') return undefined;
  const trimmed = href.trim();
  // Block dangerous protocols
  if (/^(javascript|vbscript|data):/i.test(trimmed)) return undefined;
  // Allow anchors and common relative forms
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('/')
  )
    return trimmed;
  // Allow only https
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  // Block everything else by default
  return undefined;
}

function isExternalHref(href?: string): boolean {
  if (!href) return false;
  return /^https:\/\//i.test(href);
}

function LinkOverride({
  href,
  children,
  title,
}: {
  href?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const rawHref = typeof href === 'string' ? href : '';
  const safeHref = sanitizeHref(rawHref);

  const external = isExternalHref(safeHref);
  const internalOrDisabled = !external;

  if (!safeHref || internalOrDisabled) {
    // Disabled internal link (relative paths and anchors)
    return (
      <span
        role="link"
        aria-disabled="true"
        title={title || rawHref || undefined}
        className={`${HIGHLIGHT_LINK} cursor-not-allowed select-text`}
      >
        {children}
      </span>
    );
  }

  // External link
  return (
    <a
      href={safeHref}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className={`${HIGHLIGHT_LINK} ${HIGHLIGHT_LINK_HOVER} underline`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {children}
    </a>
  );
}

function ImageOverride({
  src,
  alt,
  title,
  ...props
}: MarkdownImageProps) {
  let imageSrc = typeof src === 'string' ? src.trim() : '';

  // Convert .forge-images/ paths to /api/images/ paths
  // Example: .forge-images/e6363133-7e74-4ad8-87e1-345f57531d53.png
  // Becomes: /api/images/e6363133-7e74-4ad8-87e1-345f57531d53/file
  if (imageSrc.startsWith('.forge-images/')) {
    const filename = imageSrc.replace('.forge-images/', '');
    const imageId = filename.replace(/\.[^.]+$/, ''); // Remove extension
    imageSrc = `/api/images/${imageId}/file`;
  }

  // Allow API image paths and external https images
  const isApiImage = imageSrc.startsWith('/api/images/');
  const isExternalImage = /^https:\/\//i.test(imageSrc);

  if (!imageSrc || (!isApiImage && !isExternalImage)) {
    // Invalid or unsafe image source
    return (
      <span className="inline-block px-2 py-1 text-xs bg-muted rounded">
        [Image: {alt || 'no source'}]
      </span>
    );
  }

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt || ''}
      title={title}
      className="max-w-full h-auto rounded border border-border my-2"
      loading="lazy"
    />
  );
}

function InlineCodeOverride({ children, className, ...props }: MarkdownCodeProps) {
  // Only highlight inline code, not fenced code blocks
  const hasLanguage =
    typeof className === 'string' && /\blanguage-/.test(className);
  if (hasLanguage) {
    // Likely a fenced block's <code>; leave className as-is for syntax highlighting
    return (
      <code {...props} className={className}>
        {children}
      </code>
    );
  }
  return (
    <code
      {...props}
      className={`${HIGHLIGHT_CODE}${className ? ` ${className}` : ''}`}
    >
      {children}
    </code>
  );
}

function PreOverride({ children, ...props }: MarkdownPreProps) {
  // Check if this is a mermaid code block
  const childClassName = children?.props?.className || '';
  const isMermaid =
    typeof childClassName === 'string' &&
    (childClassName.includes('lang-mermaid') ||
      childClassName.includes('language-mermaid'));

  if (isMermaid) {
    // Extract the mermaid code from children
    const code =
      typeof children?.props?.children === 'string'
        ? children.props.children
        : '';
    return <MermaidDiagram chart={code} />;
  }

  // Default pre rendering for code blocks
  return (
    <pre
      {...props}
      className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm bg-muted/50 rounded-sm p-2 my-2"
    >
      {children}
    </pre>
  );
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  enableCopyButton?: boolean;
}

function MarkdownRenderer({
  content,
  className = '',
  enableCopyButton = false,
}: MarkdownRendererProps) {
  const overrides = useMemo(
    () => ({
      a: { component: LinkOverride },
      img: { component: ImageOverride },
      code: { component: InlineCodeOverride },
      pre: { component: PreOverride },
      strong: {
        component: ({ children, ...props }: MarkdownTextProps) => (
          <span {...props} className="">
            {children}
          </span>
        ),
      },
      em: {
        component: ({ children, ...props }: MarkdownTextProps) => (
          <em {...props} className="italic">
            {children}
          </em>
        ),
      },
      p: {
        component: ({ children, ...props }: MarkdownTextProps) => (
          <p {...props} className="leading-tight my-2">
            {children}
          </p>
        ),
      },
      h1: {
        component: ({ children, ...props }: MarkdownHeadingProps) => (
          <h1
            {...props}
            className="text-lg font-medium leading-tight mt-4 mb-2"
          >
            {children}
          </h1>
        ),
      },
      h2: {
        component: ({ children, ...props }: MarkdownHeadingProps) => (
          <h2
            {...props}
            className="text-base font-medium leading-tight mt-4 mb-2"
          >
            {children}
          </h2>
        ),
      },
      h3: {
        component: ({ children, ...props }: MarkdownHeadingProps) => (
          <h3 {...props} className="text-sm leading-tight mt-3 mb-2">
            {children}
          </h3>
        ),
      },
      ul: {
        component: ({ children, ...props }: MarkdownListProps) => (
          <ul
            {...props}
            className="list-disc list-outside ps-6 my-3 space-y-1.5"
          >
            {children}
          </ul>
        ),
      },
      ol: {
        component: ({ children, ...props }: MarkdownListProps) => (
          <ol
            {...props}
            className="list-decimal list-outside ps-6 my-3 space-y-1.5"
          >
            {children}
          </ol>
        ),
      },
      li: {
        component: ({ children, ...props }: MarkdownListItemProps) => (
          <li {...props} className="leading-tight">
            {children}
          </li>
        ),
      },
      table: {
        component: ({ children, ...props }: MarkdownTableProps) => (
          <div className="overflow-x-auto my-4">
            <table
              {...props}
              className="min-w-full border-collapse border border-border"
            >
              {children}
            </table>
          </div>
        ),
      },
      thead: {
        component: ({ children, ...props }: MarkdownTableHeadProps) => (
          <thead {...props} className="bg-muted/50">
            {children}
          </thead>
        ),
      },
      tbody: {
        component: ({ children, ...props }: MarkdownTableBodyProps) => (
          <tbody {...props}>{children}</tbody>
        ),
      },
      tr: {
        component: ({ children, ...props }: MarkdownTableRowProps) => (
          <tr {...props} className="border-b border-border">
            {children}
          </tr>
        ),
      },
      th: {
        component: ({ children, ...props }: MarkdownTableCellProps) => (
          <th
            {...props}
            className="border border-border px-4 py-2 text-left font-medium"
          >
            {children}
          </th>
        ),
      },
      td: {
        component: ({ children, ...props }: MarkdownTableCellProps) => (
          <td {...props} className="border border-border px-4 py-2">
            {children}
          </td>
        ),
      },
      blockquote: {
        component: ({ children, ...props }: MarkdownBlockquoteProps) => (
          <blockquote
            {...props}
            className="border-l-4 border-primary/50 pl-4 py-2 my-4 italic bg-muted/20"
          >
            {children}
          </blockquote>
        ),
      },
      hr: {
        component: ({ ...props }: MarkdownHrProps) => (
          <hr {...props} className="my-6 border-t border-border" />
        ),
      },
    }),
    []
  );

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await writeClipboardViaBridge(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 400);
    } catch {
      // noop – bridge handles fallback
    }
  }, [content]);

  return (
    <div className={`relative group`}>
      {enableCopyButton && (
        <div className="absolute bottom-2 right-2 z-[1] pointer-events-none">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    type="button"
                    aria-label={copied ? 'Copied!' : 'Copy as Markdown'}
                    title={copied ? 'Copied!' : 'Copy as Markdown'}
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="pointer-events-auto opacity-0 group-hover:opacity-100 delay-0 transition-opacity duration-50 h-8 w-8 rounded-md bg-background/95 backdrop-blur border border-border shadow-sm"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                  </Button>
                  {copied && (
                    <div
                      className="absolute -right-1 mt-1 translate-y-1.5 select-none text-[11px] leading-none px-2 py-1 rounded bg-green-600 text-white shadow pointer-events-none"
                      role="status"
                      aria-live="polite"
                    >
                      Copied
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? 'Copied!' : 'Copy as Markdown'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <div className={className}>
        <Markdown options={{ overrides, disableParsingRawHTML: true }}>
          {content}
        </Markdown>
      </div>
    </div>
  );
}

export default memo(MarkdownRenderer);
