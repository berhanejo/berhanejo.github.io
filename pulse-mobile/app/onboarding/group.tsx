import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { programsByCategory, type GoalCategory, type Program } from '@/data/mock-data';
import { getErrorMessage } from '@/lib/error-message';
import { useCreateGoal } from '@/lib/queries/goals';
import { useCreateGroup, useJoinGroupByCode } from '@/lib/queries/groups';
import { useProfile } from '@/lib/queries/profile';

type Mode = 'create' | 'join';
type CustomStarterGoal = {
  id: string;
  title: string;
  category: GoalCategory;
  durationDays: 7 | 14 | 30;
};

const MAX_STARTER_GOALS = 5;

export default function GroupScreen() {
  const [mode, setMode] = useState<Mode>('create');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<CustomStarterGoal[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<GoalCategory>('fitness');
  const [customDuration, setCustomDuration] = useState<7 | 14 | 30>(14);
  const [error, setError] = useState<string | null>(null);

  const { data: profile } = useProfile();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroupByCode();
  const createGoal = useCreateGoal();
  const isSubmitting = createGroup.isPending || joinGroup.isPending || createGoal.isPending;
  const starterPrograms = Object.values(programsByCategory).flat().slice(0, 8);
  const starterGoalCount = selectedProgramIds.length + customGoals.length;

  // Reachable both as onboarding step 1 (profile not finished yet) and as a
  // "join or create a group later" entry point from within the app once
  // onboarding is already done — route back to wherever makes sense.
  function continueOn() {
    if (profile?.onboardingCompleted) {
      router.replace('/(tabs)');
    } else {
      router.push('/onboarding/category');
    }
  }

  function selectMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
  }

  function toggleStarterProgram(programId: string) {
    setSelectedProgramIds((current) =>
      current.includes(programId)
        ? current.filter((id) => id !== programId)
        : current.length + customGoals.length >= MAX_STARTER_GOALS
          ? current
          : [...current, programId]
    );
  }

  function addCustomStarterGoal() {
    const cleanTitle = customTitle.trim();
    if (!cleanTitle || starterGoalCount >= MAX_STARTER_GOALS) {
      return;
    }

    setCustomGoals((current) => [
      ...current,
      {
        id: `${Date.now()}-${current.length}`,
        title: cleanTitle,
        category: customCategory,
        durationDays: customDuration,
      },
    ]);
    setCustomTitle('');
    setCustomCategory('fitness');
    setCustomDuration(14);
  }

  function removeCustomStarterGoal(goalId: string) {
    setCustomGoals((current) => current.filter((goal) => goal.id !== goalId));
  }

  async function createStarterGoals(groupId: string) {
    const selectedPrograms = starterPrograms.filter((program) => selectedProgramIds.includes(program.id));

    for (const program of selectedPrograms) {
      await createGoal.mutateAsync({
        category: program.category,
        title: program.title,
        durationDays: program.totalDays,
        isCustom: false,
        isActive: true,
        groupId,
      });
    }

    for (const goal of customGoals) {
      await createGoal.mutateAsync({
        category: goal.category,
        title: goal.title,
        durationDays: goal.durationDays,
        isCustom: true,
        isActive: true,
        groupId,
      });
    }
  }

  async function handleCreate() {
    setError(null);
    try {
      const group = await createGroup.mutateAsync(groupName);
      await createStarterGoals(group.id);
      continueOn();
    } catch (submitError) {
      console.warn('Create group failed:', submitError);
      setError(getErrorMessage(submitError, 'Could not create the group.'));
    }
  }

  async function handleJoin() {
    setError(null);
    try {
      await joinGroup.mutateAsync(inviteCode);
      continueOn();
    } catch (submitError) {
      console.warn('Join group failed:', submitError);
      setError(getErrorMessage(submitError, 'Could not join that group.'));
    }
  }

  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.header}>
        <Text style={styles.kicker}>{profile?.onboardingCompleted ? 'Groups' : 'Step 1'}</Text>
        <Text style={styles.title}>{profile?.onboardingCompleted ? 'Create or join another group' : 'Create or join your group'}</Text>
        <Text style={styles.subtitle}>
          Pulse works best with small private groups. Start a new circle for a specific plan, or join with a code
          someone shared with you.
        </Text>
      </View>

      <View style={styles.segmentRow}>
        <Pressable
          onPress={() => selectMode('create')}
          style={[styles.segment, mode === 'create' && styles.segmentActive]}>
          <Text style={[styles.segmentText, mode === 'create' && styles.segmentTextActive]}>Create a group</Text>
        </Pressable>
        <Pressable
          onPress={() => selectMode('join')}
          style={[styles.segment, mode === 'join' && styles.segmentActive]}>
          <Text style={[styles.segmentText, mode === 'join' && styles.segmentTextActive]}>Join with code</Text>
        </Pressable>
      </View>

      {mode === 'create' ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>Group name</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={setGroupName}
            placeholder="e.g. Daily Builders"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={groupName}
          />
          <Text style={styles.hint}>You&apos;ll get an invite code to share right after this. Your other groups stay available.</Text>

          <View style={styles.starterBlock}>
            <View style={styles.starterHeader}>
              <Text style={styles.label}>Initial group goals</Text>
              <Text style={styles.starterMeta}>{starterGoalCount}/{MAX_STARTER_GOALS}</Text>
            </View>
            <Text style={styles.hint}>
              Optional: add preset goals or create your own. More group goals can be added later only by the group creator.
            </Text>
            <View style={styles.customGoalComposer}>
              <TextInput
                onChangeText={setCustomTitle}
                placeholder="Own goal, e.g. No sugar weekdays"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={customTitle}
              />
              <View style={styles.optionRow}>
                {(['fitness', 'learning', 'reading', 'mindset'] as const).map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => setCustomCategory(category)}
                    style={[styles.optionChip, customCategory === category && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, customCategory === category && styles.optionChipTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.optionRow}>
                {[7, 14, 30].map((duration) => (
                  <Pressable
                    key={duration}
                    onPress={() => setCustomDuration(duration as 7 | 14 | 30)}
                    style={[styles.optionChip, customDuration === duration && styles.optionChipActive]}>
                    <Text style={[styles.optionChipText, customDuration === duration && styles.optionChipTextActive]}>
                      {duration} days
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                disabled={!customTitle.trim() || starterGoalCount >= MAX_STARTER_GOALS}
                onPress={addCustomStarterGoal}
                style={[
                  styles.addCustomButton,
                  (!customTitle.trim() || starterGoalCount >= MAX_STARTER_GOALS) && styles.addCustomButtonDisabled,
                ]}>
                <Text style={styles.addCustomButtonText}>Add own goal</Text>
              </Pressable>
            </View>
            {customGoals.length > 0 ? (
              <View style={styles.customGoalList}>
                {customGoals.map((goal) => (
                  <View key={goal.id} style={styles.customGoalItem}>
                    <View style={styles.customGoalTextWrap}>
                      <Text style={styles.customGoalTitle}>{goal.title}</Text>
                      <Text style={styles.customGoalMeta}>
                        {goal.category} • {goal.durationDays} days
                      </Text>
                    </View>
                    <Pressable hitSlop={8} onPress={() => removeCustomStarterGoal(goal.id)}>
                      <Text style={styles.removeCustomGoalText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.programGrid}>
              {starterPrograms.map((program: Program) => {
                const isSelected = selectedProgramIds.includes(program.id);

                return (
                  <Pressable
                    key={program.id}
                    onPress={() => toggleStarterProgram(program.id)}
                    style={({ pressed }) => [
                      styles.programChip,
                      isSelected && styles.programChipActive,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text style={[styles.programTitle, isSelected && styles.programTitleActive]}>{program.title}</Text>
                    <Text style={[styles.programMeta, isSelected && styles.programMetaActive]}>
                      {program.categoryLabel} • {program.totalDays} days
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.formCard}>
          <Text style={styles.label}>Invite code</Text>
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            onChangeText={setInviteCode}
            placeholder="e.g. 4F7K2A"
            placeholderTextColor="#94a3b8"
            style={[styles.input, styles.inputCode]}
            value={inviteCode}
          />
          <Text style={styles.hint}>Ask a group member for their current invite code.</Text>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        disabled={isSubmitting}
        onPress={mode === 'create' ? handleCreate : handleJoin}
        style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}>
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>{mode === 'create' ? 'Create group' : 'Join group'}</Text>
        )}
      </Pressable>

      <Pressable disabled={isSubmitting} onPress={continueOn} style={styles.skipButton}>
        <Text style={styles.skipButtonText}>{profile?.onboardingCompleted ? 'Not now' : 'Skip for now'}</Text>
      </Pressable>
      {profile?.onboardingCompleted ? null : (
        <Text style={styles.skipHint}>You can create or join a group any time from the Group tab.</Text>
      )}
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
  segmentRow: {
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    paddingVertical: 12,
  },
  segmentActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 1,
  },
  segmentText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#102a19',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  starterBlock: {
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    gap: 10,
    marginTop: 6,
    paddingTop: 16,
  },
  starterHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  starterMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  programGrid: {
    gap: 8,
  },
  customGoalComposer: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  optionChipActive: {
    backgroundColor: '#102a19',
  },
  optionChipText: {
    color: '#2f5f3b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  optionChipTextActive: {
    color: '#ffffff',
  },
  addCustomButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addCustomButtonDisabled: {
    opacity: 0.45,
  },
  addCustomButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  customGoalList: {
    gap: 8,
  },
  customGoalItem: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customGoalTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  customGoalTitle: {
    color: '#102a19',
    fontSize: 14,
    fontWeight: '800',
  },
  customGoalMeta: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  removeCustomGoalText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  programChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  programChipActive: {
    backgroundColor: '#102a19',
    borderColor: '#16a34a',
  },
  programTitle: {
    color: '#102a19',
    fontSize: 14,
    fontWeight: '800',
  },
  programTitleActive: {
    color: '#ffffff',
  },
  programMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  programMetaActive: {
    color: '#86efac',
  },
  label: {
    color: '#2f5f3b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#102a19',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputCode: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#16a34a',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  skipHint: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
