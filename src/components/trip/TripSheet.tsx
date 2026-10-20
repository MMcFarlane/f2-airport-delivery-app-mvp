import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/src/components/ui/Buttons';
import {
  calendarDay,
  departureInstant,
  formatClock,
  parseClock,
  timeWindow,
  todayInAirport,
  type DepartureFlight,
  type GateSource,
  type Trip,
} from '@/src/domain';
import { calendarDayFromIso, findDeparture, shortDepartureList } from '@/src/data/skylink/board';
import type { SaveTripInput } from '@/src/data/repositories';
import { useFlightGate, type GateLookup } from '@/src/hooks/useFlightGate';
import { colors, radii, space, type } from '@/src/theme';

type TripField = 'flight' | 'name' | 'gate' | 'departure';

type TripSheetProps = {
  trip: Trip | null;
  departures: readonly DepartureFlight[];
  defaultName: string;
  onSave: (input: SaveTripInput) => Promise<void>;
};

export function TripSheet({ trip, departures, defaultName, onSave }: TripSheetProps) {
  const [day, setDay] = useState(trip ? calendarDay(new Date(trip.departureAt)) : todayInAirport());
  const [name, setName] = useState(trip?.passengerName ?? defaultName);
  const [gate, setGate] = useState(trip?.gate ?? 'B14');
  const [gateSource, setGateSource] = useState<GateSource>(trip?.gateSource ?? 'manual');
  // Read inside the async gate lookup, so it lives in a ref rather than state.
  const typedGateSinceFlight = useRef(false);
  const { lookup, check } = useFlightGate();
  const [departure, setDeparture] = useState(trip ? formatClock(new Date(trip.departureAt)) : '15:40');
  const [flightNumber, setFlightNumber] = useState(trip?.flightNumber ?? '');
  const [focused, setFocused] = useState<TripField>('gate');
  const [later, setLater] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = findDeparture(departures, flightNumber);
  const listed = shortDepartureList(departures, flightNumber);
  const unknownFlight = flightNumber.trim().length > 0 && selected === null;

  const instant = departureInstant(departure, day);
  const deliverBy = instant ? formatClock(timeWindow(instant).deliverBy) : null;
  const canSave = name.trim().length > 0 && gate.trim().length > 0 && instant !== null && !saving;

  function chooseFlight(flight: DepartureFlight) {
    const flightDay = calendarDayFromIso(flight.departureDate);
    setFlightNumber(flight.flightNumber);
    setDeparture(flight.scheduledTime);
    if (flightDay) setDay(flightDay);
    if (!trip && gate === 'B14') setGate('');
    fillGateFromSkyLink(flight.flightNumber);
  }

  function fillGateFromSkyLink(number: string) {
    typedGateSinceFlight.current = false;
    void check(number).then((found) => {
      if (!found?.gate || typedGateSinceFlight.current) return;
      setGate(found.gate);
      setGateSource('skylink');
    });
  }

  function editGate(value: string) {
    typedGateSinceFlight.current = true;
    setGate(value.toUpperCase());
    setGateSource('manual');
  }

  function editFlightNumber(value: string) {
    const next = value.toUpperCase();
    setFlightNumber(next);
    const match = findDeparture(departures, next);
    if (!match) return;
    const flightDay = calendarDayFromIso(match.departureDate);
    setDeparture(match.scheduledTime);
    if (flightDay) setDay(flightDay);
    if (!trip && gate === 'B14') setGate('');
    if (lookup?.flightNumber !== match.flightNumber) fillGateFromSkyLink(match.flightNumber);
  }

  async function submit() {
    if (!instant || !canSave) return;
    setSaving(true);
    setError(null);
    const match = findDeparture(departures, flightNumber);
    try {
      await onSave({
        passengerName: name.trim(),
        gate: gate.trim().toUpperCase(),
        gateSource,
        departureAt: instant.toISOString(),
        flightNumber: match?.flightNumber ?? null,
        airline: match?.airline ?? null,
        flightStatus: match?.status ?? null,
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

        <Text style={styles.fieldLabel}>Flight number</Text>
        <TextInput
          accessibilityLabel="Flight number"
          value={flightNumber}
          onChangeText={editFlightNumber}
          onFocus={() => setFocused('flight')}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="DL711"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, focused === 'flight' && styles.inputFocused]}
        />
        {listed.length > 0 ? (
          <View style={styles.flightList}>
            {listed.map((flight) => {
              const active =
                selected?.flightNumber === flight.flightNumber && selected.scheduledTime === flight.scheduledTime;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${flight.flightNumber} to ${flight.destination} at ${flight.scheduledTime}`}
                  key={`${flight.flightNumber}-${flight.departureDate}-${flight.scheduledTime}`}
                  onPress={() => chooseFlight(flight)}
                  style={[styles.flightRow, active && styles.flightRowActive]}>
                  <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
                  <Text numberOfLines={1} style={styles.flightMeta}>
                    {flight.destination} · {flight.scheduledTime}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {selected && lookup?.flightNumber === selected.flightNumber ? (
          <Text style={styles.later}>{gateNote(lookup)}</Text>
        ) : null}
        {unknownFlight ? (
          <Text style={styles.error}>That flight isn’t on the ATL departures board. You can still enter a gate and departure.</Text>
        ) : null}

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
              onChangeText={editGate}
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

function gateNote(lookup: GateLookup): string {
  if (lookup.state === 'checking') return 'Checking gate…';
  if (lookup.state === 'none' || !lookup.gate?.gate) return 'Gate not published yet. Enter it if you know it.';
  const terminal = lookup.gate.terminal ? ` · Terminal ${lookup.gate.terminal}` : '';
  return `Gate ${lookup.gate.gate} from SkyLink${terminal}`;
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
  flightList: {
    gap: space.sm,
  },
  flightRow: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  flightRowActive: {
    backgroundColor: colors.surface,
    borderColor: colors.ink,
  },
  flightNumber: {
    ...type.label,
    width: 72,
  },
  flightMeta: {
    ...type.body,
    flex: 1,
    fontSize: 14,
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
