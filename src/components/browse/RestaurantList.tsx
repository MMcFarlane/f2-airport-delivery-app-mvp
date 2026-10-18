import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RestaurantCard } from '@/src/components/ui/RestaurantCard';
import { Muted } from '@/src/components/ui/Screen';
import {
  availabilityLabel,
  cuisineChipLabels,
  menuAvailability,
  reachCountLabel,
  restaurantVisible,
  sortRestaurants,
  type RestaurantFilter,
  type RestaurantSort,
} from '@/src/domain';
import { useMenuPrep } from '@/src/hooks/useMenuPrep';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useTripSession } from '@/src/hooks/TripProvider';
import { space } from '@/src/theme';

import { BrowseChrome, cycleChoice, GatePill, type BrowseChip } from './BrowseChrome';

const sorts = ['fastest', 'name'] as const;

const sortLabels: Record<RestaurantSort, string> = {
  fastest: 'Fastest first',
  name: 'A–Z',
};

export function RestaurantList() {
  const { trip, loading: tripLoading, error: tripError, openSheet } = useTripSession();
  const catalog = useCatalog();
  const window = useOrderingWindow(trip);
  const menus = useMenuPrep(catalog.restaurants.map((restaurant) => restaurant.id));
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<string | null>('fits');
  const [sort, setSort] = useState<RestaurantSort>('fastest');

  const chips: BrowseChip[] = [
    { id: 'fits', label: 'Fits my window' },
    { id: 'under10', label: 'Under 10 min' },
    ...cuisineChipLabels(catalog.restaurants).map((label) => ({ id: `cuisine:${label}`, label })),
  ];
  const filter = restaurantFilter(chip);
  const availabilityById = new Map(
    catalog.restaurants.map((restaurant) => [
      restaurant.id,
      window
        ? menuAvailability(restaurant.fastestPrepMinutes, menus.prep[restaurant.id] ?? [], window.fits)
        : ('late' as const),
    ]),
  );
  const rows = sortRestaurants(catalog.restaurants, sort, (restaurant) => availabilityById.get(restaurant.id) ?? 'late').flatMap(
    (restaurant) => {
      const availability = availabilityById.get(restaurant.id) ?? 'late';
      if (!window || !restaurantVisible(restaurant, availability, filter, query)) return [];
      return [{ restaurant, availability }];
    },
  );
  const reaching = rows.filter((entry) => entry.availability !== 'late').length;

  const waiting = tripLoading || catalog.loading || menus.loading;

  return (
    <BrowseChrome
      title="Restaurants"
      trailing={
        window && trip ? (
          <GatePill label={`${trip.gate} · BY ${window.deliverByClock}`} onPress={openSheet} />
        ) : null
      }
      search={{
        value: query,
        placeholder: 'Search restaurants or cuisines',
        onChange: setQuery,
      }}
      chips={chips}
      selectedChip={chip}
      onChip={(id) => setChip((current) => (current === id ? null : id))}
      meta={window && trip ? reachCountLabel(reaching, trip.gate) : 'Set your gate to see what can reach you'}
      sort={{
        label: sortLabels[sort],
        onPress: () => setSort((current) => cycleChoice(sorts, current)),
      }}>
      {waiting ? <Muted>Loading restaurants.</Muted> : null}
      {tripError ? <Muted>{tripError}</Muted> : null}
      {catalog.error ? <Muted>{catalog.error}</Muted> : null}
      {menus.error ? <Muted>{menus.error}</Muted> : null}
      {!waiting && !trip ? <Muted>Set your gate to see what can reach you before you board.</Muted> : null}
      {!waiting && window && rows.length === 0 ? <Muted>No restaurants match.</Muted> : null}
      {window && menus.ready ? (
        <View style={styles.list}>
          {rows.map(({ restaurant, availability }) => (
            <RestaurantCard
              key={restaurant.id}
              initials={restaurant.initials}
              markColor={restaurant.color}
              name={restaurant.name}
              detail={`${restaurant.cuisine} · ${restaurant.location}`}
              status={availabilityLabel(availability, window.deliverByClock)}
              statusTone={availability === 'full' ? 'ok' : availability}
              minutes={`${restaurant.fastestPrepMinutes} MIN`}
              onPress={() => router.push(`/restaurant/${restaurant.id}` as Href)}
            />
          ))}
        </View>
      ) : null}
    </BrowseChrome>
  );
}

function restaurantFilter(id: string | null): RestaurantFilter | null {
  if (id === 'fits') return { type: 'fits' };
  if (id === 'under10') return { type: 'under10' };
  if (id?.startsWith('cuisine:')) return { type: 'cuisine', label: id.slice('cuisine:'.length) };
  return null;
}

const styles = StyleSheet.create({
  list: {
    gap: space.md,
  },
});
