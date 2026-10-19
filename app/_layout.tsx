import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { PhoneFrame } from '@/src/components/ui/PhoneFrame';
import { GuestGate, useGuestGate } from '@/src/hooks/GuestGate';
import { TripProvider } from '@/src/hooks/TripProvider';
import { colors } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <PhoneFrame>
      <GuestGate>
        <RootNavigator />
      </GuestGate>
    </PhoneFrame>
  );
}

function RootNavigator() {
  const { entered } = useGuestGate();
  const pathname = usePathname();

  return (
    <TripProvider sheetEnabled={entered}>
      <StatusBar style={pathname === '/welcome' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={entered} redirectTo="/welcome">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="restaurant/[id]" />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="order/[id]" />
        </Stack.Protected>
        <Stack.Screen name="welcome" options={{ contentStyle: { backgroundColor: colors.ink } }} />
      </Stack>
    </TripProvider>
  );
}
