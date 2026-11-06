import { useRef, useEffect, useCallback } from 'react';

export interface SafeAsyncRunContext {
  /**
   * The AbortSignal for the active request.
   * Can be passed directly into fetch or API client methods.
   */
  signal: AbortSignal;
  /**
   * Function returning true if this request is superseded by a newer request or has been aborted.
   */
  isStale: () => boolean;
  /**
   * Monotonically incrementing request identifier for this execution.
   */
  requestId: number;
}

/**
 * Custom React Hook to prevent race conditions and stale UI states from out-of-order async responses.
 * Combines an incrementing requestId ref with an AbortController to guarantee that only the
 * latest initiated search/filter/lookup request updates state, automatically aborting or discarding slower
 * prior in-flight responses from Railway or local stores.
 */
export function useSafeAsyncRequest() {
  const requestIdRef = useRef<number>(0);
  const controllerRef = useRef<AbortController | null>(null);

  // Unmount cleanup: cancel any pending in-flight HTTP request immediately
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, []);

  /**
   * Dispatches an asynchronous operation protected against out-of-order race conditions.
   * If a previous request is still pending, it is aborted before the new one starts.
   */
  const runSafeAsync = useCallback(
    async <T>(
      asyncFn: (ctx: SafeAsyncRunContext) => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: any) => void
    ): Promise<T | undefined> => {
      // 1. Abort prior in-flight request
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      // 2. Increment request ID
      const thisRequestId = ++requestIdRef.current;
      const controller = new AbortController();
      controllerRef.current = controller;

      const isStale = () => thisRequestId !== requestIdRef.current || controller.signal.aborted;

      try {
        const result = await asyncFn({
          signal: controller.signal,
          isStale,
          requestId: thisRequestId
        });

        // 3. Stale Guard: If a newer request was dispatched while this one was running, drop the result
        if (isStale()) {
          return undefined;
        }

        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (err: any) {
        // Drop AbortError or stale failures silently to avoid setting error state for superseded requests
        if (err?.name === 'AbortError' || controller.signal.aborted || isStale()) {
          return undefined;
        }

        if (onError) {
          onError(err);
        } else {
          console.warn(`[useSafeAsyncRequest] Request #${thisRequestId} encountered an error:`, err);
        }
        return undefined;
      }
    },
    []
  );

  const abortPending = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  return { runSafeAsync, abortPending, requestIdRef };
}
