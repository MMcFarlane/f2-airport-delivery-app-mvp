import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, space, type } from '@/src/theme';

type MenuCardProps = {
  name: string;
  description: string;
  price: string;
  minutes: string;
  imageColor: string;
  tooLate?: boolean;
  onAdd?: () => void;
};

export function MenuCard({
  name,
  description,
  price,
  minutes,
  imageColor,
  tooLate = false,
  onAdd,
}: MenuCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.minutes, tooLate && styles.late]}>{minutes}</Text>
        </View>
      </View>
      <View style={styles.side}>
        <View style={[styles.photo, { backgroundColor: imageColor }, tooLate && styles.photoLate]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tooLate ? `${name} is too late to add` : `Add ${name}`}
          accessibilityState={{ disabled: tooLate }}
          disabled={tooLate}
          onPress={onAdd}
          style={[styles.add, tooLate && styles.addDisabled]}>
          <Text style={[styles.plus, tooLate && styles.plusDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  name: type.headline,
  description: {
    ...type.body,
    fontSize: 14,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  price: {
    ...type.label,
    fontSize: 15,
  },
  dot: {
    color: colors.placeholder,
  },
  minutes: {
    ...type.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  late: {
    color: colors.danger,
  },
  side: {
    width: 84,
    alignItems: 'flex-end',
  },
  photo: {
    width: 76,
    height: 76,
    borderRadius: radii.thumb,
  },
  photoLate: {
    opacity: 0.55,
  },
  add: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 36,
    height: 36,
    borderRadius: 18,
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
});
