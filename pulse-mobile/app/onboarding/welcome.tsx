import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { Button, Card } from '@/components/ui';
import { colors, typography } from '@/constants/tokens';

export default function WelcomeScreen() {
  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.wrapper}>
        <Card variant="dark" style={styles.heroCard}>
          <View style={styles.mascotBubble}>
            <MaterialIcons name="bolt" size={34} color={colors.sun} />
          </View>
          <Text style={styles.kicker}>Pulse</Text>
          <Text style={styles.title}>Build your streak with proof and your people.</Text>
          <Text style={styles.subtitle}>
            Pulse helps you stay consistent with daily check-ins, clear progress, and a small private support circle.
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Set up in three steps</Text>
          <Text style={styles.infoText}>Create or join your private group, choose your focus areas, then pick your first goals.</Text>
          <Text style={styles.infoText}>You can select multiple goals or skip and explore the app first.</Text>
        </Card>

        <Button icon="arrow-forward" label="Get Started" onPress={() => router.push('/onboarding/group')} />
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
  heroCard: {
    gap: 12,
    minHeight: 330,
    justifyContent: 'flex-end',
  },
  mascotBubble: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(250,204,21,0.14)',
    borderColor: 'rgba(250,204,21,0.36)',
    borderRadius: 999,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: 28,
    width: 72,
  },
  kicker: {
    ...typography.kicker,
    color: colors.primary.light,
  },
  title: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  subtitle: {
    color: colors.slate[300],
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    gap: 10,
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  infoText: {
    color: colors.slate[600],
    fontSize: 15,
    lineHeight: 22,
  },
});
