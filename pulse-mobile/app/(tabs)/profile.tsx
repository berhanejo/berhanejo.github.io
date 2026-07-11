import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';
import { useAuthSession } from '@/contexts/auth-session';
import { categoryOptions } from '@/data/mock-data';

export default function ProfileScreen() {
  const { signOut } = useAuthSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    currentProgram,
    currentUser,
    activeFocusAreas,
    currentStreak,
    dayOffset,
    simulatedDateLabel,
    goToNextDay,
    goToPreviousDay,
    resetToToday,
    syncGoalsNow,
  } = useAppSession();
  const categoryLabelById = useMemo(
    () => new Map(categoryOptions.map((option) => [option.id, option.label])),
    []
  );
  const activeCategory = categoryLabelById.get(currentProgram.category);
  const focusAreaLabels = useMemo(
    () => activeFocusAreas.map((area) => categoryLabelById.get(area)).filter(Boolean) as string[],
    [activeFocusAreas, categoryLabelById]
  );
  const handleOpenGoals = useCallback(() => {
    router.push('/(tabs)/goals');
  }, []);
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    await syncGoalsNow();
    await signOut();
    setIsSigningOut(false);
  }, [signOut, syncGoalsNow]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Your accountability setup</Text>
        <Text style={styles.subtitle}>A simple view of who you are, what you are committed to, and where you are showing up.</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.name}>{currentUser?.name ?? 'Your Profile'}</Text>
        <Text style={styles.goal}>{currentUser?.goal ?? 'Set your goal and keep showing up daily.'}</Text>

        <View style={styles.identityRow}>
          <View style={styles.identityChip}>
            <Text style={styles.identityLabel}>Active</Text>
            <Text style={styles.identityValue}>Day {currentProgram.day}</Text>
          </View>
          <View style={styles.identityChip}>
            <Text style={styles.identityLabel}>Streak</Text>
            <Text style={styles.identityValue}>{currentStreak} days</Text>
          </View>
        </View>
      </View>

      <View style={styles.programCard}>
        <Text style={styles.programKicker}>Active Program</Text>
        <Text style={styles.programTitle}>{currentProgram.title}</Text>
        <Text style={styles.programCategory}>{activeCategory}</Text>
        <Text style={styles.programFocus}>{currentProgram.focus}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Focus areas</Text>
        <View style={styles.chipRow}>
          {focusAreaLabels.map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Selected goals</Text>
        <Text style={styles.value}>Manage in Goal Management</Text>
        <Text style={styles.helper}>This is based on your onboarding selection and can include multiple goals.</Text>
        <Pressable onPress={handleOpenGoals} style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Open Goal Management</Text>
        </Pressable>
      </View>

      {__DEV__ ? (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Debug Time</Text>
          <Text style={styles.value}>{simulatedDateLabel}</Text>
          <Text style={styles.helper}>Offset: {dayOffset >= 0 ? `+${dayOffset}` : dayOffset} day(s)</Text>
          <View style={styles.goalActions}>
            <Pressable onPress={goToPreviousDay} style={styles.goalActionSecondary}>
              <Text style={styles.goalActionSecondaryText}>Previous Day</Text>
            </Pressable>
            <Pressable onPress={goToNextDay} style={styles.goalActionPrimary}>
              <Text style={styles.goalActionPrimaryText}>Next Day</Text>
            </Pressable>
            <Pressable onPress={resetToToday} style={styles.goalActionDanger}>
              <Text style={styles.goalActionDangerText}>Reset</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accountability Context</Text>
        <Text style={styles.sectionSubtitle}>The essentials that keep your daily consistency visible.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Private group</Text>
        <Text style={styles.value}>{currentUser?.groupName ?? 'Your Group'}</Text>
        <Text style={styles.helper}>Your proof and daily status are shared only inside this small accountability group.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Reminder</Text>
        <Text style={styles.value}>{currentProgram.nextReminder}</Text>
        <Text style={styles.helper}>A simple daily reminder helps you post proof before the day closes.</Text>
      </View>

      <Pressable onPress={handleSignOut} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>{isSigningOut ? 'Logging out…' : 'Log out'}</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  name: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  goal: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  identityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  identityChip: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  identityLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  identityValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  programCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  programKicker: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  programTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  programCategory: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
  programFocus: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  label: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  value: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '600',
  },
  helper: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  manageButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  manageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  goalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalActionPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalActionPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  goalActionSecondary: {
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalActionSecondaryText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  goalActionDanger: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalActionDangerText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutButtonText: {
    color: '#b91c1c',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
