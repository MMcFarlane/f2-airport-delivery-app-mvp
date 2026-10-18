import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/src/theme';

type PlusButtonProps = {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
};

export function PlusButton({ label, disabled = false, onPress }: PlusButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.add, disabled && styles.addDisabled, pressed && !disabled && styles.pressed]}>
      <Text style={[styles.plus, disabled && styles.plusDisabled]}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  add: {
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
  pressed: {
    opacity: 0.85,
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
