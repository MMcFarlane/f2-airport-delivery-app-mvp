import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Photo } from '@/src/components/ui/Photo';
import { colors, radii, type } from '@/src/theme';
import { markInk } from '@/src/theme/contrast';

type HomeFeaturedCardProps = {
  name: string;
  restaurantName: string;
  price: string;
  minutes: string;
  imageColor: string;
  imageKey?: string | null;
  tooLate?: boolean;
  adding?: boolean;
  onPress?: () => void;
  onAdd?: () => void;
};

export function HomeFeaturedCard({
  name,
  restaurantName,
  price,
  minutes,
  imageColor,
  imageKey = null,
  tooLate = false,
  adding = false,
  onPress,
  onAdd,
}: HomeFeaturedCardProps) {
  const disabled = tooLate || adding;
  const caption = markInk(imageColor);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `Open ${name}` : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [pressed && onPress && styles.pressed]}>
        <Photo
          color={imageColor}
          imageKey={imageKey}
          style={[styles.photo, tooLate && styles.photoLate]}
          fallback={
            <View style={styles.caption}>
              <Ionicons name="image-outline" size={14} color={caption} />
              <Text style={[styles.captionText, { color: caption }]}>Photo</Text>
            </View>
          }>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={12} color={colors.accent} />
            <Text style={styles.badgeText}>{minutes}</Text>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tooLate ? `${name} is too late to add` : `Add ${name}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onAdd}
          style={({ pressed }) => [styles.add, disabled && styles.addDisabled, pressed && !disabled && styles.pressed]}>
          <Text style={[styles.plus, disabled && styles.plusDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 210,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  photo: {
    height: 118,
    padding: 10,
    justifyContent: 'space-between',
  },
  photoLate: {
    opacity: 0.55,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.ink,
    borderRadius: radii.badge,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: {
    ...type.badge,
    color: colors.accent,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  captionText: {
    ...type.body,
    fontSize: 13,
    opacity: 0.8,
  },
  copy: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 2,
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
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
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
  add: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDisabled: {
    backgroundColor: colors.border,
  },
  plus: {
    color: colors.surface,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '500',
    marginTop: -1,
  },
  plusDisabled: {
    color: colors.placeholder,
  },
  pressed: {
    opacity: 0.85,
  },
});
