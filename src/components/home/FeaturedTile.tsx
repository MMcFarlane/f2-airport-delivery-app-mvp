import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Photo } from '@/src/components/ui/Photo';
import { colors, radii, space, type } from '@/src/theme';

import { PlusButton } from './PlusButton';

type FeaturedTileProps = {
  name: string;
  restaurantName: string;
  price: string;
  minutes: string;
  imageColor: string;
  imageKey?: string | null;
  tooLate?: boolean;
  adding?: boolean;
  fill?: boolean;
  onAdd?: () => void;
  onPress?: () => void;
};

export function FeaturedTile({
  name,
  restaurantName,
  price,
  minutes,
  imageColor,
  imageKey = null,
  tooLate = false,
  adding = false,
  fill = false,
  onAdd,
  onPress,
}: FeaturedTileProps) {
  const disabled = tooLate || adding;

  return (
    <View style={[styles.card, fill && styles.fill]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${name}` : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [pressed && onPress && styles.pressed]}>
        <Photo color={imageColor} imageKey={imageKey} style={[styles.photo, tooLate && styles.photoLate]}>
          <View style={[styles.badge, tooLate && styles.badgeLate]}>
            <Text style={[styles.badgeText, tooLate && styles.badgeTextLate]}>{minutes}</Text>
          </View>
        </Photo>
        <View style={styles.copy}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.restaurant} numberOfLines={1}>
            {restaurantName}
          </Text>
        </View>
      </Pressable>
      <View style={styles.footer}>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{price}</Text>
            {tooLate ? <Text style={styles.late}>Too late</Text> : null}
          </View>
          <PlusButton
            label={tooLate ? `${name} is too late to add` : `Add ${name}`}
            disabled={disabled}
            onPress={onAdd}
          />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 176,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
  },
  photo: {
    height: 112,
    padding: 10,
  },
  photoLate: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
  copy: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: radii.badge,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeLate: {
    backgroundColor: colors.surface,
  },
  badgeText: {
    ...type.badge,
    color: colors.accent,
  },
  badgeTextLate: {
    color: colors.muted,
  },
  name: {
    ...type.headline,
    fontSize: 16,
    lineHeight: 20,
    minHeight: 40,
  },
  restaurant: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: 12,
    paddingBottom: 12,
    marginTop: space.sm,
  },
  priceBlock: {
    flex: 1,
    gap: 2,
  },
  price: type.label,
  late: {
    ...type.badge,
    color: colors.danger,
    letterSpacing: 0,
  },
});
