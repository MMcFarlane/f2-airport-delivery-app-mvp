import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormSheet } from '@/src/components/ui/FormSheet';
import { Muted } from '@/src/components/ui/Screen';
import { createDataSource } from '@/src/data';
import {
  activeOrder,
  arrivesAtLabel,
  canAdvanceStatus,
  cartArrival,
  deliveredOrders,
  demoOrderingNow,
  formatCents,
  formatClock,
  inProgressLabel,
  pastOrderMeta,
  planReorder,
  PROGRESS_SEGMENTS,
  progressFilled,
  reorderFootnote,
  reorderMessage,
  type Order,
} from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';
import { useCart } from '@/src/hooks/useCart';
import { useOrders } from '@/src/hooks/useOrders';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, space, type } from '@/src/theme';
import { markInk, markNeedsBorder } from '@/src/theme/contrast';

export function OrdersBoard() {
  const { orders, loading, error, reload, advanceStatus } = useOrders();
  const { trip } = useTripSession();
  const window = useOrderingWindow(trip);
  const { addLine } = useCart();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload().catch(() => undefined);
    }, [reload]),
  );

  const list = orders ?? [];
  const current = activeOrder(list);
  const past = deliveredOrders(list);

  async function advance(order: Order) {
    if (busy || !canAdvanceStatus(order.status)) return;
    setBusy(true);
    setNotice(null);
    try {
      await advanceStatus(order.id);
    } catch (caught) {
      setNotice(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function reorder(order: Order) {
    if (busy) return;
    if (!window) {
      setNotice('Set your gate and departure before reordering.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const data = await createDataSource();
      const available = new Set<string>();
      for (const line of order.lines) {
        if (!line.itemId) continue;
        const item = await data.catalog.getItem(line.itemId);
        if (item) available.add(item.id);
      }
      const plan = planReorder(order.lines, available, window.fits);
      for (const line of plan) {
        if (line.outcome !== 'add' || !line.itemId) continue;
        await addLine({ itemId: line.itemId, quantity: line.quantity });
      }
      const message = reorderMessage(plan);
      if (message) setNotice(message);
      if (!message && plan.some((line) => line.outcome === 'add')) {
        router.navigate('/cart' as Href);
      }
    } catch (caught) {
      setNotice(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Orders</Text>
        {loading && list.length === 0 ? <Muted>Loading your orders.</Muted> : null}
        {error ? <Muted>{error}</Muted> : null}

        {current ? (
          <ActiveCard
            order={current}
            clock={arrivalClock(current, trip?.departureAt)}
            busy={busy}
            onAdvance={() => void advance(current)}
          />
        ) : null}

        <Text style={styles.section}>Past orders</Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {past.map((order) => (
          <PastCard
            key={order.id}
            order={order}
            busy={busy}
            onReceipt={() => setReceipt(order)}
            onReorder={() => void reorder(order)}
          />
        ))}
        <Text style={styles.footnote}>{reorderFootnote}</Text>
      </ScrollView>

      {receipt ? <ReceiptSheet order={receipt} onClose={() => setReceipt(null)} /> : null}
    </SafeAreaView>
  );
}

function arrivalClock(order: Order, departureAt: string | undefined): string {
  const now = departureAt ? demoOrderingNow(new Date(departureAt)) : new Date(order.placedAt);
  return formatClock(
    cartArrival(
      now,
      order.lines.map((line) => line.prepMinutes),
    ),
  );
}

function ActiveCard({
  order,
  clock,
  busy,
  onAdvance,
}: {
  order: Order;
  clock: string;
  busy: boolean;
  onAdvance: () => void;
}) {
  const filled = progressFilled(order.status);
  const canAdvance = canAdvanceStatus(order.status) && !busy;

  return (
    <View style={styles.active}>
      <View style={styles.activeTop}>
        <Text style={styles.kicker}>{inProgressLabel(order.status)}</Text>
        {canAdvanceStatus(order.status) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Advance status"
            disabled={!canAdvance}
            onPress={onAdvance}
            style={styles.advance}>
            <Text style={styles.advanceLabel}>Advance</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.activeBody}>
        <View style={styles.activeCopy}>
          <Text style={styles.activeName}>{order.restaurantName}</Text>
          <Text style={styles.arrives}>{arrivesAtLabel(order.gate, clock)}</Text>
        </View>
        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>CODE</Text>
          <Text style={styles.code}>{order.code.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.bar}>
        {Array.from({ length: PROGRESS_SEGMENTS }, (_, index) => (
          <View key={index} style={[styles.segment, index < filled && styles.segmentOn]} />
        ))}
      </View>
    </View>
  );
}

function PastCard({
  order,
  busy,
  onReceipt,
  onReorder,
}: {
  order: Order;
  busy: boolean;
  onReceipt: () => void;
  onReorder: () => void;
}) {
  const color = order.restaurantColor;
  const when = pastOrderMeta({ at: order.deliveredAt ?? order.placedAt, gate: order.gate });

  return (
    <View style={styles.past}>
      <View style={styles.pastTop}>
        <View style={[styles.mark, { backgroundColor: color }, markNeedsBorder(color) && styles.markBorder]}>
          <Text style={[styles.initials, { color: markInk(color) }]}>{order.restaurantInitials}</Text>
        </View>
        <View style={styles.pastCopy}>
          <Text style={styles.pastName}>{order.restaurantName}</Text>
          <Text style={styles.summary} numberOfLines={1}>
            {order.summary}
          </Text>
        </View>
        <Text style={styles.total}>{formatCents(order.totalCents)}</Text>
      </View>
      <Text style={styles.when}>{when}</Text>
      <View style={styles.pastActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Receipt for ${order.restaurantName}`}
          onPress={onReceipt}
          style={styles.receipt}>
          <Text style={styles.receiptLabel}>Receipt</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reorder from ${order.restaurantName}`}
          disabled={busy}
          onPress={onReorder}
          style={[styles.reorder, busy && styles.reorderBusy]}>
          <Text style={styles.reorderLabel}>Reorder</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReceiptSheet({ order, onClose }: { order: Order; onClose: () => void }) {
  const when = pastOrderMeta({ at: order.deliveredAt ?? order.placedAt, gate: order.gate });

  return (
    <FormSheet title="Receipt" onClose={onClose}>
      <Text style={styles.receiptRestaurant}>{order.restaurantName}</Text>
      <Text style={styles.receiptMeta}>{when}</Text>
      <Text style={styles.receiptMeta}>{`Code ${order.code.toUpperCase()}`}</Text>
      {order.lines.map((line, index) => (
        <View key={`${line.name}-${index}`} style={styles.receiptLine}>
          <Text style={styles.receiptItem}>
            {line.quantity > 1 ? `${line.quantity} × ${line.name}` : line.name}
          </Text>
          <Text style={styles.receiptPrice}>{formatCents(line.priceCents * line.quantity)}</Text>
        </View>
      ))}
      <View style={styles.receiptLine}>
        <Text style={styles.receiptTotal}>Total</Text>
        <Text style={styles.receiptTotal}>{formatCents(order.totalCents)}</Text>
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: 40,
    gap: space.md,
  },
  title: {
    ...type.title,
    paddingTop: space.sm,
  },
  section: {
    ...type.headline,
    fontSize: 22,
    lineHeight: 28,
    marginTop: space.sm,
  },
  notice: {
    ...type.body,
    color: colors.danger,
  },
  footnote: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.placeholder,
    marginTop: space.xs,
  },
  active: {
    backgroundColor: colors.ink,
    borderRadius: 22,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.md,
  },
  activeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  kicker: {
    ...type.badge,
    color: colors.accent,
    letterSpacing: 0.6,
    flex: 1,
  },
  advance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  advanceLabel: {
    ...type.badge,
    color: colors.accent,
    letterSpacing: 0.4,
  },
  activeBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  activeCopy: {
    flex: 1,
    gap: 2,
  },
  activeName: {
    ...type.headline,
    color: colors.surface,
    fontSize: 20,
  },
  arrives: {
    ...type.body,
    color: '#C8C8C2',
    fontSize: 14,
  },
  codeBlock: {
    alignItems: 'flex-end',
  },
  codeLabel: {
    ...type.badge,
    color: '#9A9A94',
    letterSpacing: 0.8,
    fontSize: 11,
  },
  code: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1,
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#3A3A3A',
  },
  segmentOn: {
    backgroundColor: colors.accent,
  },
  past: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: space.md,
    gap: space.md,
  },
  pastTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  initials: {
    fontSize: 14,
    fontWeight: '800',
  },
  pastCopy: {
    flex: 1,
    gap: 2,
  },
  pastName: type.label,
  summary: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
  },
  total: type.label,
  pastActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.sm,
  },
  when: {
    ...type.badge,
    color: colors.placeholder,
    letterSpacing: 0.3,
    fontSize: 11,
  },
  receipt: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  receiptLabel: {
    ...type.label,
    fontSize: 14,
  },
  reorder: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBusy: {
    opacity: 0.45,
  },
  reorderLabel: {
    ...type.label,
    fontSize: 14,
    color: colors.accent,
  },
  receiptRestaurant: type.headline,
  receiptMeta: {
    ...type.body,
    marginTop: -6,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
  },
  receiptItem: {
    ...type.body,
    flex: 1,
    color: colors.ink,
  },
  receiptPrice: {
    ...type.body,
    color: colors.ink,
  },
  receiptTotal: type.label,
});
