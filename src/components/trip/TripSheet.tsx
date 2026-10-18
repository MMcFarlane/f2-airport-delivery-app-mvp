import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/src/components/ui/Buttons';
import {
  calendarDay,
  departureInstant,
  formatClock,
  parseClock,
  timeWindow,
  todayInAirport,
  type Trip,
} from '@/src/domain';
import type { SaveTripInput } from '@/src/data/repositories';
import { colors, radii, space, type } from '@/src/theme';

type TripSheetProps = {
  trip: Trip | null;
  defaultName: string;
  onSave: (input: SaveTripInput) => Promise<void>;
};

export function TripSheet({ trip, defaultName, onSave }: TripSheetProps) {
  const day = trip ? calendarDay(new Date(trip.departureAt)) : todayInAirport();
  const [name, setName] = useState(trip?.passengerName ?? defaultName);
  const [gate, setGate] = useState(trip?.gate ?? 'B14');
  const [departure, setDeparture] = useState(trip ? formatClock(new Date(trip.departureAt)) : '15:40');
  const [focused, setFocused] = useState<'name' | 'gate' | 'departure'>('gate');
  const [later, setLater] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instant = departureInstant(departure, day);
  const deliverBy = instant ? formatClock(timeWindow(instant).deliverBy) : null;
  const canSave = name.trim().length > 0 && gate.trim().length > 0 && instant !== null && !saving;

  async function submit() {
    if (!instant || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        passengerName: name.trim(),
        gate: gate.trim().toUpperCase(),
        departureAt: instant.toISOString(),
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this trip');
      setSaving(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.scrim} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetContent}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowLabel}>Before you order</Text>
        </View>
        <Text style={styles.title}>Let’s get food to your gate</Text>
        <Text style={styles.copy}>We’ll only show items that can be cooked and delivered before you board.</Text>

        <Pressable accessibilityRole="button" onPress={() => setLater(true)} style={styles.scan}>
          <Ionicons name="scan-outline" size={18} color={colors.ink} />
          <Text style={styles.scanLabel}>Scan boarding pass</Text>
        </Pressable>
        {later ? <Text style={styles.later}>Boarding pass scan comes later.</Text> : null}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerLabel}>or enter it yourself</Text>
          <View style={styles.divider} />
        </View>

        <Text style={styles.fieldLabel}>Your name</Text>
        <TextInput
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          onFocus={() => setFocused('name')}
          autoComplete="name"
          style={[styles.input, focused === 'name' && styles.inputFocused]}
        />

        <View style={styles.pair}>
          <View style={styles.pairField}>
            <Text style={styles.fieldLabel}>Gate</Text>
            <TextInput
              accessibilityLabel="Gate"
              value={gate}
              onChangeText={(value) => setGate(value.toUpperCase())}
              onFocus={() => setFocused('gate')}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              style={[styles.input, focused === 'gate' && styles.inputFocused]}
            />
          </View>
          <View style={styles.pairField}>
            <Text style={styles.fieldLabel}>Departure time</Text>
            <TextInput
              accessibilityLabel="Departure time"
              value={departure}
              onChangeText={setDeparture}
              onFocus={() => setFocused('departure')}
              autoCorrect={false}
              placeholder="15:40"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, focused === 'departure' && styles.inputFocused]}
            />
          </View>
        </View>

        <View style={styles.note}>
          <Ionicons name="time-outline" size={16} color={colors.ink} />
          {deliverBy ? (
            <Text style={styles.noteCopy}>
              Boarding usually starts 30 min before departure, so we’ll aim to deliver by{' '}
              <Text style={styles.noteStrong}>{deliverBy}</Text>.
            </Text>
          ) : (
            <Text style={styles.noteCopy}>Enter a departure time like 15:40.</Text>
          )}
        </View>
        {parseClock(departure) === null && departure.trim().length > 0 ? (
          <Text style={styles.error}>Use a 24-hour time, like 15:40.</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label={saving ? 'Saving…' : 'Show me what I can get  →'}
          disabled={!canSave}
          onPress={() => {
            void submit();
          }}
        />
        </ScrollView>
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
    zIndex: 20,
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
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: space.sm,
  },
  sheetContent: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    gap: space.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space.xs,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: radii.badge,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyebrowLabel: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  title: type.title,
  copy: type.body,
  scan: {
    minHeight: 52,
    borderRadius: radii.control,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
  },
  scanLabel: {
    ...type.label,
  },
  later: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: -4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    ...type.body,
    fontSize: 13,
    color: colors.placeholder,
  },
  fieldLabel: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: -6,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
    ...type.label,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.ink,
  },
  pair: {
    flexDirection: 'row',
    gap: space.md,
  },
  pairField: {
    flex: 1,
    gap: space.md,
  },
  note: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.note,
    borderRadius: 16,
    padding: space.md,
  },
  noteCopy: {
    ...type.body,
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  noteStrong: {
    fontWeight: '800',
  },
  error: {
    ...type.body,
    color: colors.danger,
    fontSize: 13,
    marginTop: -4,
  },
});
