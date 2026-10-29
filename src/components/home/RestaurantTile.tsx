import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Photo } from '@/src/components/ui/Photo';
import { useSeenOnScreen } from '@/src/components/ui/viewport';
import { useRestaurantCover } from '@/src/hooks/useRestaurantCover';
import { colors, type } from '@/src/theme';
import { markInk, markNeedsBorder } from '@/src/theme/contrast';

type RestaurantTileProps = {
  /** Places restaurants show their Google cover once the tile is on screen. */
  placeId?: string | null;
  initials: string;
  markColor: string;
  name: string;
  minutes: string;
  tooLate?: boolean;
  onPress: () => void;
};

export function RestaurantTile({
  placeId = null,
  initials,
  markColor,
  name,
  minutes,
  tooLate = false,
  onPress,
}: RestaurantTileProps) {
  const ink = markInk(markColor);
  const { ref, onLayout, seen } = useSeenOnScreen(placeId !== null);
  const cover = useRestaurantCover(placeId, seen);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <View ref={ref} onLayout={onLayout}>
        <Photo
          color={markColor}
          remote={cover}
          style={[styles.mark, markNeedsBorder(markColor) && !cover && styles.lightMark]}
          fallback={<Text style={[styles.initials, { color: ink }]}>{initials}</Text>}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.minutes, tooLate && styles.late]}>{tooLate ? 'Too late' : minutes}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 92,
    gap: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightMark: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: {
    fontSize: 18,
    fontWeight: '800',
  },
  name: {
    ...type.label,
    fontSize: 13,
    lineHeight: 16,
  },
  minutes: {
    ...type.badge,
    letterSpacing: 0.2,
    color: colors.muted,
  },
  late: {
    color: colors.danger,
  },
});
