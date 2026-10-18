import { useEffect, useState } from 'react';

import { createDataSource } from '@/src/data';

import { errorMessage } from './error-message';

type PrepState = {
  key: string;
  prep: Record<string, number[]>;
  error: string | null;
};

export function useMenuPrep(restaurantIds: readonly string[]) {
  const key = restaurantIds.join('\n');
  const [state, setState] = useState<PrepState | null>(null);

  useEffect(() => {
    if (!key) return;

    let active = true;
    const ids = key.split('\n');

    createDataSource()
      .then((data) => Promise.all(ids.map((id) => data.catalog.listMenu(id))))
      .then((menus) => {
        if (!active) return;
        const prep: Record<string, number[]> = {};
        ids.forEach((id, index) => {
          prep[id] = menus[index]?.map((item) => item.prepMinutes) ?? [];
        });
        setState({ key, prep, error: null });
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setState({ key, prep: {}, error: errorMessage(caught) });
      });

    return () => {
      active = false;
    };
  }, [key]);

  if (!key) return { prep: {}, loading: false, error: null, ready: true };

  const current = state?.key === key ? state : null;
  return {
    prep: current?.prep ?? {},
    loading: current === null,
    error: current?.error ?? null,
    ready: current !== null && current.error === null,
  };
}
