import { useEffect, useState } from 'react';

import { createDataSource } from '@/src/data';
import type { MenuItem } from '@/src/domain';

import { errorMessage } from './error-message';

type PrepState = {
  key: string;
  prep: Record<string, number[]>;
  items: MenuItem[];
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
        const items: MenuItem[] = [];
        ids.forEach((id, index) => {
          const menu = menus[index] ?? [];
          prep[id] = menu.map((item) => item.prepMinutes);
          items.push(...menu);
        });
        setState({ key, prep, items, error: null });
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setState({ key, prep: {}, items: [], error: errorMessage(caught) });
      });

    return () => {
      active = false;
    };
  }, [key]);

  if (!key) return { prep: {}, items: [], loading: false, error: null, ready: true };

  const current = state?.key === key ? state : null;
  return {
    prep: current?.prep ?? {},
    items: current?.items ?? [],
    loading: current === null,
    error: current?.error ?? null,
    ready: current !== null && current.error === null,
  };
}
