import { useEffect, useState } from 'react';

import { createDataSource } from '@/src/data';
import type { PlacePhoto } from '@/src/domain';

/**
 * The restaurant's Google Places cover for this session. Pass `enabled: false` until the card is on screen:
 * each first look at a restaurant is a billed photo request.
 */
export function useRestaurantCover(placeId: string | null, enabled = true): PlacePhoto | null {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);

  useEffect(() => {
    if (!placeId || !enabled) return;
    let active = true;
    createDataSource()
      .then((data) => data.photos.coverFor(placeId))
      .then((next) => {
        if (active) setPhoto(next);
      })
      .catch(() => {
        // No photo is the fallback; the card keeps its initials.
      });
    return () => {
      active = false;
    };
  }, [placeId, enabled]);

  return photo;
}
