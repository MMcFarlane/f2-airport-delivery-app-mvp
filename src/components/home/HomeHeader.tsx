import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/src/theme';

type HomeHeaderProps = {
  greeting: string;
  name: string;
  cartCount: number;
  onAccount: () => void;
  onSearch: () => void;
  onCart: () => void;
};

export function HomeHeader({ greeting, name, cartCount, onAccount, onSearch, onCart }: HomeHeaderProps) {
  const cartLabel = cartCount === 1 ? 'Cart, 1 item' : `Cart, ${cartCount} items`;

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Account" onPress={onAccount}>
          <Text style={styles.name}>{name}</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search"
        onPress={onSearch}
        style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
        <Ionicons name="search" size={20} color={colors.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={cartLabel}
        onPress={onCart}
        style={({ pressed }) => [styles.cart, pressed && styles.pressed]}>
        <Ionicons name="bag-handle" size={20} color={colors.surface} />
        {cartCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  copy: {
    flex: 1,
    gap: 0,
  },
  greeting: {
    ...type.body,
    fontSize: 16,
  },
  name: type.title,
  search: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cart: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  pressed: {
    opacity: 0.85,
  },
});
