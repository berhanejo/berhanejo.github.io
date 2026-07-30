import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
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
    groupName,
    groupMembers,
    activePrograms,
    activeFocusAreas,
    currentStreak,
    bestStreak,
    completedDays,
    elapsedDays,
  } = useAppSession();
  const badges = useMemo(
    () => [
      { id: 'first', emoji: '🌱', label: 'First check-in', achieved: completedDays >= 1 },
      { id: 'streak3', emoji: '🔥', label: '3-day streak', achieved: bestStreak >= 3 },
      { id: 'streak7', emoji: '⚡', label: '7-day streak', achieved: bestStreak >= 7 },
      { id: 'streak30', emoji: '🏆', label: '30-day streak', achieved: bestStreak >= 30 },
    ],
    [bestStreak, completedDays]
  );
  const categoryLabelById = useMemo(
    () => new Map(categoryOptions.map((option) => [option.id, option.label])),
    []
  );
  const activeCategory = currentProgram ? categoryLabelById.get(currentProgram.category) : undefined;
  const focusAreaLabels = useMemo(
    () => activeFocusAreas.map((area) => categoryLabelById.get(area)).filter(Boolean) as string[],
    [activeFocusAreas, categoryLabelById]
  );
  const handleOpenGoals = useCallback(() => {
    router.push('/(tabs)/goals');
  }, []);
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  }, [signOut]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Profile</Text>
        <Text style={styles.title}>Your accountability setup</Text>
        <Text style={styles.subtitle}>A simple view of who you are, what you are committed to, and where you are showing up.</Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Avatar name={currentUser?.name ?? 'You'} size={72} />
          <View style={styles.heroIdentity}>
            <Text style={styles.name}>{currentUser?.name ?? 'Your Profile'}</Text>
            <Text style={styles.goal}>
              {currentProgram ? `Working on ${currentProgram.title.toLowerCase()}.` : 'Add a goal to start showing up daily.'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{elapsedDays}</Text>
            <Text style={styles.statLabel}>Day</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{activePrograms.length}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{groupMembers.length}</Text>
            <Text style={styles.statLabel}>Group</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Badges</Text>
        <View style={styles.badgeGrid}>
          {badges.map((badge) => (
            <View key={badge.id} style={[styles.badgeChip, !badge.achieved && styles.badgeChipLocked]}>
              <Text style={[styles.badgeEmoji, !badge.achieved && styles.badgeEmojiLocked]}>{badge.emoji}</Text>
              <Text style={[styles.badgeLabel, !badge.achieved && styles.badgeLabelLocked]}>{badge.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {currentProgram ? (
        <View style={styles.programCard}>
          <Text style={styles.programKicker}>Active Program</Text>
          <Text style={styles.programTitle}>{currentProgram.title}</Text>
          <Text style={styles.programCategory}>{activeCategory}</Text>
          <Text style={styles.programFocus}>{currentProgram.focus}</Text>
        </View>
      ) : null}

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accountability Context</Text>
        <Text style={styles.sectionSubtitle}>The essentials that keep your daily consistency visible.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Private group</Text>
        {groupName ? (
          <>
            <Text style={styles.value}>{groupName}</Text>
            <Text style={styles.helper}>Your proof and daily status are shared only inside this small accountability group.</Text>
          </>
        ) : (
          <>
            <Text style={styles.value}>Not in a group</Text>
            <Text style={styles.helper}>Create or join a private group any time to share check-ins with others.</Text>
            <Pressable onPress={() => router.push('/onboarding/group')} style={styles.manageButton}>
              <Text style={styles.manageButtonText}>Create or join a group</Text>
            </Pressable>
          </>
        )}
      </View>

      {currentProgram ? (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Reminder</Text>
          <Text style={styles.value}>{currentProgram.nextReminder}</Text>
          <Text style={styles.helper}>A simple daily reminder helps you post proof before the day closes.</Text>
        </View>
      ) : null}

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
    color: '#102a19',
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
    backgroundColor: '#102a19',
    borderRadius: 28,
    padding: 22,
    gap: 18,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  heroIdentity: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  goal: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  statDivider: {
    backgroundColor: '#2f5f3b',
    height: 28,
    width: 1,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  programCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 8,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  programKicker: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  programTitle: {
    color: '#102a19',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  programCategory: {
    color: '#16a34a',
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
    color: '#102a19',
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
    shadowColor: '#102a19',
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
    color: '#102a19',
    fontSize: 20,
    fontWeight: '600',
  },
  helper: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  manageButton: {
    backgroundColor: '#16a34a',
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeChip: {
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    borderRadius: 18,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 96,
  },
  badgeChipLocked: {
    backgroundColor: '#f1f5f9',
  },
  badgeEmoji: {
    fontSize: 26,
  },
  badgeEmojiLocked: {
    opacity: 0.35,
  },
  badgeLabel: {
    color: '#9a3412',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeLabelLocked: {
    color: '#94a3b8',
  },
  chip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#102a19',
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
