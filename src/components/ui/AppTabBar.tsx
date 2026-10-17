import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, type } from '@/src/theme';

const hrefs: Record<string, Href> = {
  index: '/',
  browse: '/browse',
  orders: '/orders',
  account: '/account',
};

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  browse: 'search',
  orders: 'receipt',
  account: 'person',
};

type AppTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
};

export function AppTabBar({ state, descriptors }: AppTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key]?.options.title ?? route.name;
        const icon = icons[route.name] ?? 'ellipse';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              router.navigate(hrefs[route.name] ?? '/');
            }}
            style={styles.item}>
            <View style={[styles.indicator, focused && styles.indicatorOn]} />
            <Ionicons name={icon} size={22} color={focused ? colors.ink : colors.tabInactive} />
            <Text style={[styles.label, focused ? styles.labelOn : styles.labelOff]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: 'transparent',
  },
  indicatorOn: {
    backgroundColor: colors.accent,
  },
  label: {
    ...type.badge,
    fontSize: 11,
    letterSpacing: 0,
  },
  labelOn: {
    color: colors.ink,
  },
  labelOff: {
    color: colors.tabInactive,
  },
});
