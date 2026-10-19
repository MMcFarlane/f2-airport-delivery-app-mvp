import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeCarousel } from '@/src/components/home/HomeCarousel';
import { HomeFeaturedCard } from '@/src/components/home/HomeFeaturedCard';
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { HomeSpecialCard } from '@/src/components/home/HomeSpecialCard';
import { RestaurantTile } from '@/src/components/home/RestaurantTile';
import { TripBoard } from '@/src/components/home/TripBoard';
import { Muted } from '@/src/components/ui/Screen';
import { cartItemCount, dayPartGreeting, demoOrderingClock, formatCents, type MenuItem } from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';
import { useCart } from '@/src/hooks/useCart';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useProfile } from '@/src/hooks/useProfile';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, space } from '@/src/theme';

const restaurantsHref = '/browse/restaurants' as Href;
const featuredHref = '/browse/featured' as Href;
const specialsHref = '/browse/specials' as Href;

export default function HomeScreen() {
  const { trip, loading, error, openSheet } = useTripSession();
  const { profile } = useProfile();
  const catalog = useCatalog();
  const { cart, addLine, reload: reloadCart } = useCart();
  useFocusEffect(
    useCallback(() => {
      void reloadCart();
    }, [reloadCart]),
  );
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const window = useOrderingWindow(trip);
  const cartCount = cartItemCount(cart?.lines ?? []);
  const name = trip?.passengerName || profile?.name || 'Jordan';

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
        <HomeHeader
          greeting={dayPartGreeting(demoOrderingClock.hour)}
          name={name}
          cartCount={cartCount}
          onAccount={() => router.navigate('/account' as Href)}
          onSearch={() => router.navigate('/browse')}
          onCart={() => router.navigate('/cart' as Href)}
        />

        {window && trip ? (
          <TripBoard
            gate={trip.gate}
            boarding={window.boardingClock}
            departs={window.departureClock}
            deliverBy={window.deliverByClock}
            minutesLeft={window.minutesLeft}
            onEdit={openSheet}
          />
        ) : null}

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
                    minutes={`${restaurant.fastestPrepMinutes} MIN`}
                    tooLate={tooLate}
                    onPress={() => router.push(`/restaurant/${restaurant.id}` as Href)}
                  />
                );
              })}
            </HomeCarousel>

            <HomeCarousel title="Featured items" onSeeAll={() => router.push(featuredHref)}>
              {catalog.featured.map((item) => {
                const tooLate = !window.fits(item.prepMinutes);
                return (
                  <HomeFeaturedCard
                    key={item.id}
                    name={item.name}
                    restaurantName={item.restaurantName}
                    price={formatCents(item.priceCents)}
                    minutes={`${item.prepMinutes} MIN`}
                    imageColor={item.imageColor}
                    tooLate={tooLate}
                    adding={addingId === item.id}
                    onPress={() => router.push(`/item/${item.id}` as Href)}
                    onAdd={tooLate ? undefined : () => void addItem(item)}
                  />
                );
              })}
            </HomeCarousel>

            <HomeCarousel title="Specials & bundles" onSeeAll={() => router.push(specialsHref)}>
              {catalog.specials.map((item) => {
                const tooLate = !window.fits(item.prepMinutes);
                return (
                  <HomeSpecialCard
                    key={item.id}
                    name={item.name}
                    description={item.description}
                    price={formatCents(item.priceCents)}
                    minutes={`${item.prepMinutes} MIN`}
                    badge={item.badge}
                    imageColor={item.imageColor}
                    tooLate={tooLate}
                    onPress={() => router.push(`/item/${item.id}` as Href)}
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
});
