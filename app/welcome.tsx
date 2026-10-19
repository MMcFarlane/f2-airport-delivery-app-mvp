import { router } from 'expo-router';
import { useEffect } from 'react';

import { WelcomeScreen } from '@/src/components/welcome/WelcomeScreen';
import { useGuestGate } from '@/src/hooks/GuestGate';

export default function WelcomeRoute() {
  const { entered, enter } = useGuestGate();

  useEffect(() => {
    if (entered) router.replace('/');
  }, [entered]);

  return <WelcomeScreen onContinueAsGuest={enter} />;
}
