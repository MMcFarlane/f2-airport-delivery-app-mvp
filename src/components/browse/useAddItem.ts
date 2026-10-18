import { useState } from 'react';

import type { AddCartLineInput } from '@/src/data/repositories';
import type { MenuItem } from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';

type AddLine = (input: AddCartLineInput) => Promise<unknown>;

export function useAddItem(addLine: AddLine) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addItem(item: MenuItem, allowed: boolean) {
    if (!allowed || addingId) return;
    setAddingId(item.id);
    setError(null);
    try {
      await addLine({ itemId: item.id });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setAddingId(null);
    }
  }

  return { addItem, addingId, error };
}
