import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterChip } from '@/src/components/ui/FilterChip';
import { notifyViewportChanged } from '@/src/components/ui/viewport';
import { colors, radii, space, type } from '@/src/theme';

export type BrowseChip = {
  id: string;
  label: string;
};

type BrowseChromeProps = {
  title: string;
  trailing?: ReactNode;
  search?: {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    autoFocus?: boolean;
  };
  chips: readonly BrowseChip[];
  selectedChip: string | null;
  onChip: (id: string) => void;
  meta: string;
  onMetaPress?: () => void;
  sort?: {
    label: string;
    onPress: () => void;
  };
  children: ReactNode;
};

export function BrowseChrome({
  title,
  trailing,
  search,
  chips,
  selectedChip,
  onChip,
  meta,
  onMetaPress,
  sort,
  children,
}: BrowseChromeProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onScroll={notifyViewportChanged}
        scrollEventThrottle={100}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.navigate('/');
            }}
            style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          {trailing}
        </View>

        {search ? (
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.placeholder} />
            <TextInput
              accessibilityLabel={search.placeholder}
              value={search.value}
              onChangeText={search.onChange}
              placeholder={search.placeholder}
              placeholderTextColor={colors.placeholder}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus={search.autoFocus}
              clearButtonMode="while-editing"
              style={styles.input}
            />
          </View>
        ) : null}

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={styles.chipsContent}>
          {chips.map((chip) => (
            <FilterChip
              key={chip.id}
              label={chip.label}
              selected={chip.id === selectedChip}
              onPress={() => onChip(chip.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.metaRow}>
          {onMetaPress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sort. ${meta}`}
              onPress={onMetaPress}
              style={styles.metaPress}>
              <Text style={styles.metaInline}>{meta}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.ink} />
            </Pressable>
          ) : (
            <Text style={styles.meta}>{meta}</Text>
          )}
          {sort ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sort, ${sort.label}`}
              onPress={sort.onPress}
              style={styles.sort}>
              <Text style={styles.sortLabel}>{sort.label}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>

        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function GatePill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}. Change trip.`} onPress={onPress} style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export type IncomingBrowse = {
  initialQuery?: string;
  initialHub?: string;
  initialCategory?: string;
};

export function CartBadge({ count, onPress }: { count: number; onPress: () => void }) {
  const label = count === 1 ? 'Cart, 1 item' : `Cart, ${count} items`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.cart}>
      <Ionicons name="bag-handle-outline" size={20} color={colors.surface} />
      {count > 0 ? (
        <View style={styles.cartCount}>
          <Text style={styles.cartCountText}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SearchToggle({ open, onPress }: { open: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Hide search' : 'Search specials'}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={[styles.searchToggle, open && styles.searchToggleOn]}>
      <Ionicons name="search" size={18} color={open ? colors.accent : colors.ink} />
    </Pressable>
  );
}

export function cycleChoice<T>(options: readonly T[], current: T): T {
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] ?? current;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: 32,
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingTop: space.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.title,
    flex: 1,
    fontSize: 28,
    lineHeight: 32,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    paddingVertical: 12,
  },
  chips: {
    marginHorizontal: -space.xl,
  },
  chipsContent: {
    paddingHorizontal: space.xl,
    gap: space.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  metaPress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  meta: {
    ...type.body,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  metaInline: {
    ...type.body,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sortLabel: {
    ...type.label,
    fontSize: 14,
  },
  pill: {
    backgroundColor: colors.ink,
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    ...type.badge,
    color: colors.accent,
  },
  cart: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartCountText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchToggleOn: {
    backgroundColor: colors.ink,
  },
});
