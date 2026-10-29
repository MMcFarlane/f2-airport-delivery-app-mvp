import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FeaturedTile } from '@/src/components/home/FeaturedTile';
import { Muted } from '@/src/components/ui/Screen';
import {
  categoryChipLabels,
  featuredCountLabel,
  featuredVisible,
  formatCents,
  itemPassesHub,
  parseHubChip,
  sortFeatured,
  type FeaturedFilter,
  type FeaturedSort,
  type HubChip,
} from '@/src/domain';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useCart } from '@/src/hooks/useCart';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useTripSession } from '@/src/hooks/TripProvider';

import { BrowseChrome, CartBadge, cycleChoice, type BrowseChip, type IncomingBrowse } from './BrowseChrome';
import { useAddItem } from './useAddItem';

const sorts = ['fastest', 'price'] as const;

export function FeaturedList({ initialQuery = '', initialHub = '' }: IncomingBrowse = {}) {
  const { trip, loading: tripLoading, error: tripError } = useTripSession();
  const catalog = useCatalog();
  const { cart, addLine, reload: reloadCart } = useCart();
  useFocusEffect(
    useCallback(() => {
      void reloadCart();
    }, [reloadCart]),
  );
  const window = useOrderingWindow(trip);
  const { addItem, addingId, error: addError } = useAddItem(addLine);
  const [query, setQuery] = useState(initialQuery);
  const [chip, setChip] = useState<string | null>('all');
  const [hubFilter, setHubFilter] = useState<HubChip | null>(parseHubChip(initialHub));
  const [sort, setSort] = useState<FeaturedSort>('fastest');

  const chips: BrowseChip[] = [
    { id: 'all', label: 'All that fit' },
    { id: 'under10', label: 'Under 10 min' },
    { id: 'under10dollars', label: 'Under $10' },
    ...categoryChipLabels(catalog.featured).map((label) => ({ id: `category:${label}`, label })),
  ];
  const filter = featuredFilter(chip);
  const visible = catalog.featured.filter((item) => featuredVisible(item, filter, query) && itemPassesHub(item, hubFilter, ''));
  const rows = window ? sortFeatured(visible, sort, window.fits) : [];
  const arriving = window ? rows.filter((item) => window.fits(item.prepMinutes)).length : 0;
  const count = cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;
  const waiting = tripLoading || catalog.loading;

  return (
    <BrowseChrome
      title="Featured items"
      trailing={<CartBadge count={count} onPress={() => router.push('/cart' as Href)} />}
      search={{
        value: query,
        placeholder: 'Search dishes and drinks',
        onChange: setQuery,
      }}
      chips={chips}
      selectedChip={chip}
      onChip={(id) => {
        setHubFilter(null);
        setChip((current) => (current === id ? null : id));
      }}
      meta={
        window
          ? featuredCountLabel(arriving, window.deliverByClock, sort)
          : 'Set your gate to see what can reach you'
      }
      onMetaPress={window ? () => setSort((current) => cycleChoice(sorts, current)) : undefined}>
      {waiting ? <Muted>Loading featured items.</Muted> : null}
      {tripError ? <Muted>{tripError}</Muted> : null}
      {catalog.error ? <Muted>{catalog.error}</Muted> : null}
      {addError ? <Muted>{addError}</Muted> : null}
      {!waiting && !trip ? <Muted>Set your gate to see what can reach you before you board.</Muted> : null}
      {!waiting && window && rows.length === 0 ? <Muted>No dishes match.</Muted> : null}
      {window ? (
        <View style={styles.grid}>
          {rows.map((item) => {
            const tooLate = !window.fits(item.prepMinutes);
            return (
              <View key={item.id} style={styles.cell}>
                <FeaturedTile
                  fill
                  name={item.name}
                  restaurantName={item.restaurantName}
                  price={formatCents(item.priceCents)}
                  minutes={`${item.prepMinutes} MIN`}
                  imageColor={item.imageColor}
                  imageKey={item.imageKey}
                  tooLate={tooLate}
                  adding={addingId === item.id}
                  onPress={() => router.push(`/item/${item.id}` as Href)}
                  onAdd={tooLate ? undefined : () => void addItem(item, true)}
                />
              </View>
            );
          })}
        </View>
      ) : null}
    </BrowseChrome>
  );
}

function featuredFilter(id: string | null): FeaturedFilter | null {
  if (id === 'all') return { type: 'all' };
  if (id === 'under10') return { type: 'under10' };
  if (id === 'under10dollars') return { type: 'under10dollars' };
  if (id?.startsWith('category:')) return { type: 'category', label: id.slice('category:'.length) };
  return null;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  cell: {
    width: '48%',
  },
});
