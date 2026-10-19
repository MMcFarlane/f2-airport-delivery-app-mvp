import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Muted } from '@/src/components/ui/Screen';
import {
  hubCategorySummaries,
  hubCounts,
  type HubCategoryId,
  type HubChip,
} from '@/src/domain';
import { useMenuPrep } from '@/src/hooks/useMenuPrep';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, radii, space, type } from '@/src/theme';

import { GatePill } from './BrowseChrome';

const swatches: Record<HubCategoryId, string> = {
  coffee: '#D4B08A',
  breakfast: '#F0CF7E',
  burgers: '#F2B36B',
  healthy: '#A9D195',
  bar: '#C98A4B',
  flight: '#9DB8E8',
};

const chips: { id: HubChip; label: string; icon: boolean }[] = [
  { id: 'ready10', label: 'Ready in 10 min', icon: true },
  { id: 'under20', label: 'Under 20 min', icon: false },
  { id: 'under10dollars', label: 'Under $10', icon: false },
];

export function BrowseBoard() {
  const { trip, error: tripError, openSheet } = useTripSession();
  const catalog = useCatalog();
  const window = useOrderingWindow(trip);
  const menus = useMenuPrep(catalog.restaurants.map((restaurant) => restaurant.id));
  const [text, setText] = useState('');
  const [chip, setChip] = useState<HubChip | null>(null);
  const ready = !catalog.loading && menus.ready;
  const catalogItems = [...menus.items, ...catalog.specials];
  const counts = ready ? hubCounts(catalog.restaurants, catalog.featured, catalog.specials, catalogItems, chip, text) : null;
  const categories = ready ? hubCategorySummaries(catalog.restaurants, catalogItems, chip, text) : [];

  function openList(list: 'restaurants' | 'featured' | 'specials', category?: HubCategoryId) {
    router.push(listHref(list, text, chip, category ?? null));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Browse</Text>
          {window && trip ? <GatePill label={`${trip.gate} · BY ${window.deliverByClock}`} onPress={openSheet} /> : null}
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            accessibilityLabel="Search restaurants, dishes, deals"
            value={text}
            onChangeText={setText}
            placeholder="Search restaurants, dishes, deals"
            placeholderTextColor={colors.placeholder}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            style={styles.input}
          />
        </View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chips}>
          {chips.map((entry) => {
            const selected = entry.id === chip;
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setChip(selected ? null : entry.id)}
                style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}>
                {entry.icon ? <Ionicons name="time-outline" size={15} color={colors.ink} /> : null}
                <Text style={styles.chipLabel}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tripError ? <Muted>{tripError}</Muted> : null}
        {catalog.error ? <Muted>{catalog.error}</Muted> : null}
        {menus.error ? <Muted>{menus.error}</Muted> : null}
        {!ready && !catalog.error && !menus.error ? <Muted>Loading restaurants, dishes, and deals.</Muted> : null}

        {counts ? (
          <View style={styles.stats}>
            <StatCard count={counts.restaurants} label="All restaurants" onPress={() => openList('restaurants')} />
            <StatCard count={counts.featured} label="Featured items" onPress={() => openList('featured')} />
            <StatCard count={counts.specials} label="Specials & bundles" onPress={() => openList('specials')} />
          </View>
        ) : null}

        {categories.length > 0 ? (
          <View style={styles.categories}>
            <Text style={styles.categoriesLabel}>Categories</Text>
            <View style={styles.grid}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.title}, ${category.detail}`}
                  onPress={() => openList(category.id === 'flight' ? 'specials' : 'restaurants', category.id)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{category.title}</Text>
                    <Text style={styles.cardDetail}>{category.detail}</Text>
                  </View>
                  <View style={[styles.swatch, { backgroundColor: swatches[category.id] }]} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ count, label, onPress }: { count: number; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.stat, pressed && styles.pressed]}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function listHref(list: 'restaurants' | 'featured' | 'specials', query: string, hub: HubChip | null, category: HubCategoryId | null): Href {
  const params: string[] = [];
  const trimmed = query.trim();
  if (trimmed) params.push(`q=${encodeURIComponent(trimmed)}`);
  if (hub) params.push(`hub=${hub}`);
  if (category) params.push(`category=${category}`);
  const search = params.length > 0 ? `?${params.join('&')}` : '';
  return `/browse/${list}${search}` as Href;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: 32,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
  },
  title: {
    ...type.title,
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 24,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    paddingVertical: 12,
  },
  chipScroll: {
    marginHorizontal: -space.xl,
  },
  chips: {
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radii.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipOn: {
    backgroundColor: colors.accent,
  },
  chipOff: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: {
    ...type.label,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: space.sm,
  },
  stat: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  statCount: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.accent,
  },
  statLabel: {
    color: colors.surface,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  categories: {
    gap: space.md,
  },
  categoriesLabel: {
    ...type.label,
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48%',
    minHeight: 92,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardCopy: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    gap: 6,
  },
  cardTitle: {
    ...type.label,
    fontSize: 16,
    lineHeight: 20,
  },
  cardDetail: {
    ...type.badge,
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  swatch: {
    width: 58,
  },
  pressed: {
    opacity: 0.85,
  },
});
