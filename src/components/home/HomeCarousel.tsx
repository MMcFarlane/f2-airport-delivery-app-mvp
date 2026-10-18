import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme';

type HomeCarouselProps = {
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
};

export function HomeCarousel({ title, onSeeAll, children }: HomeCarouselProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`See all ${title}`} onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  title: type.headline,
  seeAll: {
    ...type.label,
    color: colors.ink,
  },
  row: {
    gap: space.md,
    paddingRight: space.xs,
  },
});
