import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, type } from '@/src/theme';

import { PlusButton } from './PlusButton';

type SpecialTileProps = {
  name: string;
  description: string;
  restaurantName: string;
  price: string;
  compareAt: string | null;
  minutes: string;
  badge: string | null;
  imageColor: string;
  tooLate?: boolean;
  adding?: boolean;
  onAdd?: () => void;
};

export function SpecialTile({
  name,
  description,
  restaurantName,
  price,
  compareAt,
  minutes,
  badge,
  imageColor,
  tooLate = false,
  adding = false,
  onAdd,
}: SpecialTileProps) {
  const disabled = tooLate || adding;

  return (
    <View style={styles.card}>
      <View style={[styles.art, { backgroundColor: imageColor }, tooLate && styles.artLate]}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.restaurant} numberOfLines={1}>
          {restaurantName}
        </Text>
        <View style={styles.footer}>
          <View style={styles.meta}>
            <View style={styles.prices}>
              <Text style={styles.price}>{price}</Text>
              {compareAt ? <Text style={styles.compare}>{compareAt}</Text> : null}
            </View>
            <Text style={[styles.minutes, tooLate && styles.late]}>{tooLate ? 'Too late' : minutes}</Text>
          </View>
          <PlusButton
            label={tooLate ? `${name} is too late to add` : `Add ${name}`}
            disabled={disabled}
            onPress={onAdd}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
  },
  art: {
    width: 84,
    borderRadius: radii.thumb,
    padding: 8,
  },
  artLate: {
    opacity: 0.55,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  badgeText: {
    ...type.badge,
    fontSize: 10,
    lineHeight: 12,
    color: colors.ink,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...type.headline,
    fontSize: 16,
    lineHeight: 20,
  },
  description: {
    ...type.body,
    fontSize: 13,
    lineHeight: 17,
  },
  restaurant: {
    ...type.body,
    fontSize: 13,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: space.xs,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    ...type.label,
    color: colors.accent,
  },
  compare: {
    ...type.body,
    fontSize: 13,
    color: colors.placeholder,
    textDecorationLine: 'line-through',
  },
  minutes: {
    ...type.badge,
    letterSpacing: 0,
    color: colors.ink,
  },
  late: {
    color: colors.danger,
  },
});
