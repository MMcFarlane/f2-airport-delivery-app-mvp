import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, type } from '@/src/theme';
import { markInk, markNeedsBorder } from '@/src/theme/contrast';

type RestaurantCardProps = {
  initials: string;
  markColor: string;
  name: string;
  detail: string;
  status: string;
  statusTone?: 'ok' | 'partial' | 'late';
  minutes: string;
  onPress?: () => void;
};

export function RestaurantCard({
  initials,
  markColor,
  name,
  detail,
  status,
  statusTone = 'ok',
  minutes,
  onPress,
}: RestaurantCardProps) {
  const quietBadge = statusTone !== 'ok';
  const lateCopy = statusTone !== 'ok';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Open ${name}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}>
      <View style={[styles.mark, { backgroundColor: markColor }, markNeedsBorder(markColor) && styles.lightMark]}>
        <Text style={[styles.initials, { color: markInk(markColor) }]}>{initials}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {detail}
        </Text>
        <Text style={[styles.status, lateCopy && styles.late]}>{status}</Text>
      </View>
      <View style={[styles.badge, quietBadge && styles.badgeQuiet]}>
        <Text style={[styles.badgeText, quietBadge && styles.badgeTextQuiet]}>{minutes}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightMark: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: {
    fontSize: 16,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: type.headline,
  detail: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.success,
  },
  late: {
    color: colors.danger,
  },
  badge: {
    backgroundColor: colors.ink,
    borderRadius: radii.badge,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeQuiet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...type.badge,
    color: colors.accent,
  },
  badgeTextQuiet: {
    color: colors.muted,
  },
});
