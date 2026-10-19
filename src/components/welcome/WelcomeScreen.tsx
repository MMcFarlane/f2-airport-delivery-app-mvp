import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, space, type } from '@/src/theme';

const board = [
  { gate: 'B14', order: 'SMASH BURGER', status: '12 MIN', atGate: false },
  { gate: 'C22', order: 'OAT LATTE', status: '4 MIN', atGate: false },
  { gate: 'A7', order: 'POKE BOWL', status: 'AT GATE', atGate: true },
] as const;

const atGate = '#3DDC84';

type WelcomeScreenProps = {
  onContinueAsGuest: () => void;
};

export function WelcomeScreen({ onContinueAsGuest }: WelcomeScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.hero}>
          <View style={styles.brand}>
            <View style={styles.mark}>
              <Ionicons name="airplane" size={26} color={colors.ink} />
            </View>
            <Text style={styles.wordmark}>wingsnack</Text>
          </View>

          <Text style={styles.headline}>
            Food to your gate,{'\n'}
            <Text style={styles.headlineAccent}>before you board.</Text>
          </Text>

          <View style={styles.board}>
            <View style={styles.columns}>
              <Text style={[styles.column, styles.gateColumn]}>GATE</Text>
              <Text style={[styles.column, styles.orderColumn]}>ORDER</Text>
              <Text style={[styles.column, styles.statusColumn]}>STATUS</Text>
            </View>
            {board.map((row) => (
              <View key={row.gate} style={styles.row}>
                <Text style={[styles.gate, styles.gateColumn]}>{row.gate}</Text>
                <Text style={[styles.order, styles.orderColumn]}>{row.order}</Text>
                <Text style={[styles.status, styles.statusColumn, row.atGate && styles.statusAtGate]}>{row.status}</Text>
              </View>
            ))}
          </View>
        </SafeAreaView>

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Sign in or create an account</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Mobile number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.country}>
                <Text style={styles.countryLabel}>+1</Text>
                <Ionicons name="chevron-down" size={14} color={colors.ink} />
              </View>
              <View style={styles.phone}>
                <Text style={styles.phoneValue}>(555) 010-0142</Text>
              </View>
            </View>
          </View>

          <View style={styles.codeButton}>
            <Text style={styles.codeLabel}>Text me a code</Text>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.providers}>
            <View style={styles.provider}>
              <Text style={styles.providerLabel}>Continue with Apple</Text>
            </View>
            <View style={styles.provider}>
              <Text style={styles.providerLabel}>Continue with Google</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
            onPress={onContinueAsGuest}
            style={({ pressed }) => [styles.guest, pressed && styles.pressed]}>
            <Text style={styles.guestLabel}>Continue as guest →</Text>
          </Pressable>

          <Text style={styles.legal}>
            Guests get their order code by text. By continuing you agree to the <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
          <SafeAreaView edges={['bottom']} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    flexGrow: 1,
    minHeight: '100%',
  },
  hero: {
    paddingHorizontal: 22,
    paddingTop: space.sm,
    paddingBottom: 36,
    gap: space.xl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.surface,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1.1,
  },
  headline: {
    color: colors.surface,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headlineAccent: {
    color: colors.accent,
  },
  board: {
    gap: 8,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  column: {
    ...type.badge,
    color: '#8E8E8A',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  gateColumn: {
    width: 52,
  },
  orderColumn: {
    flex: 1,
  },
  statusColumn: {
    width: 72,
    textAlign: 'right',
  },
  gate: {
    ...type.label,
    color: colors.accent,
    fontSize: 14,
  },
  order: {
    ...type.label,
    color: colors.surface,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  status: {
    ...type.label,
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  statusAtGate: {
    color: atGate,
  },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: space.xl,
    paddingTop: 28,
    paddingBottom: space.lg,
    gap: space.lg,
  },
  sheetTitle: {
    ...type.title,
    fontSize: 26,
    lineHeight: 32,
  },
  fieldBlock: {
    gap: 8,
  },
  fieldLabel: {
    ...type.label,
    fontSize: 14,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  country: {
    minWidth: 74,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countryLabel: type.label,
  phone: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  phoneValue: {
    ...type.body,
    color: colors.placeholder,
    fontSize: 16,
  },
  codeButton: {
    minHeight: 56,
    borderRadius: radii.control,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  codeLabel: {
    ...type.button,
    color: colors.accent,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C8C8C2',
  },
  dividerLabel: {
    ...type.body,
    color: colors.placeholder,
  },
  providers: {
    flexDirection: 'row',
    gap: 10,
  },
  provider: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  providerLabel: {
    ...type.label,
    fontSize: 14,
    textAlign: 'center',
  },
  guest: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ink,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guestLabel: type.label,
  pressed: {
    opacity: 0.85,
  },
  legal: {
    ...type.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  legalLink: {
    color: colors.ink,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
});
