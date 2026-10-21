import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/ui/Buttons';
import { LaterScreen } from '@/src/components/ui/LaterScreen';
import { createDataSource } from '@/src/data';
import {
  courierDistanceLine,
  courierSourceLine,
  courierTarget,
  distanceMeters,
  googleMapsDirectionsUrl,
  restaurantPoint,
  type Order,
} from '@/src/domain';
import { useAsyncValue } from '@/src/hooks/useAsyncValue';
import { useLivePassengerLocation, type LocationAccess } from '@/src/hooks/usePassengerLocation';
import { colors, radii, space, type } from '@/src/theme';

import { CourierMap } from './CourierMap';

/**
 * Demo courier screen on the passenger's own phone. A real courier device would need a server
 * to receive this location; this build keeps everything on one phone.
 */
export function CourierView({ id }: { id: string }) {
  const loaded = useAsyncValue(async () => {
    if (!id) return null;
    const data = await createDataSource();
    return data.orders.getOrder(id);
  }, null);

  if (loaded.loading) return <LaterScreen title="Courier view" body="Loading the order." />;
  if (loaded.error) return <LaterScreen title="Courier view" body={loaded.error} />;
  if (!loaded.value) return <LaterScreen title="Courier view" body="That order is not on this phone." />;
  return <CourierRoute order={loaded.value} />;
}

function CourierRoute({ order }: { order: Order }) {
  const location = useLivePassengerLocation();
  const target = courierTarget({
    live: location.access === 'granted' ? location.fix : null,
    stored: order.passengerLocation,
    gate: order.gate,
  });
  const from = restaurantPoint(order.restaurantCoordinates, order.restaurantLocation);
  const meters = distanceMeters(from, target.coordinates);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.navigate('/orders');
          }}
          style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Courier view</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Demo</Text>
        </View>
      </View>

      <View style={styles.map}>
        <CourierMap
          restaurant={{
            coordinates: from,
            title: order.restaurantName,
            detail: order.restaurantLocation ?? 'Pickup',
            color: order.restaurantColor,
          }}
          passenger={{
            coordinates: target.coordinates,
            title: order.passengerName,
            detail: `Gate ${order.gate}`,
          }}
          showsUserLocation={location.access === 'granted'}
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.who}>
          <View style={styles.whoCopy}>
            <Text style={styles.name}>{order.passengerName}</Text>
            <Text style={styles.gate}>Gate {order.gate}</Text>
          </View>
          <View style={styles.code}>
            <Text style={styles.codeLabel}>CODE</Text>
            <Text style={styles.codeValue}>{order.code}</Text>
          </View>
        </View>
        <Text style={styles.distance}>{courierDistanceLine(meters)}</Text>
        <Text style={styles.source}>{courierSourceLine(target)}</Text>

        {location.access !== 'granted' && location.access !== 'checking' ? (
          <Pressable accessibilityRole="button" onPress={() => void location.request()} style={styles.enable}>
            <Ionicons name="locate-outline" size={18} color={colors.ink} />
            <Text style={styles.enableLabel}>{enableLabel(location.access)}</Text>
          </Pressable>
        ) : null}

        <PrimaryButton
          label="Open in Google Maps"
          onPress={() => {
            void Linking.openURL(googleMapsDirectionsUrl(from, target.coordinates));
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function enableLabel(access: LocationAccess): string {
  if (access === 'services-off') return 'Turn on location services';
  if (access === 'blocked') return 'Allow location in Settings';
  return 'Turn on location';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
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
    fontSize: 28,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: colors.ink,
    borderRadius: radii.badge,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLabel: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  map: {
    flex: 1,
    paddingHorizontal: space.xl,
  },
  panel: {
    margin: space.xl,
    padding: space.xl,
    gap: space.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  whoCopy: {
    flex: 1,
  },
  name: type.headline,
  gate: type.body,
  code: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    ...type.badge,
    color: colors.placeholder,
  },
  codeValue: {
    ...type.headline,
    fontSize: 22,
    letterSpacing: 4,
  },
  distance: type.label,
  source: {
    ...type.body,
    fontSize: 13,
    marginTop: -space.sm,
  },
  enable: {
    minHeight: 48,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  enableLabel: type.label,
});
