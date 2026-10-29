import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LaterScreen } from '@/src/components/ui/LaterScreen';
import { hasFoodImage, Photo } from '@/src/components/ui/Photo';
import { createDataSource } from '@/src/data';
import {
  cartArrival,
  discountAppliedCopy,
  formatCents,
  formatClock,
  itemPrepChip,
  lineTotalCents,
  tooLateLabel,
  type DiscountCode,
} from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';
import { useAsyncValue } from '@/src/hooks/useAsyncValue';
import { useCart } from '@/src/hooks/useCart';
import { useCatalog } from '@/src/hooks/useCatalog';
import { useOrderingWindow } from '@/src/hooks/useOrderingWindow';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, space, type } from '@/src/theme';
import { markInk } from '@/src/theme/contrast';

export function ItemDetail({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { trip } = useTripSession();
  const window = useOrderingWindow(trip);
  const { addLine } = useCart();
  const { findDiscount } = useCatalog();
  const loaded = useAsyncValue(async () => {
    if (!id) return null;
    const data = await createDataSource();
    return data.catalog.getItem(id);
  }, null);
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [applied, setApplied] = useState<DiscountCode | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'code' | 'note' | null>(null);

  if (loaded.loading) return <LaterScreen title="Item" body="Loading this item." />;
  if (loaded.error) return <LaterScreen title="Item" body={loaded.error} />;
  if (!loaded.value) return <LaterScreen title="Item" body="That item is not in the catalog." />;

  const item = loaded.value;
  const fits = Boolean(window?.fits(item.prepMinutes));
  const canAdd = fits && !adding;
  const originalCents = item.priceCents * quantity;
  const currentCents = lineTotalCents(item.priceCents, quantity, applied?.percentOff ?? 0);
  const discounted = applied !== null && currentCents !== originalCents;
  const prepChip =
    window && trip
      ? window.fits(item.prepMinutes)
        ? itemPrepChip(item.prepMinutes, trip.gate, formatClock(cartArrival(window.now, [item.prepMinutes])))
        : `${item.prepMinutes} min · ${tooLateLabel(window.deliverByClock)}`
      : `${item.prepMinutes} min`;
  const ink = markInk(item.imageColor);

  async function applyCode() {
    const entered = code.trim();
    if (!entered || applying) return;
    setApplying(true);
    setCodeError(null);
    try {
      const discount = await findDiscount(entered);
      if (!discount) {
        setApplied(null);
        setCodeError('Unknown discount code');
        return;
      }
      setApplied(discount);
      setCode(discount.code);
    } catch (caught) {
      setApplied(null);
      setCodeError(errorMessage(caught));
    } finally {
      setApplying(false);
    }
  }

  async function addToCart() {
    if (!canAdd) return;
    setAdding(true);
    setAddError(null);
    try {
      await addLine({
        itemId: item.id,
        quantity,
        note: note.trim() ? note.trim() : null,
        discountCode: applied?.code ?? null,
      });
      if (router.canGoBack()) router.back();
      else router.replace(`/restaurant/${item.restaurantId}` as Href);
    } catch (caught) {
      setAddError(errorMessage(caught));
      setAdding(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Photo color={item.imageColor} imageKey={item.imageKey} style={[styles.photo, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={goBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
          {hasFoodImage(item.imageKey) ? null : (
            <View style={styles.photoCaption}>
              <Ionicons name="image-outline" size={16} color={ink} />
              <Text style={[styles.photoCaptionText, { color: ink }]}>Item photo</Text>
            </View>
          )}
        </Photo>

        <View style={styles.prepWrap}>
          <View style={styles.prep}>
            <Ionicons name="time-outline" size={14} color={colors.accent} />
            <Text style={styles.prepText}>{prepChip}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.restaurant}>{item.restaurantName}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{formatCents(item.priceCents)}</Text>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <Text style={styles.fieldLabel}>Discount code</Text>
          <View style={styles.codeRow}>
            <TextInput
              accessibilityLabel="Discount code"
              value={code}
              onChangeText={(value) => {
                setCode(value);
                setCodeError(null);
                setApplied((current) =>
                  current && current.code.toLowerCase() === value.trim().toLowerCase() ? current : null,
                );
              }}
              onFocus={() => setFocused('code')}
              onBlur={() => setFocused((current) => (current === 'code' ? null : current))}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="FLY10"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, styles.codeInput, focused === 'code' && styles.inputFocused]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply discount code"
              accessibilityState={{ disabled: code.trim().length === 0 || applying }}
              disabled={code.trim().length === 0 || applying}
              onPress={() => void applyCode()}
              style={({ pressed }) => [
                styles.apply,
                (code.trim().length === 0 || applying) && styles.applyDisabled,
                pressed && code.trim().length > 0 && styles.pressed,
              ]}>
              <Text style={styles.applyLabel}>{applying ? 'Applying' : 'Apply'}</Text>
            </Pressable>
          </View>
          {applied ? (
            <View style={styles.applied}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text style={styles.appliedText}>{discountAppliedCopy(applied.code, applied.label)}</Text>
            </View>
          ) : null}
          {codeError ? <Text style={styles.error}>{codeError}</Text> : null}

          <Text style={styles.fieldLabel}>
            Note for the kitchen <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            accessibilityLabel="Note for the kitchen"
            value={note}
            onChangeText={setNote}
            onFocus={() => setFocused('note')}
            onBlur={() => setFocused((current) => (current === 'note' ? null : current))}
            placeholder="e.g. no onions"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, focused === 'note' && styles.inputFocused]}
          />
          {addError ? <Text style={styles.error}>{addError}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease quantity"
            accessibilityState={{ disabled: !fits || quantity <= 1 }}
            disabled={!fits || quantity <= 1}
            onPress={() => setQuantity((current) => Math.max(1, current - 1))}
            style={styles.step}>
            <Text style={[styles.stepLabel, (!fits || quantity <= 1) && styles.stepDisabled]}>−</Text>
          </Pressable>
          <Text style={styles.quantity}>{quantity}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
            accessibilityState={{ disabled: !fits || quantity >= 99 }}
            disabled={!fits || quantity >= 99}
            onPress={() => setQuantity((current) => Math.min(99, current + 1))}
            style={styles.step}>
            <Text style={[styles.stepLabel, (!fits || quantity >= 99) && styles.stepDisabled]}>+</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            fits
              ? `Add ${quantity} ${item.name} for ${formatCents(currentCents)}`
              : window
                ? tooLateLabel(window.deliverByClock)
                : 'Set your gate to order'
          }
          accessibilityState={{ disabled: !canAdd }}
          disabled={!canAdd}
          onPress={() => void addToCart()}
          style={({ pressed }) => [styles.add, !fits && styles.addDisabled, pressed && canAdd && styles.pressed]}>
          {fits ? (
            <>
              <Text style={styles.addLabel}>{adding ? 'Adding' : 'Add to cart'}</Text>
              <View style={styles.addPrices}>
                {discounted ? <Text style={styles.struck}>{formatCents(originalCents)}</Text> : null}
                <Text style={styles.addPrice}>{formatCents(currentCents)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.addDisabledLabel}>
              {window ? tooLateLabel(window.deliverByClock) : 'Set your gate to order'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.navigate('/');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 24,
  },
  photo: {
    minHeight: 240,
    paddingHorizontal: space.xl,
    justifyContent: 'space-between',
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 36,
  },
  photoCaptionText: {
    ...type.body,
    fontSize: 14,
    opacity: 0.75,
  },
  prepWrap: {
    marginTop: -18,
    paddingHorizontal: space.xl,
    alignItems: 'flex-start',
  },
  prep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prepText: {
    ...type.badge,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    gap: space.md,
  },
  restaurant: {
    ...type.body,
    fontSize: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginTop: -6,
  },
  name: {
    ...type.title,
    flex: 1,
    fontSize: 30,
    lineHeight: 34,
  },
  price: {
    ...type.title,
    fontSize: 22,
    lineHeight: 28,
  },
  description: type.body,
  fieldLabel: {
    ...type.label,
    marginTop: space.sm,
  },
  optional: {
    ...type.body,
    fontWeight: '400',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: -4,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    ...type.body,
    color: colors.ink,
  },
  codeInput: {
    flex: 1,
  },
  inputFocused: {
    borderColor: colors.ink,
  },
  apply: {
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyDisabled: {
    opacity: 0.4,
  },
  applyLabel: type.label,
  applied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
  },
  appliedText: {
    ...type.body,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  error: {
    ...type.body,
    color: colors.danger,
    fontSize: 13,
    marginTop: -6,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: colors.background,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 4,
  },
  step: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '500',
    color: colors.ink,
  },
  stepDisabled: {
    color: colors.placeholder,
  },
  quantity: {
    minWidth: 20,
    textAlign: 'center',
    ...type.label,
    fontSize: 16,
  },
  add: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  addDisabled: {
    backgroundColor: colors.border,
  },
  addLabel: {
    ...type.button,
    color: colors.surface,
  },
  addPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  struck: {
    ...type.body,
    color: '#C8C8C2',
    textDecorationLine: 'line-through',
    fontSize: 14,
  },
  addPrice: {
    ...type.button,
    color: colors.accent,
  },
  addDisabledLabel: {
    ...type.button,
    color: colors.muted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
