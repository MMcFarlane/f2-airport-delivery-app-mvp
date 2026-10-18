import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MenuCard } from '@/src/components/ui/MenuCard';
import { Muted, Screen, SectionLabel } from '@/src/components/ui/Screen';
import { createDataSource } from '@/src/data';
import { demoOrderingNow, formatCents, formatClock, itemFits, timeWindow, type MenuItem, type Trip } from '@/src/domain';
import { useAsyncValue } from '@/src/hooks/useAsyncValue';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, type } from '@/src/theme';

export default function HomeScreen() {
  const { trip, loading, error, openSheet } = useTripSession();

  return (
    <Screen title="What you can get">
      {loading ? <Muted>Loading your trip.</Muted> : null}
      {error ? <Muted>{error}</Muted> : null}
      {!loading && trip ? <WindowProof trip={trip} onChange={openSheet} /> : null}
      {!loading && !trip ? <Muted>Set your gate to see what can reach you before you board.</Muted> : null}
    </Screen>
  );
}

function WindowProof({ trip, onChange }: { trip: Trip; onChange: () => void }) {
  const departureAt = new Date(trip.departureAt);
  const now = demoOrderingNow(departureAt);
  const { deliverBy } = timeWindow(departureAt);
  const deliverByClock = formatClock(deliverBy);
  const { value: menu, loading, error } = useAsyncValue(async () => {
    const data = await createDataSource();
    return data.catalog.listMenu('runway-burger');
  }, [] as MenuItem[]);

  const fitting = menu.filter((item) => itemFits(now, item.prepMinutes, deliverBy)).length;

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={styles.trip}>
          {trip.passengerName} · Gate {trip.gate} · by {deliverByClock}
        </Text>
        <Pressable accessibilityRole="button" onPress={onChange}>
          <Text style={styles.change}>Change</Text>
        </Pressable>
      </View>
      <SectionLabel>
        {loading ? 'Checking the window' : `${fitting} of ${menu.length} items arrive before ${deliverByClock}`}
      </SectionLabel>
      {error ? <Muted>{error}</Muted> : null}
      {menu.map((item) => {
        const tooLate = !itemFits(now, item.prepMinutes, deliverBy);
        return (
          <MenuCard
            key={item.id}
            name={item.name}
            description={item.description}
            price={formatCents(item.priceCents)}
            minutes={tooLate ? `TOO LATE FOR ${deliverByClock}` : `${item.prepMinutes} MIN`}
            imageColor={item.imageColor}
            tooLate={tooLate}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  trip: {
    ...type.label,
    flex: 1,
  },
  change: {
    ...type.label,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
});
