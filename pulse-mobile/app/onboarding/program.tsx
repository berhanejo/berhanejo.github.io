import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { Badge, Button, Card, Chip, SectionHeader } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/tokens';
import { categoryOptions, programsByCategory } from '@/data/mock-data';
import { getErrorMessage } from '@/lib/error-message';
import { useCreateGoal } from '@/lib/queries/goals';
import { useCompleteOnboarding } from '@/lib/queries/profile';
import { useAppStore } from '@/stores/app-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

export default function ProgramScreen() {
  const selectedCategories = useOnboardingStore((state) => state.selectedCategories);
  const selectedPrograms = useOnboardingStore((state) => state.selectedPrograms);
  const toggleProgram = useOnboardingStore((state) => state.toggleProgram);
  const resetOnboarding = useOnboardingStore((state) => state.reset);
  const maxActivePrograms = useAppStore((state) => state.maxActivePrograms);
  const createGoal = useCreateGoal();
  const completeOnboarding = useCompleteOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectedCategories.length) {
    return <Redirect href="/onboarding/category" />;
  }

  const programs = selectedCategories.flatMap((category) => programsByCategory[category]);
  const selectedLabels = selectedCategories
    .map((category) => categoryOptions.find((option) => option.id === category)?.label)
    .filter(Boolean) as string[];

  async function handleContinue() {
    setIsSubmitting(true);
    setError(null);
    try {
      for (const [index, program] of selectedPrograms.entries()) {
        await createGoal.mutateAsync({
          category: program.category,
          title: program.title,
          durationDays: program.totalDays,
          isCustom: false,
          isActive: index < maxActivePrograms,
        });
      }
      await completeOnboarding.mutateAsync();
      resetOnboarding();
      router.replace('/(tabs)');
    } catch (submitError) {
      console.warn('Failed to finish onboarding:', submitError);
      setError(getErrorMessage(submitError, 'Something went wrong finishing setup. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <SectionHeader
        eyebrow="Step 3"
        title="Choose suggested goals"
        subtitle="Based on your focus areas, here are suggested programs you can start with. Choose one or more, or skip for now."
      />

      <Card variant="soft" style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Suggested for your focus</Text>
        <View style={styles.chipRow}>
          {selectedLabels.map((label) => (
            <Chip key={label} label={label} selected />
          ))}
        </View>
        <Text style={styles.summaryText}>
          {selectedPrograms.length > 0
            ? `${selectedPrograms.length} goal${selectedPrograms.length === 1 ? '' : 's'} selected. You can add more later.`
            : 'No goal selected yet. You can continue now and manage goals later from the app.'}
        </Text>
      </Card>

      <View style={styles.list}>
        {programs.map((program) => {
          const isSelected = selectedPrograms.some((entry) => entry.id === program.id);

          return (
            <Card
              key={program.id}
              style={[styles.card, isSelected && styles.cardSelected]}>
              <Pressable onPress={() => toggleProgram(program)} style={styles.cardPressArea}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{program.title}</Text>
                  <Badge label={isSelected ? 'Selected' : 'Optional'} tone={isSelected ? 'brand' : 'neutral'} />
                </View>
                <Text style={[styles.cardMeta, isSelected && styles.cardMetaSelected]}>
                  {program.categoryLabel} • {program.totalDays} days
                </Text>
                <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{program.focus}</Text>
              </Pressable>
            </Card>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footerActions}>
        <Button disabled={isSubmitting} label="Skip for now" onPress={handleContinue} variant="secondary" />

        <Button
          disabled={isSubmitting}
          loading={isSubmitting}
          label={selectedPrograms.length > 0 ? 'Continue with selected goals' : 'Continue without goals'}
          onPress={handleContinue}
        />
      </View>
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
    gap: 10,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryText: {
    ...typography.body,
    color: colors.slate[600],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 10,
    justifyContent: 'space-between',
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
  cardMeta: {
    color: colors.primary.dark,
    fontSize: 13,
    fontWeight: '800',
  },
  cardMetaSelected: {
    color: colors.primary.darker,
  },
  cardText: {
    ...typography.body,
    color: colors.slate[600],
  },
  cardTextSelected: {
    color: colors.primary.darker,
  },
  error: {
    color: colors.danger.text,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  footerActions: {
    gap: 10,
    marginTop: 8,
  },
});
