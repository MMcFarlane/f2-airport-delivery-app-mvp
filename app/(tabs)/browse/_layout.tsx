import { Stack } from 'expo-router';

import { colors } from '@/src/theme';

export default function BrowseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="[list]" dangerouslySingular={() => 'catalog-list'} />
    </Stack>
  );
}
