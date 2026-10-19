import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, space, type } from '@/src/theme';

type FormSheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function FormSheet({ title, onClose, children }: FormSheetProps) {
  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(17, 17, 17, 0.46)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.xl,
    gap: space.md,
    maxHeight: '88%',
  },
  title: {
    ...type.title,
    fontSize: 28,
    lineHeight: 32,
  },
});
