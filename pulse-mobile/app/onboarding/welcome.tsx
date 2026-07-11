import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';

export default function WelcomeScreen() {
  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.wrapper}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.kicker}>Pulse</Text>
          <Text style={styles.title}>Build consistency with flexible, proof-based accountability.</Text>
          <Text style={styles.subtitle}>
            Pulse helps you stay consistent with daily check-ins, clear progress, and a small private support circle.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Personalized in two steps</Text>
          <Text style={styles.infoText}>Choose your focus areas and get suggested goals based on what you want to improve.</Text>
          <Text style={styles.infoText}>You can select multiple goals or skip and explore the app first.</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.push('/onboarding/category')}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  topRow: {
    alignItems: 'flex-start',
  },
  backButton: {
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    gap: 12,
    padding: 24,
  },
  kicker: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.9,
    lineHeight: 40,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  infoTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  infoText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
