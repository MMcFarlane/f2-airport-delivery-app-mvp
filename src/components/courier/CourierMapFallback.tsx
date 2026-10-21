import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, type } from '@/src/theme';

import type { CourierMapProps } from './map-types';

/** Shown on web, and on Android builds without GOOGLE_MAPS_API_KEY, where no map can render. */
export function CourierMapFallback({ restaurant, passenger, reason }: CourierMapProps & { reason: string }) {
  return (
    <View style={styles.card}>
      <Stop icon="restaurant-outline" title={restaurant.title} detail={restaurant.detail} />
      <View style={styles.rail} />
      <Stop icon="person-outline" title={passenger.title} detail={passenger.detail} />
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

function Stop({ icon, title, detail }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string }) {
  return (
    <View style={styles.stop}>
      <View style={styles.dot}>
        <Ionicons name={icon} size={16} color={colors.ink} />
      </View>
      <View style={styles.stopCopy}>
        <Text style={styles.stopTitle}>{title}</Text>
        <Text style={styles.stopDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 260,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: space.xl,
    justifyContent: 'center',
  },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopCopy: {
    flex: 1,
  },
  stopTitle: type.label,
  stopDetail: {
    ...type.body,
    fontSize: 13,
  },
  rail: {
    width: 2,
    height: 32,
    marginLeft: 17,
    marginVertical: space.xs,
    backgroundColor: colors.ink,
  },
  reason: {
    ...type.body,
    fontSize: 12,
    color: colors.placeholder,
    marginTop: space.lg,
  },
});
