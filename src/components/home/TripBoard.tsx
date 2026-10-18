import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, type } from '@/src/theme';

type TripBoardProps = {
  gate: string;
  boarding: string;
  departs: string;
  deliverBy: string;
  minutesLeft: number;
  onEdit: () => void;
};

export function TripBoard({ gate, boarding, departs, deliverBy, minutesLeft, onEdit }: TripBoardProps) {
  const left = minutesLeft === 1 ? '1 min left' : `${minutesLeft} min left`;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.kicker}>Your trip</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit trip"
          onPress={onEdit}
          style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
          <Ionicons name="pencil" size={14} color={colors.surface} />
          <Text style={styles.editLabel}>Edit</Text>
        </Pressable>
      </View>
      <View style={styles.columns}>
        <Fact label="Gate" value={gate} />
        <Fact label="Boarding" value={boarding} />
        <Fact label="Departs" value={departs} />
      </View>
      <View style={styles.banner}>
        <Ionicons name="time-outline" size={14} color={colors.ink} />
        <Text style={styles.bannerText}>
          Delivered to your gate by {deliverBy} · {left}
        </Text>
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: 22,
    padding: 16,
    gap: 16,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editLabel: {
    ...type.label,
    color: colors.surface,
    fontSize: 14,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fact: {
    flex: 1,
    gap: 4,
  },
  factLabel: {
    ...type.badge,
    color: '#C8C8C2',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  factValue: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.accent,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  bannerText: {
    ...type.label,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
