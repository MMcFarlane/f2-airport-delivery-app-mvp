import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, type } from '@/src/theme';

type RestaurantTileProps = {
  initials: string;
  markColor: string;
  name: string;
  cuisine: string;
  status: string;
  statusTone?: 'ok' | 'late';
  minutes: string;
  onPress: () => void;
};

export function RestaurantTile({
  initials,
  markColor,
  name,
  cuisine,
  status,
  statusTone = 'ok',
  minutes,
  onPress,
}: RestaurantTileProps) {
  const ink = initialsColor(markColor);
  const lightMark = ink === colors.ink && isNearWhite(markColor);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.mark, { backgroundColor: markColor }, lightMark && styles.lightMark]}>
        <Text style={[styles.initials, { color: ink }]}>{initials}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      <Text style={styles.cuisine} numberOfLines={2}>
        {cuisine}
      </Text>
      <Text style={[styles.status, statusTone === 'late' && styles.late]} numberOfLines={2}>
        {status}
      </Text>
      <View style={[styles.badge, statusTone === 'late' && styles.badgeLate]}>
        <Text style={[styles.badgeText, statusTone === 'late' && styles.badgeTextLate]}>{minutes}</Text>
      </View>
    </Pressable>
  );
}

function initialsColor(hex: string): string {
  return luminance(hex) > 0.62 ? colors.ink : colors.surface;
}

function isNearWhite(hex: string): boolean {
  return luminance(hex) > 0.92;
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return 1;
  const red = Number.parseInt(raw.slice(0, 2), 16);
  const green = Number.parseInt(raw.slice(2, 4), 16);
  const blue = Number.parseInt(raw.slice(4, 6), 16);
  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) return 1;
  return (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  lightMark: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: {
    fontSize: 16,
    fontWeight: '800',
  },
  name: {
    ...type.headline,
    fontSize: 16,
    lineHeight: 20,
    minHeight: 40,
  },
  cuisine: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  status: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  late: {
    fontWeight: '600',
    color: colors.danger,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
    backgroundColor: colors.ink,
    borderRadius: radii.badge,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeLate: {
    backgroundColor: colors.border,
  },
  badgeText: {
    ...type.badge,
    color: colors.accent,
  },
  badgeTextLate: {
    color: colors.muted,
  },
});
