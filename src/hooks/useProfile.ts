import { useCallback } from 'react';

import { createDataSource } from '@/src/data';
import type { ProfilePatch } from '@/src/data/repositories';

import { useAsyncValue } from './useAsyncValue';

export function useProfile() {
  const { value: profile, setValue, loading, error, reload } = useAsyncValue(async () => {
    const data = await createDataSource();
    return data.profile.getProfile();
  }, null);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      const data = await createDataSource();
      const next = await data.profile.updateProfile(patch);
      setValue(next);
      return next;
    },
    [setValue],
  );

  return { profile, loading, error, reload, updateProfile };
}
