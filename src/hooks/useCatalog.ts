import { useCallback } from 'react';

import { createDataSource } from '@/src/data';
import type { DiscountCode } from '@/src/domain';

import { useAsyncValue } from './useAsyncValue';

const emptyCatalog = {
  restaurants: [],
  featured: [],
  specials: [],
};

export function useCatalog() {
  const { value, loading, error, reload } = useAsyncValue(async () => {
    const data = await createDataSource();
    const [restaurants, featured, specials] = await Promise.all([
      data.catalog.listRestaurants(),
      data.catalog.listFeatured(),
      data.catalog.listSpecials(),
    ]);
    return { restaurants, featured, specials };
  }, emptyCatalog);

  const getRestaurant = useCallback(async (id: string) => {
    const data = await createDataSource();
    return data.catalog.getRestaurant(id);
  }, []);

  const listMenu = useCallback(async (restaurantId: string) => {
    const data = await createDataSource();
    return data.catalog.listMenu(restaurantId);
  }, []);

  const getItem = useCallback(async (id: string) => {
    const data = await createDataSource();
    return data.catalog.getItem(id);
  }, []);

  const findDiscount = useCallback(async (code: string): Promise<DiscountCode | null> => {
    const data = await createDataSource();
    return data.catalog.findDiscount(code);
  }, []);

  return {
    restaurants: value.restaurants,
    featured: value.featured,
    specials: value.specials,
    loading,
    error,
    reload,
    getRestaurant,
    listMenu,
    getItem,
    findDiscount,
  };
}
