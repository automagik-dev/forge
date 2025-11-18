import { useEffect, useRef, useState, useCallback, memo } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button.tsx';
import { Check, Clipboard } from 'lucide-react';
import { writeClipboardViaBridge } from '@/vscode/bridge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');

    // Initialize mermaid with theme
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });

    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        // Generate unique ID for each diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, chart.trim());

        // Insert the SVG
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart]);

  const handleCopy = useCallback(async () => {
    try {
      await writeClipboardViaBridge(chart);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 400);
    } catch {
      // noop – bridge handles fallback
    }
  }, [chart]);

  if (error) {
    return (
      <div className={`p-4 bg-destructive/10 border border-destructive/20 rounded-md ${className}`}>
        <p className="text-sm text-destructive font-medium">Mermaid Error:</p>
        <pre className="text-xs mt-2 text-destructive/80 overflow-x-auto">
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mermaid container */}
      <div
        ref={containerRef}
        className="mermaid-diagram overflow-x-auto bg-muted/30 rounded-md p-4 my-2"
      />

      {/* Copy button (hover-activated) */}
      {isHovered && (
        <div className="absolute top-2 right-2 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    type="button"
                    aria-label={copied ? 'Copied!' : 'Copy diagram code'}
                    title={copied ? 'Copied!' : 'Copy diagram code'}
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="h-8 w-8 rounded-md bg-background/95 backdrop-blur border border-border shadow-sm transition-opacity"
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
                {copied ? 'Copied!' : 'Copy diagram code'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}

export default memo(MermaidDiagram);
