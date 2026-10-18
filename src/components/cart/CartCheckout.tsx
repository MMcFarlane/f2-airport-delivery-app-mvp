import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/ui/Buttons';
import { LaterScreen } from '@/src/components/ui/LaterScreen';
import { Muted } from '@/src/components/ui/Screen';
import { createDataSource } from '@/src/data';
import {
  appliedCodeCopy,
  arrivalBoardLine,
  cartArrival,
  cartItemCount,
  cartPriceLines,
  deliverToLabel,
  discountRowLabel,
  formatCents,
  formatClock,
  groupCartByRestaurant,
  isTipPreset,
  itemCountLabel,
  orderItemSummary,
  parseTipCents,
  priceCart,
  spareCopy,
  spareMinutes,
  timeWindow,
  TIP_PRESETS_CENTS,
  tipChipLabel,
  tooLateLabel,
  type CartLine,
  type PriceQuote,
} from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';
import { useCart } from '@/src/hooks/useCart';
import { useOrders } from '@/src/hooks/useOrders';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useProfile } from '@/src/hooks/useProfile';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, space, type } from '@/src/theme';

export function CartCheckout() {
  const { trip, openSheet } = useTripSession();
  const window = useOrderingWindow(trip);
  const { cart, loading, error, reload, setQuantity, setLineDiscount, setTip, clear } = useCart();
  const { profile, updateProfile, reload: reloadProfile } = useProfile();
  const { createOrder } = useOrders();
  const lines = cart?.lines ?? [];
  const tipCents = cart?.tipCents ?? 0;
  const discounts = useDiscountPercents(lines);
  const percents = discounts.percents;
  const [tipOpen, setTipOpen] = useState(false);
  const [tipDraft, setTipDraft] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [pendingLine, setPendingLine] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void reload();
      void reloadProfile();
    }, [reload, reloadProfile]),
  );

  if (loading && !cart) return <LaterScreen title="Your cart" body="Loading your cart." />;
  if (error && !cart) return <LaterScreen title="Your cart" body={error} />;

  const count = cartItemCount(lines);
  const pricingPending = lines.some((line) => line.discountCode && percents[line.discountCode.toUpperCase()] === undefined);
  const quote = pricingPending ? null : priceCart(cartPriceLines(lines, percents), tipCents);
  const groups = groupCartByRestaurant(lines);
  const codes = lines.flatMap((line) => (line.discountCode ? [line.discountCode] : []));
  const tooLate = Boolean(window && lines.some((line) => !window.fits(line.prepMinutes)));
  const canPay = Boolean(trip && quote && lines.length > 0 && !tooLate && !pricingPending && !paying && !discounts.error);
  const otherSelected = !isTipPreset(tipCents);
  const customDraft = tipDraft ?? (otherSelected ? formatTipDraft(tipCents) : '');
  const arrival = trip && window && lines.length > 0 ? deliveryArrival(trip.departureAt, window.now, lines) : null;

  async function changeQuantity(itemId: string, quantity: number) {
    if (pendingLine || paying) return;
    setPendingLine(itemId);
    setActionError(null);
    try {
      await setQuantity(itemId, quantity);
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setPendingLine(null);
    }
  }

  async function removeCode(itemId: string) {
    if (pendingLine || paying) return;
    setPendingLine(itemId);
    setActionError(null);
    try {
      await setLineDiscount(itemId, null);
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setPendingLine(null);
    }
  }

  async function changeTip(cents: number) {
    setActionError(null);
    try {
      await setTip(cents);
    } catch (caught) {
      setActionError(errorMessage(caught));
    }
  }

  async function pay() {
    if (!canPay || !trip || !quote || lines.length === 0) return;
    setPaying(true);
    setActionError(null);
    try {
      const order = await createOrder({
        restaurantId: lines[0].restaurantId,
        gate: trip.gate,
        passengerName: trip.passengerName,
        totalCents: quote.totalCents,
        summary: orderItemSummary(lines.map((line) => line.name)),
        status: 'being_prepared',
        lines: lines.map((line) => ({
          itemId: line.itemId,
          name: line.name,
          priceCents: line.priceCents,
          quantity: line.quantity,
          prepMinutes: line.prepMinutes,
        })),
      });
      await clear();
      router.push(`/order/${order.id}` as Href);
    } catch (caught) {
      setActionError(errorMessage(caught));
      setPaying(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            {router.canGoBack() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => router.back()}
                style={styles.back}>
                <Ionicons name="chevron-back" size={22} color={colors.ink} />
              </Pressable>
            ) : null}
            <Text style={styles.title}>Your cart</Text>
          </View>
          <Text style={styles.count}>{itemCountLabel(count)}</Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryCopy}>
              <Text style={styles.deliver}>{trip ? deliverToLabel(trip.gate) : 'Deliver to your gate'}</Text>
              <Text style={styles.arrival}>
                {arrival
                  ? arrivalBoardLine(arrival.arrivalClock, arrival.boardingClock)
                  : window
                    ? `Boarding ${window.boardingClock}`
                    : 'Add your name, gate, and departure.'}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Change trip" onPress={openSheet}>
              <Text style={styles.changeLight}>Change</Text>
            </Pressable>
          </View>
          {arrival ? <Text style={styles.spare}>{spareCopy(arrival.spare)}</Text> : null}
        </View>

        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Muted>Add something that can reach your gate before you board.</Muted>
            <Pressable accessibilityRole="button" onPress={() => router.navigate('/browse')} style={styles.browse}>
              <Text style={styles.browseLabel}>Browse restaurants</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {groups.map((group) => (
              <View key={group.restaurantId} style={styles.group}>
                <Text style={styles.from}>From {group.restaurantName}</Text>
                {group.lines.map((line) => (
                  <CartLineRow
                    key={line.itemId}
                    line={line}
                    late={Boolean(window && !window.fits(line.prepMinutes))}
                    disabled={pendingLine === line.itemId || paying}
                    onQuantity={(quantity) => void changeQuantity(line.itemId, quantity)}
                  />
                ))}
              </View>
            ))}

            {lines
              .filter((line) => line.discountCode)
              .map((line) => {
                const code = line.discountCode ?? '';
                const percent = percents[code.toUpperCase()];
                return (
                  <View key={line.itemId} style={styles.codeRow}>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{code.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.codeCopy}>
                      {typeof percent === 'number' ? appliedCodeCopy(percent, line.name) : code.toUpperCase()}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${code}`}
                      disabled={pendingLine === line.itemId || paying}
                      onPress={() => void removeCode(line.itemId)}>
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                );
              })}

            <Text style={styles.tipTitle}>Tip your courier</Text>
            <View style={styles.tips}>
              {TIP_PRESETS_CENTS.map((cents) => {
                const selected = !tipOpen && tipCents === cents;
                return (
                  <Pressable
                    key={cents}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Tip ${tipChipLabel(cents)}`}
                    onPress={() => {
                      setTipOpen(false);
                      setTipDraft(null);
                      void changeTip(cents);
                    }}
                    style={[styles.tip, selected && styles.tipOn]}>
                    <Text style={[styles.tipLabel, selected && styles.tipLabelOn]}>{tipChipLabel(cents)}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: tipOpen || otherSelected }}
                accessibilityLabel="Other tip"
                onPress={() => setTipOpen(true)}
                style={[styles.tip, (tipOpen || otherSelected) && styles.tipOn]}>
                <Text style={[styles.tipLabel, (tipOpen || otherSelected) && styles.tipLabelOn]}>Other</Text>
              </Pressable>
            </View>
            {tipOpen || otherSelected ? (
              <TextInput
                accessibilityLabel="Custom tip"
                value={customDraft}
                onChangeText={(value) => {
                  setTipDraft(value);
                  const parsed = parseTipCents(value);
                  if (parsed !== null) void changeTip(parsed);
                }}
                keyboardType="decimal-pad"
                placeholder="Custom amount"
                placeholderTextColor={colors.placeholder}
                style={styles.tipInput}
              />
            ) : null}

            {quote ? <Breakdown quote={quote} codes={codes} /> : <Muted>Pricing your cart.</Muted>}
            {tooLate && window ? <Text style={styles.warn}>{`Something in this cart is ${tooLateLabel(window.deliverByClock).toLowerCase()}.`}</Text> : null}
            {!trip ? <Text style={styles.warn}>Set your gate before you pay.</Text> : null}
            {discounts.error ? <Text style={styles.warn}>{discounts.error}</Text> : null}
            {actionError ? <Text style={styles.warn}>{actionError}</Text> : null}
          </>
        )}
      </ScrollView>

      {lines.length > 0 ? (
        <View style={styles.dock}>
          <View style={styles.cardRow}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>CARD</Text>
            </View>
            <Text style={styles.cardLabel}>
              {profile ? `${profile.cardBrand} ending ${profile.cardLast4}` : 'Saved card'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change card"
              disabled={!profile}
              onPress={() => setCardOpen(true)}>
              <Text style={[styles.changeDark, !profile && styles.changeDisabled]}>Change</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={quote ? `Pay ${formatCents(quote.totalCents)}` : 'Pay'}
            accessibilityState={{ disabled: !canPay }}
            disabled={!canPay}
            onPress={() => void pay()}
            style={({ pressed }) => [styles.pay, !canPay && styles.payDisabled, pressed && canPay && styles.pressed]}>
            <Text style={styles.payLabel}>{paying ? 'Paying…' : quote ? `Pay ${formatCents(quote.totalCents)}` : 'Pay'}</Text>
          </Pressable>
        </View>
      ) : null}

      {cardOpen && profile ? (
        <CardSheet
          brand={profile.cardBrand}
          last4={profile.cardLast4}
          onClose={() => setCardOpen(false)}
          onSave={async (brand, last4) => {
            await updateProfile({ cardBrand: brand, cardLast4: last4 });
            setCardOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function CartLineRow({
  line,
  late,
  disabled,
  onQuantity,
}: {
  line: CartLine;
  late: boolean;
  disabled: boolean;
  onQuantity: (quantity: number) => void;
}) {
  return (
    <View style={styles.line}>
      <View style={[styles.swatch, { backgroundColor: line.imageColor }, late && styles.late]} />
      <View style={styles.lineCopy}>
        <Text style={styles.lineName}>{line.name}</Text>
        <Text style={styles.lineMeta}>
          {formatCents(line.priceCents)} · {line.prepMinutes} MIN
          {late ? ' · TOO LATE' : ''}
        </Text>
        {line.note ? <Text style={styles.note}>{line.note}</Text> : null}
      </View>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={line.quantity === 1 ? `Remove ${line.name}` : `Decrease ${line.name}`}
          disabled={disabled}
          onPress={() => onQuantity(line.quantity - 1)}
          style={styles.step}>
          <Text style={[styles.stepLabel, disabled && styles.stepDisabled]}>−</Text>
        </Pressable>
        <Text style={styles.quantity}>{line.quantity}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${line.name}`}
          disabled={disabled || line.quantity >= 99}
          onPress={() => onQuantity(line.quantity + 1)}
          style={styles.step}>
          <Text style={[styles.stepLabel, (disabled || line.quantity >= 99) && styles.stepDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Breakdown({ quote, codes }: { quote: PriceQuote; codes: string[] }) {
  return (
    <View style={styles.breakdown}>
      <PriceRow label="Subtotal" value={formatCents(quote.subtotalCents)} />
      {quote.discountCents > 0 ? (
        <PriceRow label={discountRowLabel(codes)} value={formatCents(-quote.discountCents)} tone="good" />
      ) : null}
      <PriceRow label="Gate delivery fee" value={formatCents(quote.feeCents)} />
      <PriceRow label="Tax" value={formatCents(quote.taxCents)} />
      <PriceRow label="Courier tip" value={formatCents(quote.tipCents)} />
      <PriceRow label="Total" value={formatCents(quote.totalCents)} strong />
    </View>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
  tone = 'ink',
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'ink' | 'good';
}) {
  return (
    <View style={[styles.priceRow, strong && styles.totalRow]}>
      <Text style={[styles.priceLabel, strong && styles.priceStrong]}>{label}</Text>
      <Text style={[styles.priceValue, strong && styles.priceStrong, tone === 'good' && styles.priceGood]}>{value}</Text>
    </View>
  );
}

function CardSheet({
  brand,
  last4,
  onClose,
  onSave,
}: {
  brand: string;
  last4: string;
  onClose: () => void;
  onSave: (brand: string, last4: string) => Promise<void>;
}) {
  const [nextBrand, setNextBrand] = useState(brand);
  const [nextLast4, setNextLast4] = useState(last4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'brand' | 'last4' | null>('brand');

  async function save() {
    const cleanedBrand = nextBrand.trim();
    const cleanedLast4 = nextLast4.trim();
    if (!cleanedBrand || !/^\d{4}$/.test(cleanedLast4)) {
      setError('Enter the card brand and the last 4 digits.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(cleanedBrand, cleanedLast4);
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <View style={styles.sheetOverlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close payment method" style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Payment method</Text>
        <Text style={styles.fieldLabel}>Card brand</Text>
        <TextInput
          accessibilityLabel="Card brand"
          value={nextBrand}
          onChangeText={setNextBrand}
          onFocus={() => setFocused('brand')}
          autoCorrect={false}
          style={[styles.input, focused === 'brand' && styles.inputFocused]}
        />
        <Text style={styles.fieldLabel}>Last 4 digits</Text>
        <TextInput
          accessibilityLabel="Last 4 digits"
          value={nextLast4}
          onChangeText={(value) => setNextLast4(value.replace(/\D/g, '').slice(0, 4))}
          onFocus={() => setFocused('last4')}
          keyboardType="number-pad"
          maxLength={4}
          style={[styles.input, focused === 'last4' && styles.inputFocused]}
        />
        {error ? <Text style={styles.warn}>{error}</Text> : null}
        <PrimaryButton label={saving ? 'Saving…' : 'Save card'} disabled={saving} onPress={() => void save()} />
      </View>
    </View>
  );
}

function deliveryArrival(departureAt: string, now: Date, lines: readonly CartLine[]) {
  const departure = new Date(departureAt);
  const { boardingAt } = timeWindow(departure);
  const arrivalAt = cartArrival(
    now,
    lines.map((line) => line.prepMinutes),
  );
  return {
    arrivalClock: formatClock(arrivalAt),
    boardingClock: formatClock(boardingAt),
    spare: spareMinutes(boardingAt, arrivalAt),
  };
}

function formatTipDraft(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

function useDiscountPercents(lines: readonly { discountCode: string | null }[]) {
  const key = [...new Set(lines.flatMap((line) => (line.discountCode ? [line.discountCode] : [])))].sort().join('\n');
  const [percents, setPercents] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let active = true;
    createDataSource()
      .then(async (data) => {
        const next: Record<string, number> = {};
        for (const code of key.split('\n')) {
          const discount = await data.catalog.findDiscount(code);
          next[code.toUpperCase()] = discount?.percentOff ?? 0;
        }
        if (!active) return;
        setPercents(next);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(errorMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [key]);

  return { percents, error };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingTop: space.sm,
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.title,
    fontSize: 28,
    lineHeight: 34,
  },
  count: {
    ...type.body,
    color: colors.muted,
  },
  summary: {
    backgroundColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    gap: 6,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  deliver: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  arrival: {
    ...type.label,
    color: colors.surface,
    fontSize: 16,
    lineHeight: 21,
  },
  spare: {
    ...type.body,
    color: '#C8C8C2',
    fontSize: 14,
    lineHeight: 19,
  },
  changeLight: {
    ...type.label,
    color: colors.surface,
    textDecorationLine: 'underline',
    fontSize: 15,
  },
  empty: {
    gap: space.lg,
  },
  browse: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseLabel: type.label,
  group: {
    gap: space.md,
  },
  from: {
    ...type.body,
    fontWeight: '600',
    color: colors.muted,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  swatch: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  late: {
    opacity: 0.45,
  },
  lineCopy: {
    flex: 1,
    gap: 2,
  },
  lineName: type.label,
  lineMeta: {
    ...type.badge,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  note: {
    ...type.body,
    fontSize: 13,
    lineHeight: 17,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    paddingHorizontal: 2,
  },
  step: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 20,
    lineHeight: 22,
    color: colors.ink,
  },
  stepDisabled: {
    color: colors.placeholder,
  },
  quantity: {
    minWidth: 16,
    textAlign: 'center',
    ...type.label,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C8C8C2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  codeBadge: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  codeBadgeText: {
    ...type.badge,
    color: colors.ink,
  },
  codeCopy: {
    ...type.body,
    flex: 1,
    color: colors.ink,
  },
  remove: {
    ...type.label,
    textDecorationLine: 'underline',
  },
  tipTitle: type.label,
  tips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -8,
  },
  tip: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  tipLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  tipLabelOn: {
    color: colors.accent,
  },
  tipInput: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingHorizontal: space.lg,
    marginTop: -8,
    ...type.label,
  },
  breakdown: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
  },
  totalRow: {
    marginTop: 6,
  },
  priceLabel: type.body,
  priceValue: {
    ...type.body,
    color: colors.ink,
  },
  priceStrong: {
    ...type.label,
    fontSize: 17,
  },
  priceGood: {
    color: colors.success,
    fontWeight: '700',
  },
  warn: {
    ...type.body,
    color: colors.danger,
    fontSize: 14,
  },
  dock: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
    gap: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  cardBadge: {
    backgroundColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  cardBadgeText: {
    ...type.badge,
    color: colors.surface,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  cardLabel: {
    ...type.label,
    flex: 1,
  },
  changeDark: {
    ...type.label,
    textDecorationLine: 'underline',
  },
  changeDisabled: {
    color: colors.placeholder,
  },
  pay: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payDisabled: {
    opacity: 0.45,
  },
  payLabel: {
    ...type.button,
    color: colors.accent,
    fontSize: 17,
  },
  pressed: {
    opacity: 0.88,
  },
  sheetOverlay: {
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
  },
  sheetTitle: type.title,
  fieldLabel: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: -8,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.background,
    paddingHorizontal: space.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...type.label,
  },
  inputFocused: {
    backgroundColor: colors.surface,
    borderColor: colors.ink,
  },
});
