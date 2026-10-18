import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/src/theme';

type CartBarProps = {
  count: number;
  arrival: string | null;
  total: string;
  onPress: () => void;
};

export function CartBar({ count, arrival, total, onPress }: CartBarProps) {
  const items = count === 1 ? '1 item' : `${count} items`;
  const label = arrival ? `View cart, ${items}, ${arrival}, ${total}` : `View cart, ${items}, ${total}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}>
      <View style={styles.count}>
        <Text style={styles.countText}>{count}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.view}>View cart</Text>
        {arrival ? <Text style={styles.arrival}>{arrival}</Text> : null}
      </View>
      <Text style={styles.total}>{total}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 64,
    borderRadius: 22,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
    paddingRight: 18,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.9,
  },
  count: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  view: {
    ...type.label,
    color: colors.surface,
    fontSize: 16,
  },
  arrival: {
    ...type.body,
    fontSize: 13,
    lineHeight: 17,
    color: '#C8C8C2',
  },
  total: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.accent,
  },
});
