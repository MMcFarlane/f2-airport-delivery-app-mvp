import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddItem } from '@/src/components/browse/useAddItem';
import { PlusButton } from '@/src/components/home/PlusButton';
import { LaterScreen } from '@/src/components/ui/LaterScreen';
import { Muted } from '@/src/components/ui/Screen';
import { createDataSource } from '@/src/data';
import {
  arrivalLine,
  cartArrival,
  cartFoodCents,
  cartItemCount,
  cuisineLocationLine,
  fittingPrepRange,
  formatCents,
  formatClock,
  itemsForMenuTab,
  menuTabs,
  openUntilLabel,
  prepRangeLabel,
  toGateChip,
  tooLateLabel,
  type MenuItem,
} from '@/src/domain';
import { useAsyncValue } from '@/src/hooks/useAsyncValue';
import { useCart } from '@/src/hooks/useCart';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, radii, space, type } from '@/src/theme';
import { markInk, markNeedsBorder } from '@/src/theme/contrast';

import { CartBar } from './CartBar';

export function RestaurantMenu({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { trip } = useTripSession();
  const window = useOrderingWindow(trip);
  const { cart, addLine, reload: reloadCart } = useCart();
  useFocusEffect(
    useCallback(() => {
      void reloadCart();
    }, [reloadCart]),
  );
  const { addItem, addingId, error: addError } = useAddItem(addLine);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const loaded = useAsyncValue(async () => {
    if (!id) return null;
    const data = await createDataSource();
    const [restaurant, items] = await Promise.all([data.catalog.getRestaurant(id), data.catalog.listMenu(id)]);
    return restaurant ? { restaurant, items } : null;
  }, null);
  const percents = useDiscountPercents(cart?.lines ?? []);

  if (loaded.loading) return <LaterScreen title="Menu" body="Loading this menu." />;
  if (loaded.error) return <LaterScreen title="Menu" body={loaded.error} />;
  if (!loaded.value) return <LaterScreen title="Menu" body="That restaurant is not in the catalog." />;

  const { restaurant, items } = loaded.value;
  const tabs = menuTabs(items);
  const selected = tabs.some((tab) => tab.id === picked) ? picked : (tabs[0]?.id ?? null);
  const rows = itemsForMenuTab(items, selected, query);
  const range = window ? fittingPrepRange(items.map((item) => item.prepMinutes), window.fits) : null;
  const priced = (cart?.lines ?? []).map((line) => ({
    priceCents: line.priceCents,
    quantity: line.quantity,
    prepMinutes: line.prepMinutes,
    discountPercent: line.discountCode ? (percents[line.discountCode.toUpperCase()] ?? 0) : 0,
  }));
  const count = cartItemCount(priced);
  const arrival =
    window && trip && priced.length > 0
      ? arrivalLine(trip.gate, formatClock(cartArrival(window.now, priced.map((line) => line.prepMinutes))))
      : null;
  const ink = markInk(restaurant.color);
  const lightCover = markNeedsBorder(restaurant.color) || ink === colors.ink;

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: count > 0 ? 128 : 32 }}>
        <View style={[styles.cover, { backgroundColor: restaurant.color, paddingTop: insets.top + 8 }]}>
          <View style={styles.header}>
            <RoundButton label="Back" light={lightCover} onPress={goBack}>
              <Ionicons name="chevron-back" size={22} color={colors.ink} />
            </RoundButton>
            <RoundButton
              label={searchOpen ? 'Hide search' : 'Search the menu'}
              light={lightCover}
              onPress={() => {
                setSearchOpen((open) => {
                  if (open) setQuery('');
                  return !open;
                });
              }}>
              <Ionicons name="search" size={18} color={colors.ink} />
            </RoundButton>
          </View>
          {searchOpen ? (
            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.placeholder} />
              <TextInput
                accessibilityLabel="Search the menu"
                value={query}
                onChangeText={setQuery}
                placeholder="Search this menu"
                placeholderTextColor={colors.placeholder}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
                clearButtonMode="while-editing"
                style={styles.searchInput}
              />
            </View>
          ) : null}
          <Text style={[styles.coverCaption, { color: ink }]}>Cover photo</Text>
        </View>

        <View style={styles.identity}>
          <View
            style={[
              styles.mark,
              { backgroundColor: restaurant.color },
              markNeedsBorder(restaurant.color) && styles.markBorder,
            ]}>
            <Text style={[styles.initials, { color: ink }]}>{restaurant.initials}</Text>
          </View>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.place}>{cuisineLocationLine(restaurant.cuisine, restaurant.location)}</Text>
          <View style={styles.chips}>
            {trip && range ? (
              <View style={styles.deliveryChip}>
                <Text style={styles.deliveryText}>{toGateChip(trip.gate, prepRangeLabel(range))}</Text>
              </View>
            ) : null}
            {restaurant.openUntil ? (
              <View style={styles.hoursChip}>
                <Text style={styles.hoursText}>{openUntilLabel(restaurant.openUntil)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {tabs.length > 0 ? (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}>
            {tabs.map((tab) => {
              const on = tab.id === selected && query.trim().length === 0;
              return (
                <Pressable
                  key={tab.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setPicked(tab.id);
                    setQuery('');
                  }}
                  style={styles.tab}>
                  <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{tab.label}</Text>
                  {on ? <View style={styles.tabLine} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.list}>
          {addError ? <Muted>{addError}</Muted> : null}
          {rows.length === 0 ? <Muted>No dishes match.</Muted> : null}
          {rows.map((item) => {
            const tooLate = window ? !window.fits(item.prepMinutes) : true;
            return (
              <MenuRow
                key={item.id}
                item={item}
                tooLate={tooLate}
                lateCopy={window ? tooLateLabel(window.deliverByClock) : 'Set your gate to order'}
                adding={addingId === item.id}
                onOpen={() => router.push(`/item/${item.id}` as Href)}
                onAdd={() => void addItem(item, !tooLate)}
              />
            );
          })}
        </View>
      </ScrollView>

      {count > 0 ? (
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <CartBar
            count={count}
            arrival={arrival}
            total={formatCents(cartFoodCents(priced))}
            onPress={() => router.push('/cart' as Href)}
          />
        </View>
      ) : null}
    </View>
  );
}

function MenuRow({
  item,
  tooLate,
  lateCopy,
  adding,
  onOpen,
  onAdd,
}: {
  item: MenuItem;
  tooLate: boolean;
  lateCopy: string;
  adding: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
        <View style={styles.copy}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.price}>{formatCents(item.priceCents)}</Text>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.minutes}>{item.prepMinutes} MIN</Text>
            {tooLate ? <Text style={styles.late}>{lateCopy}</Text> : null}
          </View>
        </View>
        <View style={[styles.photo, { backgroundColor: item.imageColor }, tooLate && styles.photoLate]} />
      </Pressable>
      <View style={styles.add}>
        <PlusButton
          label={tooLate ? `${item.name} is too late to add` : `Add ${item.name}`}
          disabled={tooLate || adding}
          onPress={onAdd}
        />
      </View>
    </View>
  );
}

function RoundButton({
  label,
  light,
  onPress,
  children,
}: {
  label: string;
  light: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, light && styles.roundLight, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.navigate('/');
}

function useDiscountPercents(lines: readonly { discountCode: string | null }[]) {
  const key = [...new Set(lines.flatMap((line) => (line.discountCode ? [line.discountCode] : [])))].sort().join('\n');
  const [percents, setPercents] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!key) return;
    let active = true;
    createDataSource()
      .then(async (data) => {
        const next: Record<string, number> = {};
        for (const code of key.split('\n')) {
          const discount = await data.catalog.findDiscount(code);
          if (discount) next[discount.code.toUpperCase()] = discount.percentOff;
        }
        if (active) setPercents(next);
      })
      .catch(() => {
        if (active) setPercents({});
      });
    return () => {
      active = false;
    };
  }, [key]);

  return key ? percents : {};
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cover: {
    minHeight: 168,
    paddingHorizontal: space.xl,
    paddingBottom: 28,
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundLight: {
    borderWidth: 1,
    borderColor: colors.border,
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
  searchInput: {
    flex: 1,
    ...type.body,
    color: colors.ink,
    paddingVertical: 12,
  },
  coverCaption: {
    alignSelf: 'flex-end',
    ...type.body,
    fontSize: 13,
    opacity: 0.7,
  },
  identity: {
    paddingHorizontal: space.xl,
    gap: 6,
    marginTop: -22,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBorder: {
    borderColor: colors.border,
  },
  initials: {
    fontSize: 20,
    fontWeight: '800',
  },
  name: {
    ...type.title,
    fontSize: 30,
    lineHeight: 34,
    marginTop: 4,
  },
  place: type.body,
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.sm,
  },
  deliveryChip: {
    backgroundColor: colors.ink,
    borderRadius: radii.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deliveryText: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  hoursChip: {
    backgroundColor: colors.surface,
    borderRadius: radii.chip,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  hoursText: {
    ...type.badge,
    color: colors.ink,
    textTransform: 'uppercase',
  },
  tabs: {
    paddingHorizontal: space.xl,
    gap: 22,
    paddingTop: space.lg,
  },
  tab: {
    paddingBottom: 10,
  },
  tabLabel: {
    ...type.label,
    fontSize: 16,
    color: colors.muted,
  },
  tabLabelOn: {
    color: colors.ink,
  },
  tabLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: colors.ink,
  },
  list: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.sm,
  },
  row: {
    position: 'relative',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    paddingRight: 8,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    ...type.headline,
    fontSize: 16,
    lineHeight: 21,
  },
  description: {
    ...type.body,
    fontSize: 14,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: type.label,
  minutes: {
    ...type.badge,
    letterSpacing: 0.2,
    color: colors.ink,
  },
  late: {
    ...type.badge,
    letterSpacing: 0.2,
    color: colors.danger,
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: 16,
  },
  photoLate: {
    opacity: 0.45,
  },
  add: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    zIndex: 1,
  },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
});
