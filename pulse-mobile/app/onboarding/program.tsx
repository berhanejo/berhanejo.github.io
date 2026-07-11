import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';
import { categoryOptions, programsByCategory } from '@/data/mock-data';

export default function ProgramScreen() {
  const {
    selectedCategories,
    selectedPrograms,
    toggleProgram,
    completeOnboarding,
  } = useAppSession();

  if (!selectedCategories.length) {
    return <Redirect href="/onboarding/category" />;
  }

  const programs = selectedCategories.flatMap((category) => programsByCategory[category]);
  const selectedLabels = selectedCategories
    .map((category) => categoryOptions.find((option) => option.id === category)?.label)
    .filter(Boolean) as string[];

  function handleContinue() {
    completeOnboarding();
    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.kicker}>Step 2</Text>
        <Text style={styles.title}>Choose suggested goals</Text>
        <Text style={styles.subtitle}>
          Based on your focus areas, here are mock programs you can start with. Choose one or more, or skip for now.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Suggested for your focus</Text>
        <View style={styles.chipRow}>
          {selectedLabels.map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.summaryText}>
          {selectedPrograms.length > 0
            ? `${selectedPrograms.length} goal${selectedPrograms.length === 1 ? '' : 's'} selected. You can add more later.`
            : 'No goal selected yet. You can continue now and manage goals later from the app.'}
        </Text>
      </View>

      <View style={styles.list}>
        {programs.map((program) => {
          const isSelected = selectedPrograms.some((entry) => entry.id === program.id);

          return (
            <Pressable
              key={program.id}
              onPress={() => toggleProgram(program)}
              style={[styles.card, isSelected && styles.cardSelected]}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{program.title}</Text>
                <Text style={[styles.stateBadge, isSelected ? styles.stateBadgeSelected : styles.stateBadgeIdle]}>
                  {isSelected ? 'Selected' : 'Optional'}
                </Text>
              </View>
              <Text style={[styles.cardMeta, isSelected && styles.cardMetaSelected]}>
                {program.categoryLabel} • {program.totalDays} days
              </Text>
              <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{program.focus}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footerActions}>
        <Pressable style={styles.secondaryButton} onPress={handleContinue}>
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>
            {selectedPrograms.length > 0 ? 'Continue with selected goals' : 'Continue without goals'}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  header: {
    gap: 6,
    paddingHorizontal: 4,
  },
  kicker: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 10,
    padding: 18,
  },
  summaryTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eff6ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 24,
    borderWidth: 1.5,
    gap: 8,
    padding: 20,
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  cardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  cardTitleSelected: {
    color: '#1d4ed8',
  },
  stateBadge: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stateBadgeSelected: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  stateBadgeIdle: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  cardMeta: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
  cardMetaSelected: {
    color: '#1d4ed8',
  },
  cardText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  cardTextSelected: {
    color: '#1e40af',
  },
  footerActions: {
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
