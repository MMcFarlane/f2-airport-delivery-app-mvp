import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Photo } from '@/src/components/ui/Photo';
import { colors, radii, space, type } from '@/src/theme';

type HomeSpecialCardProps = {
  name: string;
  description: string;
  price: string;
  minutes: string;
  badge: string | null;
  imageColor: string;
  imageKey?: string | null;
  tooLate?: boolean;
  onPress?: () => void;
};

export function HomeSpecialCard({
  name,
  description,
  price,
  minutes,
  badge,
  imageColor,
  imageKey = null,
  tooLate = false,
  onPress,
}: HomeSpecialCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Open ${name}` : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress && styles.pressed]}>
      <Photo color={imageColor} imageKey={imageKey} style={[styles.art, tooLate && styles.artLate]}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </Photo>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.price}>{price}</Text>
      </View>
      <Text style={[styles.minutes, tooLate && styles.late]}>{tooLate ? 'Too late' : minutes}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  art: {
    width: 84,
    alignSelf: 'stretch',
    minHeight: 84,
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
  price: {
    ...type.label,
    color: colors.accent,
    marginTop: 2,
  },
  minutes: {
    ...type.badge,
    letterSpacing: 0.2,
    color: colors.ink,
  },
  late: {
    color: colors.danger,
    maxWidth: 56,
    textAlign: 'right',
  },
});
