import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuthSession } from '@/contexts/auth-session';

// The (tabs) layout owns the finer-grained onboarding/group redirect logic;
// this gate only needs to decide between signed-out and signed-in.
export default function IndexScreen() {
  const { session, isLoading, isPasswordRecovery } = useAuthSession();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#16a34a" />
        <Text style={styles.loadingText}>Loading your workspace…</Text>
      </View>
    );
  }

  // A password-recovery link establishes a (temporary) session too — this
  // must be checked before the normal session gate, or the user gets
  // dropped straight into the app instead of the "set a new password" step.
  if (isPasswordRecovery) {
    return <Redirect href="/auth/reset-password" />;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)" />;
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
