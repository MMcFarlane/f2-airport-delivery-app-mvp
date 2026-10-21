import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LaterScreen } from '@/src/components/ui/LaterScreen';
import { createDataSource } from '@/src/data';
import {
  cartArrival,
  codeCharacters,
  confirmationTimeline,
  cookingLine,
  courierCodeCopy,
  demoOrderingNow,
  formatCents,
  orderItemSummary,
  placedTitle,
} from '@/src/domain';
import { useAsyncValue } from '@/src/hooks/useAsyncValue';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, space, type } from '@/src/theme';

export function OrderConfirmed({ id }: { id: string }) {
  const { trip } = useTripSession();
  const loaded = useAsyncValue(async () => {
    if (!id) return null;
    const data = await createDataSource();
    return data.orders.getOrder(id);
  }, null);

  if (loaded.loading) return <LaterScreen title="Order" body="Loading your order." />;
  if (loaded.error) return <LaterScreen title="Order" body={loaded.error} />;
  if (!loaded.value) return <LaterScreen title="Order" body="That order is not on this phone." />;

  const order = loaded.value;
  const now = trip ? demoOrderingNow(new Date(trip.departureAt)) : new Date(order.placedAt);
  const steps = confirmationTimeline({
    now,
    arrivalAt: cartArrival(
      now,
      order.lines.map((line) => line.prepMinutes),
    ),
    gate: order.gate,
    status: order.status,
  });
  const summary = order.summary || orderItemSummary(order.lines.map((line) => line.name));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={28} color={colors.ink} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}>
            <Ionicons name="close" size={26} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.title}>{placedTitle(order.passengerName)}</Text>
        <Text style={styles.cooking}>{cookingLine(order.restaurantName, order.gate)}</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Confirmation code</Text>
          <View style={styles.cells}>
            {codeCharacters(order.code).map((character, index) => (
              <View key={`${character}-${index}`} style={styles.cell}>
                <Text style={styles.cellText}>{character}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.codeCopy}>{courierCodeCopy}</Text>
        </View>

        <View style={styles.timeline}>
          <View style={styles.track} />
          {steps.map((step) => (
            <View key={step.label} style={styles.step}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    step.state === 'done' && styles.dotDone,
                    step.state === 'current' && styles.dotNow,
                    step.state === 'upcoming' && styles.dotLater,
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step.state === 'current' && styles.stepCurrent,
                  step.state === 'upcoming' && styles.stepUpcoming,
                ]}>
                {step.label}
              </Text>
              <Text style={[styles.stepDetail, step.state === 'upcoming' && styles.stepUpcoming]}>{step.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryItems}>{summary}</Text>
          <Text style={styles.summaryTotal}>{formatCents(order.totalCents)}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Track order"
          onPress={() => router.dismissTo('/orders' as Href)}
          style={({ pressed }) => [styles.trackButton, pressed && styles.pressed]}>
          <Text style={styles.trackLabel}>Track order</Text>
        </Pressable>
        {order.status !== 'delivered' ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open courier view"
            onPress={() => router.push(`/courier/${order.id}` as Href)}
            style={styles.courierLink}>
            <Text style={styles.courierLabel}>Open courier view</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          onPress={() => router.dismissTo('/' as Href)}
          style={({ pressed }) => [styles.home, pressed && styles.pressed]}>
          <Text style={styles.homeLabel}>Back to home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function close() {
  if (router.canGoBack()) router.back();
  else router.dismissTo('/' as Href);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
    gap: space.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: space.sm,
  },
  check: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.title,
    fontSize: 30,
    lineHeight: 36,
  },
  cooking: {
    ...type.body,
    marginTop: -6,
  },
  codeCard: {
    backgroundColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.md,
    marginTop: space.sm,
  },
  codeLabel: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cells: {
    flexDirection: 'row',
    gap: 10,
  },
  cell: {
    flex: 1,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: colors.accent,
  },
  codeCopy: {
    ...type.body,
    color: '#D5D5D0',
    fontSize: 14,
    lineHeight: 20,
  },
  timeline: {
    gap: 0,
    marginTop: space.sm,
  },
  track: {
    position: 'absolute',
    left: 7,
    top: 18,
    bottom: 18,
    width: 2,
    backgroundColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    gap: space.md,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  dotDone: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dotNow: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  dotLater: {
    backgroundColor: colors.background,
    borderColor: '#C8C8C2',
  },
  stepLabel: {
    ...type.body,
    flex: 1,
    color: colors.ink,
  },
  stepCurrent: {
    fontWeight: '800',
  },
  stepUpcoming: {
    color: colors.placeholder,
  },
  stepDetail: {
    ...type.body,
    color: colors.muted,
    fontSize: 14,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginTop: space.lg,
  },
  summaryItems: {
    ...type.body,
    flex: 1,
    color: colors.ink,
  },
  summaryTotal: type.label,
  actions: {
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
    gap: space.sm,
  },
  trackButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackLabel: {
    ...type.button,
    color: colors.accent,
  },
  courierLink: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courierLabel: {
    ...type.label,
    textDecorationLine: 'underline',
  },
  home: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLabel: type.label,
  pressed: {
    opacity: 0.88,
  },
});
