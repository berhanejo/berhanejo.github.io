import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppSession } from '@/contexts/app-session';
import { useAuthSession } from '@/contexts/auth-session';

export default function IndexScreen() {
  const { session, isLoading } = useAuthSession();
  const { hasCompletedOnboarding } = useAppSession();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.loadingText}>Loading your workspace…</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href={hasCompletedOnboarding ? '/(tabs)' : '/onboarding/welcome'} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
