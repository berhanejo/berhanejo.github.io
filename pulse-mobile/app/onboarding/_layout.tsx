import { Redirect, Stack } from 'expo-router';

import { useAuthSession } from '@/contexts/auth-session';

export default function OnboardingLayout() {
  const { session, isLoading } = useAuthSession();

  if (isLoading) {
    return null;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="category" />
      <Stack.Screen name="program" />
    </Stack>
  );
}
