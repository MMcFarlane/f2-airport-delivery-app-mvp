import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SpecialTile } from '@/src/components/home/SpecialTile';
import { Muted } from '@/src/components/ui/Screen';
import {
  formatCents,
  itemPassesHub,
  parseHubCategory,
  parseHubChip,
  sortSpecials,
  specialsLine,
  specialTagLabels,
  specialVisible,
  type HubChip,
  type SpecialSort,
} from '@/src/domain';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useCart } from '@/src/hooks/useCart';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useTripSession } from '@/src/hooks/TripProvider';
import { space } from '@/src/theme';

import { BrowseChrome, cycleChoice, SearchToggle, type BrowseChip, type IncomingBrowse } from './BrowseChrome';
import { useAddItem } from './useAddItem';

const sorts = ['listed', 'fastest'] as const;

const sortLabels: Record<SpecialSort, string> = {
  listed: 'As listed',
  fastest: 'Fastest first',
};

export function SpecialsList({ initialQuery = '', initialHub = '', initialCategory = '' }: IncomingBrowse = {}) {
  const { trip, loading: tripLoading, error: tripError } = useTripSession();
  const catalog = useCatalog();
  const { addLine } = useCart();
  const window = useOrderingWindow(trip);
  const { addItem, addingId, error: addError } = useAddItem(addLine);
  const [query, setQuery] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(initialQuery.trim().length > 0);
  const [chip, setChip] = useState<string | null>(parseHubCategory(initialCategory) === 'flight' ? 'tag:For the flight' : 'all');
  const [hubFilter, setHubFilter] = useState<HubChip | null>(parseHubChip(initialHub));
  const [sort, setSort] = useState<SpecialSort>('listed');

  const chips: BrowseChip[] = [
    { id: 'all', label: 'All' },
    ...specialTagLabels(catalog.specials).map((label) => ({ id: `tag:${label}`, label })),
  ];
  const tag = chip?.startsWith('tag:') ? chip.slice('tag:'.length) : null;
  const visible = catalog.specials.filter((item) => specialVisible(item, tag, query) && itemPassesHub(item, hubFilter, ''));
  const rows = window ? sortSpecials(visible, sort, window.fits) : [];
  const waiting = tripLoading || catalog.loading;

  return (
    <BrowseChrome
      title="Specials & bundles"
      trailing={
        <SearchToggle
          open={searchOpen}
          onPress={() => {
            setSearchOpen((open) => {
              if (open) setQuery('');
              return !open;
            });
          }}
        />
      }
      search={
        searchOpen
          ? {
              value: query,
              placeholder: 'Search specials and bundles',
              onChange: setQuery,
              autoFocus: true,
            }
          : undefined
      }
      chips={chips}
      selectedChip={chip}
      onChip={(id) => {
        setHubFilter(null);
        setChip((current) => (current === id ? null : id));
      }}
      meta={window && trip ? specialsLine(trip.gate, window.deliverByClock) : 'Set your gate to see what can reach you'}
      sort={{
        label: sortLabels[sort],
        onPress: () => setSort((current) => cycleChoice(sorts, current)),
      }}>
      {waiting ? <Muted>Loading specials.</Muted> : null}
      {tripError ? <Muted>{tripError}</Muted> : null}
      {catalog.error ? <Muted>{catalog.error}</Muted> : null}
      {addError ? <Muted>{addError}</Muted> : null}
      {!waiting && !trip ? <Muted>Set your gate to see what can reach you before you board.</Muted> : null}
      {!waiting && window && rows.length === 0 ? <Muted>No deals match.</Muted> : null}
      {window ? (
        <View style={styles.list}>
          {rows.map((item) => {
            const tooLate = !window.fits(item.prepMinutes);
            return (
              <SpecialTile
                key={item.id}
                fill
                name={item.name}
                description={item.description}
                restaurantName={item.restaurantName}
                price={formatCents(item.priceCents)}
                compareAt={item.compareAtCents === null ? null : formatCents(item.compareAtCents)}
                minutes={`${item.prepMinutes} MIN`}
                badge={item.badge}
                imageColor={item.imageColor}
                tooLate={tooLate}
                adding={addingId === item.id}
                onPress={() => router.push(`/item/${item.id}` as Href)}
                onAdd={tooLate ? undefined : () => void addItem(item, true)}
              />
            );
          })}
        </View>
      ) : null}
    </BrowseChrome>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.md,
  },
});
