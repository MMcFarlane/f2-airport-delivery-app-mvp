import { Pressable, StyleSheet, Text } from 'react-native';

import { Muted, Screen, SectionLabel } from '@/src/components/ui/Screen';
import { formatClock } from '@/src/domain';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, type } from '@/src/theme';

export default function AccountScreen() {
  const { trip, loading, error, openSheet } = useTripSession();
  const departure = trip ? formatClock(new Date(trip.departureAt)) : null;

  return (
    <Screen title="Account">
      {loading ? <Muted>Loading your trip.</Muted> : null}
      {error ? <Muted>{error}</Muted> : null}
      {!loading && trip && departure ? (
        <>
          <SectionLabel>Current trip</SectionLabel>
          <Text style={styles.trip}>
            {trip.passengerName} · Gate {trip.gate} · Dep {departure}
          </Text>
          <Pressable accessibilityRole="button" onPress={openSheet}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </>
      ) : null}
      {!loading && !trip ? <Muted>Set a gate and departure before you order.</Muted> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  trip: type.headline,
  change: {
    ...type.label,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
