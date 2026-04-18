import { useEffect, useRef, useCallback } from 'react';

/**
 * Poll a function at an interval until a condition is met
 */
const usePolling = (fn, interval = 3000, enabled = false, stopCondition = null) => {
  const timerRef = useRef(null);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const start = useCallback(() => {
    if (timerRef.current) return;
    const poll = async () => {
      try {
        const result = await fnRef.current();
        if (stopCondition && stopCondition(result)) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return;
        }
      } catch {
        // continue polling on error
      }
    };
    poll(); // immediate first call
    timerRef.current = setInterval(poll, interval);
  }, [interval, stopCondition]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) start();
    else stop();
    return stop;
  }, [enabled, start, stop]);

  return { start, stop };
};

export default usePolling;
