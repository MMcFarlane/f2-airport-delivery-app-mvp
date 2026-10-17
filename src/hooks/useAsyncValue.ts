import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage } from './error-message';

export function useAsyncValue<T>(load: () => Promise<T>, initial: T) {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const reload = useCallback(async () => {
    try {
      const next = await loadRef.current();
      setValue(next);
      setError(null);
      return next;
    } catch (caught) {
      setError(errorMessage(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadRef.current()
      .then((next) => {
        if (!active) return;
        setValue(next);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { value, setValue, loading, error, reload };
}
