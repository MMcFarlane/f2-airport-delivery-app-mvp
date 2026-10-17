import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, type } from '@/src/theme';

type RestaurantCardProps = {
  initials: string;
  markColor: string;
  name: string;
  detail: string;
  status: string;
  statusTone?: 'ok' | 'late';
  minutes: string;
};

export function RestaurantCard({
  initials,
  markColor,
  name,
  detail,
  status,
  statusTone = 'ok',
  minutes,
}: RestaurantCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.mark, { backgroundColor: markColor }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>{detail}</Text>
        <Text style={[styles.status, statusTone === 'late' && styles.late]}>{status}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{minutes}</Text>
      </View>
    </View>
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
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
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
  badgeText: {
    ...type.badge,
    color: colors.accent,
  },
});
