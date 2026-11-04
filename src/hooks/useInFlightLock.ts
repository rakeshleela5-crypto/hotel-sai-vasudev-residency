import { useState, useRef, useCallback } from 'react';

/**
 * Custom React Hook to prevent double-click race conditions and duplicate submissions.
 * Uses a synchronous `useRef` lock to instantly block rapid clicks (<300ms) before
 * React re-renders, alongside `isSubmitting` state to disable buttons and show loading spinners.
 */
export function useInFlightLock(cooldownMs: number = 350) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockRef = useRef(false);

  const runWithLock = useCallback(
    async <T,>(action: () => Promise<T> | T): Promise<T | undefined> => {
      // Synchronous in-flight lock: blocks duplicate calls in the exact same event tick or <300ms
      if (lockRef.current) {
        console.warn(`[InFlightLock] Duplicate click blocked (<${cooldownMs}ms cooldown)`);
        return undefined;
      }

      lockRef.current = true;
      setIsSubmitting(true);

      try {
        return await action();
      } finally {
        setTimeout(() => {
          lockRef.current = false;
        }, cooldownMs);
        setIsSubmitting(false);
      }
    },
    [cooldownMs]
  );

  return { isSubmitting, lockRef, runWithLock };
}

