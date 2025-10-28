import { useEffect, useState, useRef, useCallback } from 'react';
import { applyPatch } from 'rfc6902';
import type { Operation } from 'rfc6902';

type WsJsonPatchMsg = { JsonPatch: Operation[] };
type WsFinishedMsg = { finished: boolean };
type WsMsg = WsJsonPatchMsg | WsFinishedMsg;

interface UseJsonPatchStreamOptions<T> {
  /**
   * Called once when the stream starts to inject initial data
   */
  injectInitialEntry?: (data: T) => void;
  /**
   * Filter/deduplicate patches before applying them
   */
  deduplicatePatches?: (patches: Operation[]) => Operation[];
}

interface UseJsonPatchStreamResult<T> {
  data: T | undefined;
  isConnected: boolean;
  error: string | null;
}

/**
 * Generic hook for consuming WebSocket streams that send JSON messages with patches
 */
export const useJsonPatchWsStream = <T>(
  endpoint: string | undefined,
  enabled: boolean,
  initialData: () => T,
  options: UseJsonPatchStreamOptions<T> = {}
): UseJsonPatchStreamResult<T> => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const dataRef = useRef<T | undefined>(undefined);
  const retryTimerRef = useRef<number | null>(null);
  const retryAttemptsRef = useRef<number>(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const finishedRef = useRef<boolean>(false);

  // OPTIMIZATION: Batch patch applications with requestAnimationFrame
  const pendingPatchesRef = useRef<Operation[]>([]);
  const rafIdRef = useRef<number | null>(null);

  // OPTIMIZATION: Flush batched patches in next animation frame
  const flushPatches = useCallback(() => {
    rafIdRef.current = null;
    if (pendingPatchesRef.current.length === 0 || !dataRef.current) return;

    // Apply deduplicated patches if configured
    const filtered = options.deduplicatePatches
      ? options.deduplicatePatches(pendingPatchesRef.current)
      : pendingPatchesRef.current;

    if (filtered.length === 0) {
      pendingPatchesRef.current = [];
      return;
    }

    // Deep clone current state before mutating
    dataRef.current = structuredClone(dataRef.current);

    // Apply all batched patches at once
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyPatch(dataRef.current as any, filtered);

    // Trigger React re-render
    setData(dataRef.current);

    // Clear batch
    pendingPatchesRef.current = [];
  }, [options]);

  function scheduleReconnect() {
    if (retryTimerRef.current) return; // already scheduled
    // Exponential backoff with cap: 1s, 2s, 4s, 8s (max), then stay at 8s
    const attempt = retryAttemptsRef.current;
    const delay = Math.min(8000, 1000 * Math.pow(2, attempt));
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      setRetryNonce((n) => n + 1);
    }, delay);
  }

  useEffect(() => {
    if (!enabled || !endpoint) {
      // Close connection and reset state
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryAttemptsRef.current = 0;
      finishedRef.current = false;
      setData(undefined);
      setIsConnected(false);
      setError(null);
      dataRef.current = undefined;
      return;
    }

    // Initialize data
    if (!dataRef.current) {
      dataRef.current = initialData();

      // Inject initial entry if provided
      if (options.injectInitialEntry) {
        options.injectInitialEntry(dataRef.current);
      }
    }

    // Create WebSocket if it doesn't exist
    if (!wsRef.current) {
      // Reset finished flag for new connection
      finishedRef.current = false;

      // Convert HTTP endpoint to WebSocket endpoint
      const wsEndpoint = endpoint.replace(/^http/, 'ws');
      const ws = new WebSocket(wsEndpoint);

      ws.onopen = () => {
        setError(null);
        setIsConnected(true);
        // Reset backoff on successful connection
        retryAttemptsRef.current = 0;
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMsg = JSON.parse(event.data);

          // Handle JsonPatch messages (same as SSE json_patch event)
          if ('JsonPatch' in msg) {
            const patches: Operation[] = msg.JsonPatch;
            if (!patches.length || !dataRef.current) return;

            // OPTIMIZATION: Batch patches and flush on next animation frame
            pendingPatchesRef.current.push(...patches);

            // Schedule flush if not already scheduled
            if (rafIdRef.current === null) {
              rafIdRef.current = requestAnimationFrame(flushPatches);
            }
          }

          // Handle finished messages ({finished: true})
          // Treat finished as terminal - do NOT reconnect
          if ('finished' in msg) {
            // Flush any pending patches immediately before finishing
            if (rafIdRef.current !== null) {
              cancelAnimationFrame(rafIdRef.current);
              rafIdRef.current = null;
              flushPatches();
            }

            finishedRef.current = true;
            ws.close(1000, 'finished');
            wsRef.current = null;
            setIsConnected(false);
          }
        } catch (err) {
          console.error('Failed to process WebSocket message:', err);
          setError('Failed to process stream update');
        }
      };

      ws.onerror = () => {
        setError('Connection failed');
      };

      ws.onclose = (evt) => {
        setIsConnected(false);
        wsRef.current = null;

        // Do not reconnect if we received a finished message or clean close
        if (finishedRef.current || (evt?.code === 1000 && evt?.wasClean)) {
          return;
        }

        // Otherwise, reconnect on unexpected/error closures
        retryAttemptsRef.current += 1;
        scheduleReconnect();
      };

      wsRef.current = ws;
    }

    return () => {
      // OPTIMIZATION: Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      if (wsRef.current) {
        const ws = wsRef.current;

        // Clear all event handlers first to prevent callbacks after cleanup
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;

        // Close regardless of state
        ws.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      finishedRef.current = false;
      dataRef.current = undefined;
      pendingPatchesRef.current = [];
      setData(undefined);
    };
  }, [
    endpoint,
    enabled,
    initialData,
    options,
    retryNonce,
    flushPatches,
  ]);

  return { data, isConnected, error };
};
