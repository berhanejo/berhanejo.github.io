import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { Badge, Button, Card, SectionHeader } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/tokens';
import { categoryOptions } from '@/data/mock-data';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function CategoryScreen() {
  const selectedCategories = useOnboardingStore((state) => state.selectedCategories);
  const toggleCategory = useOnboardingStore((state) => state.toggleCategory);
  const selectionCount = selectedCategories.length;

  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <SectionHeader eyebrow="Step 2" title="Choose your focus areas" subtitle="Pick one or more areas. You can refine goals in the next step." />

      <Card variant="soft" style={styles.summaryCard}>
        <Text style={styles.summaryCount}>{selectionCount}</Text>
        <Text style={styles.summaryLabel}>{selectionCount === 1 ? 'focus area selected' : 'focus areas selected'}</Text>
        <Text style={styles.summaryText}>Your selection shapes the goal suggestions, but nothing is locked in yet.</Text>
      </Card>

      <View style={styles.list}>
        {categoryOptions.map((category) => {
          const isSelected = selectedCategories.includes(category.id);

          return (
            <Card
              key={category.id}
              style={[styles.card, isSelected && styles.cardSelected]}>
              <Pressable onPress={() => toggleCategory(category.id)} style={styles.cardPressArea}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{category.label}</Text>
                  <Badge label={isSelected ? 'Selected' : 'Tap'} tone={isSelected ? 'brand' : 'neutral'} />
                </View>
                <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{category.description}</Text>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <Button disabled={!selectedCategories.length} label="Continue" onPress={() => router.push('/onboarding/program')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'flex-start',
  },
  backButton: {
    borderColor: colors.slate[300],
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  summaryCard: {
    gap: 4,
  },
  summaryCount: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  summaryLabel: {
    ...typography.label,
    color: colors.primary.dark,
    textTransform: 'uppercase',
  },
  summaryText: {
    ...typography.body,
    color: colors.slate[600],
  },
  card: {
    padding: 0,
  },
  cardPressArea: {
    gap: spacing.sm,
    padding: spacing.xl,
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardSelected: {
    backgroundColor: colors.primary.tint,
    borderColor: colors.primary.text,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
  },
  cardTitleSelected: {
    color: colors.primary.darker,
  },
  cardText: {
    ...typography.body,
    color: colors.slate[600],
  },
  cardTextSelected: {
    color: colors.primary.darker,
  },
});
