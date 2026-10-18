import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Muted, Screen } from '@/src/components/ui/Screen';
import { colors, type as typeScale } from '@/src/theme';

const links: { href: Href; label: string }[] = [
  { href: '/browse/restaurants' as Href, label: 'Restaurants' },
  { href: '/browse/featured' as Href, label: 'Featured items' },
  { href: '/browse/specials' as Href, label: 'Specials and bundles' },
];

export default function BrowseScreen() {
  return (
    <Screen title="Browse">
      <Muted>Search and filters land in a later phase. These lists are the ones Home opens.</Muted>
      {links.map((link) => (
        <Pressable key={link.label} accessibilityRole="button" onPress={() => router.push(link.href)}>
          <Text style={styles.link}>{link.label}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: {
    ...typeScale.label,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
