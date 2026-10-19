import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/ui/Buttons';
import { FilterChip } from '@/src/components/ui/FilterChip';
import { FormSheet } from '@/src/components/ui/FormSheet';
import { Muted } from '@/src/components/ui/Screen';
import { createDataSource } from '@/src/data';
import {
  deliveredOrders,
  dietaryOptions,
  formatClock,
  type DietaryPreference,
  type Profile,
} from '@/src/domain';
import { errorMessage } from '@/src/hooks/error-message';
import { useOrders } from '@/src/hooks/useOrders';
import { useProfile } from '@/src/hooks/useProfile';
import { useTripSession } from '@/src/hooks/TripProvider';
import { colors, space, type } from '@/src/theme';

const notifications = [
  {
    key: 'orderUpdates',
    title: 'Order updates by text',
    detail: 'Prep, pickup and courier arrival',
  },
  {
    key: 'boardingReminders',
    title: 'Boarding reminders',
    detail: 'Nudge if your order is cutting it close',
  },
  {
    key: 'deals',
    title: 'Deals at my airport',
    detail: 'Specials and bundles near your gate',
  },
] as const;

export function AccountBoard() {
  const { trip, openSheet } = useTripSession();
  const { profile, loading, error, reload, updateProfile } = useProfile();
  const { orders, reload: reloadOrders } = useOrders();
  const [sheet, setSheet] = useState<'edit' | 'payment' | 'promo' | 'help' | null>(null);
  const [promo, setPromo] = useState('FLY10');
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload().catch(() => undefined);
      void reloadOrders().catch(() => undefined);
      void createDataSource()
        .then((data) => data.catalog.findDiscount('FLY10'))
        .then((discount) => {
          if (discount) setPromo(discount.code);
        })
        .catch(() => undefined);
    }, [reload, reloadOrders]),
  );

  const pastCount = deliveredOrders(orders ?? []).length;
  const departure = trip ? formatClock(new Date(trip.departureAt)) : null;

  async function save(patch: Parameters<typeof updateProfile>[0]) {
    setActionError(null);
    try {
      await updateProfile(patch);
    } catch (caught) {
      setActionError(errorMessage(caught));
      throw caught;
    }
  }

  function toggleDiet(option: DietaryPreference) {
    if (!profile) return;
    const selected = new Set(profile.dietary);
    if (selected.has(option)) selected.delete(option);
    else selected.add(option);
    const dietary = dietaryOptions.filter((entry) => selected.has(entry));
    void save({ dietary }).catch(() => undefined);
  }

  function toggleNote(key: (typeof notifications)[number]['key'], value: boolean) {
    if (!profile) return;
    void save({ notifications: { [key]: value } }).catch(() => undefined);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading && !profile ? <Muted>Loading your profile.</Muted> : null}
        {error ? <Muted>{error}</Muted> : null}
        {actionError ? <Text style={styles.warn}>{actionError}</Text> : null}

        {profile ? (
          <>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>{profile.name.trim().charAt(0).toUpperCase() || 'J'}</Text>
              </View>
              <View style={styles.identity}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.contact}>{`${profile.email} · ${profile.phone}`}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                onPress={() => setSheet('edit')}
                style={styles.edit}>
                <Text style={styles.editLabel}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.trip}>
              <View style={styles.tripCopy}>
                <Text style={styles.tripKicker}>CURRENT TRIP</Text>
                <Text style={styles.tripLine}>
                  {trip && departure ? `GATE ${trip.gate.toUpperCase()} · DEP ${departure}` : 'Set gate and departure'}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Change trip" onPress={openSheet} style={styles.change}>
                <Text style={styles.changeLabel}>Change</Text>
              </Pressable>
            </View>

            <Text style={styles.section}>Dietary preferences</Text>
            <View style={styles.chips}>
              {dietaryOptions.map((option) => (
                <FilterChip
                  key={option}
                  label={option}
                  selected={profile.dietary.includes(option)}
                  onPress={() => toggleDiet(option)}
                />
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.section}>Notifications</Text>
              {notifications.map((row, index) => (
                <View key={row.key} style={[styles.noteRow, index > 0 && styles.noteDivider]}>
                  <View style={styles.noteCopy}>
                    <Text style={styles.noteTitle}>{row.title}</Text>
                    <Text style={styles.noteDetail}>{row.detail}</Text>
                  </View>
                  <PreferenceSwitch
                    label={row.title}
                    value={profile.notifications[row.key]}
                    onValueChange={(value) => toggleNote(row.key, value)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.rows}>
              <AccountRow
                label="Payment methods"
                value={`${profile.cardBrand} ${profile.cardLast4}`}
                onPress={() => setSheet('payment')}
              />
              <AccountRow
                label="Past orders"
                value={String(pastCount)}
                onPress={() => router.navigate('/orders' as Href)}
              />
              <AccountRow label="Promo codes" value={promo} onPress={() => setSheet('promo')} />
              <AccountRow label="Help & support" onPress={() => setSheet('help')} />
            </View>
          </>
        ) : null}
      </ScrollView>

      {sheet === 'edit' && profile ? (
        <EditSheet
          profile={profile}
          onClose={() => setSheet(null)}
          onSave={async (next) => {
            await save(next);
            setSheet(null);
          }}
        />
      ) : null}
      {sheet === 'payment' && profile ? (
        <PaymentSheet
          brand={profile.cardBrand}
          last4={profile.cardLast4}
          onClose={() => setSheet(null)}
          onSave={async (cardBrand, cardLast4) => {
            await save({ cardBrand, cardLast4 });
            setSheet(null);
          }}
        />
      ) : null}
      {sheet === 'promo' ? (
        <FormSheet title="Promo codes" onClose={() => setSheet(null)}>
          <Text style={styles.sheetBody}>{`${promo} takes 10% off the item you apply it to.`}</Text>
        </FormSheet>
      ) : null}
      {sheet === 'help' ? (
        <FormSheet title="Help & support" onClose={() => setSheet(null)}>
          <Text style={styles.sheetBody}>
            Orders, your trip, and these preferences stay on this phone. Text updates, boarding reminders, and deals are
            saved here and are not sent. Give the courier the 4-character code when they reach your gate.
          </Text>
        </FormSheet>
      ) : null}
    </SafeAreaView>
  );
}

function PreferenceSwitch({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

function AccountRow({ label, value, onPress }: { label: string; value?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
    </Pressable>
  );
}

function EditSheet({
  profile,
  onClose,
  onSave,
}: {
  profile: Profile;
  onClose: () => void;
  onSave: (patch: Pick<Profile, 'name' | 'email' | 'phone'>) => Promise<void>;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const next = { name: name.trim(), email: email.trim(), phone: phone.trim() };
    if (!next.name || !next.email.includes('@') || !next.phone) {
      setError('Enter your name, email, and phone.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <FormSheet title="Edit profile" onClose={onClose}>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {error ? <Text style={styles.warn}>{error}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save'} disabled={saving} onPress={() => void submit()} />
    </FormSheet>
  );
}

function PaymentSheet({
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

  async function submit() {
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
    <FormSheet title="Payment method" onClose={onClose}>
      <Field label="Card brand" value={nextBrand} onChangeText={setNextBrand} />
      <Field
        label="Last 4 digits"
        value={nextLast4}
        onChangeText={(value) => setNextLast4(value.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
      />
      {error ? <Text style={styles.warn}>{error}</Text> : null}
      <PrimaryButton label={saving ? 'Saving…' : 'Save card'} disabled={saving} onPress={() => void submit()} />
    </FormSheet>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType={keyboardType}
        autoCorrect={false}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
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
    gap: space.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.accent,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.title,
    fontSize: 28,
    lineHeight: 32,
  },
  contact: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
  },
  edit: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLabel: type.label,
  trip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.ink,
    borderRadius: 18,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
  },
  tripCopy: {
    flex: 1,
    gap: 4,
  },
  tripKicker: {
    ...type.badge,
    color: colors.accent,
    letterSpacing: 0.7,
  },
  tripLine: {
    ...type.headline,
    color: colors.surface,
    fontSize: 16,
  },
  change: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeLabel: type.label,
  section: {
    ...type.badge,
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  noteDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  noteCopy: {
    flex: 1,
    gap: 2,
  },
  noteTitle: type.label,
  noteDetail: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
  },
  track: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 3,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.ink,
  },
  trackOff: {
    backgroundColor: '#D5D5D0',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  thumbOn: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
  },
  thumbOff: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  rows: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: space.lg,
  },
  rowLabel: {
    ...type.label,
    flex: 1,
  },
  rowValue: {
    ...type.body,
    color: colors.muted,
  },
  warn: {
    ...type.body,
    color: colors.danger,
  },
  sheetBody: type.body,
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...type.body,
    fontSize: 13,
    color: colors.muted,
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
