import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FeaturedTile } from '@/src/components/home/FeaturedTile';
import { HomeCarousel } from '@/src/components/home/HomeCarousel';
import { RestaurantTile } from '@/src/components/home/RestaurantTile';
import { SpecialTile } from '@/src/components/home/SpecialTile';
import { Muted } from '@/src/components/ui/Screen';
import { formatCents, type MenuItem } from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';
import { useCart } from '@/src/hooks/useCart';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, radii, space, type } from '@/src/theme';

const restaurantsHref = '/browse/restaurants' as Href;
const featuredHref = '/browse/featured' as Href;
const specialsHref = '/browse/specials' as Href;

export default function HomeScreen() {
  const { trip, loading, error, openSheet } = useTripSession();
  const catalog = useCatalog();
  const { addLine } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const window = useOrderingWindow(trip);

  async function addItem(item: MenuItem) {
    if (!window || !window.fits(item.prepMinutes) || addingId) return;
    setAddingId(item.id);
    setAddError(null);
    try {
      await addLine({ itemId: item.id });
    } catch (caught) {
      setAddError(errorMessage(caught));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.title}>What you can get</Text>
          {window && trip ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Gate ${trip.gate}, deliver by ${window.deliverByClock}. Change trip.`}
              onPress={openSheet}
              style={styles.pill}>
              <Text style={styles.pillText}>
                {trip.gate} · BY {window.deliverByClock}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {loading || catalog.loading ? <Muted>Loading what can reach your gate.</Muted> : null}
        {error ? <Muted>{error}</Muted> : null}
        {catalog.error ? <Muted>{catalog.error}</Muted> : null}
        {addError ? <Muted>{addError}</Muted> : null}
        {!loading && !trip ? <Muted>Set your gate to see what can reach you before you board.</Muted> : null}

        {window && !catalog.loading ? (
          <>
            <HomeCarousel title="Restaurants" onSeeAll={() => router.push(restaurantsHref)}>
              {catalog.restaurants.map((restaurant) => {
                const tooLate = !window.fits(restaurant.fastestPrepMinutes);
                return (
                  <RestaurantTile
                    key={restaurant.id}
                    initials={restaurant.initials}
                    markColor={restaurant.color}
                    name={restaurant.name}
                    cuisine={restaurant.cuisine}
                    status={tooLate ? `Too late for ${window.deliverByClock}` : restaurant.location}
                    statusTone={tooLate ? 'late' : 'ok'}
                    minutes={`${restaurant.fastestPrepMinutes} MIN`}
                    onPress={() => router.push(`/restaurant/${restaurant.id}` as Href)}
                  />
                );
              })}
            </HomeCarousel>

            <HomeCarousel title="Featured items" onSeeAll={() => router.push(featuredHref)}>
              {catalog.featured.map((item) => {
                const tooLate = !window.fits(item.prepMinutes);
                return (
                  <FeaturedTile
                    key={item.id}
                    name={item.name}
                    restaurantName={item.restaurantName}
                    price={formatCents(item.priceCents)}
                    minutes={`${item.prepMinutes} MIN`}
                    imageColor={item.imageColor}
                    tooLate={tooLate}
                    adding={addingId === item.id}
                    onAdd={tooLate ? undefined : () => void addItem(item)}
                  />
                );
              })}
            </HomeCarousel>

            <HomeCarousel title="Specials and bundles" onSeeAll={() => router.push(specialsHref)}>
              {catalog.specials.map((item) => {
                const tooLate = !window.fits(item.prepMinutes);
                return (
                  <SpecialTile
                    key={item.id}
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
                    onAdd={tooLate ? undefined : () => void addItem(item)}
                  />
                );
              })}
            </HomeCarousel>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: 40,
    gap: space.xl,
  },
  top: {
    alignItems: 'flex-start',
    gap: space.md,
    paddingTop: space.sm,
  },
  title: type.title,
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
});
