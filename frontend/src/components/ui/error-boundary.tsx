import * as React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  className?: string;
}

/**
 * Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire app.
 *
 * Automatically reports errors to Sentry when available.
 */
class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            'min-h-screen bg-background flex items-center justify-center p-4',
            this.props.className
          )}
        >
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. The error has been reported and we'll look into it.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded text-left overflow-auto max-h-32">
                <code className="text-xs text-destructive">
                  {this.state.error.message}
                </code>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={this.handleReset}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload}>Reload Page</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for ErrorBoundary to maintain consistent API
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

ErrorBoundary.displayName = 'ErrorBoundary';
