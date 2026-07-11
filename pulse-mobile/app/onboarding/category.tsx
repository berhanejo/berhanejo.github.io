import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';
import { categoryOptions } from '@/data/mock-data';

export default function CategoryScreen() {
  const { selectedCategories, toggleCategory } = useAppSession();
  const selectionCount = selectedCategories.length;

  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.kicker}>Step 1</Text>
        <Text style={styles.title}>Choose your focus areas</Text>
        <Text style={styles.subtitle}>Pick one or more areas. You can refine goals in the next step.</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryCount}>{selectionCount}</Text>
        <Text style={styles.summaryLabel}>{selectionCount === 1 ? 'focus area selected' : 'focus areas selected'}</Text>
        <Text style={styles.summaryText}>Your selection shapes the goal suggestions, but nothing is locked in yet.</Text>
      </View>

      <View style={styles.list}>
        {categoryOptions.map((category) => {
          const isSelected = selectedCategories.includes(category.id);

          return (
            <Pressable
              key={category.id}
              onPress={() => toggleCategory(category.id)}
              style={[styles.card, isSelected && styles.cardSelected]}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{category.label}</Text>
                <Text style={[styles.stateBadge, isSelected ? styles.stateBadgeSelected : styles.stateBadgeIdle]}>
                  {isSelected ? 'Selected' : 'Tap to select'}
                </Text>
              </View>
              <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{category.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={!selectedCategories.length}
        onPress={() => router.push('/onboarding/program')}
        style={[styles.primaryButton, !selectedCategories.length && styles.primaryButtonDisabled]}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
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
    gap: 4,
    padding: 18,
  },
  summaryCount: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
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
    justifyContent: 'space-between',
    gap: 10,
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
  cardText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  cardTextSelected: {
    color: '#1e40af',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 22,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
