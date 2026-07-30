import { useCallback, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';

type GoalCardProgram = {
  id: string;
  groupId: string | null;
  title: string;
  categoryLabel: string;
};

function GoalCard({
  program,
  statusLabel,
  primary,
  onSetPrimary,
  onToggleActive,
  onResetProgress,
  onCopyToGroup,
  canSetPrimary,
  canActivateMore,
  maxActivePrograms,
  groupName,
  copyTargets,
}: {
  program: GoalCardProgram;
  statusLabel: 'active' | 'paused';
  primary: boolean;
  onSetPrimary: () => void;
  onToggleActive: () => void;
  onResetProgress: () => void;
  onCopyToGroup: (groupId: string) => void;
  canSetPrimary: boolean;
  canActivateMore: boolean;
  maxActivePrograms: number;
  groupName: string | null;
  copyTargets: { id: string; name: string }[];
}) {
  const isActive = statusLabel === 'active';
  const primaryDisabled = primary || !canSetPrimary;
  const toggleDisabled = !isActive && !canActivateMore;

  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>{program.title}</Text>
        <Text style={[styles.goalState, isActive ? styles.goalStateActive : styles.goalStatePaused]}>
          {primary ? 'Primary' : statusLabel}
        </Text>
      </View>
      <Text style={styles.goalMeta}>{program.categoryLabel} • {groupName ?? 'Private'}</Text>

      <View style={styles.goalActions}>
        <Pressable
          disabled={primaryDisabled}
          onPress={onSetPrimary}
          style={({ pressed }) => [
            styles.goalActionPrimary,
            primaryDisabled && styles.goalActionDisabled,
            pressed && !primaryDisabled && styles.buttonPressed,
          ]}>
          <Text style={styles.goalActionPrimaryText}>{primary ? 'Primary' : 'Set primary'}</Text>
        </Pressable>
        <Pressable
          disabled={toggleDisabled}
          onPress={onToggleActive}
          style={({ pressed }) => [
            styles.goalActionSecondary,
            toggleDisabled && styles.goalActionDisabled,
            pressed && !toggleDisabled && styles.buttonPressed,
          ]}>
          <Text style={styles.goalActionSecondaryText}>{isActive ? 'Pause' : 'Set active'}</Text>
        </Pressable>
        <Pressable
          onPress={onResetProgress}
          style={({ pressed }) => [styles.goalActionDanger, pressed && styles.buttonPressed]}>
          <Text style={styles.goalActionDangerText}>Restart</Text>
        </Pressable>
      </View>

      {!program.groupId && copyTargets.length > 0 ? (
        <View style={styles.copyRow}>
          <Text style={styles.copyLabel}>Copy into group</Text>
          <View style={styles.copyTargets}>
            {copyTargets.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => onCopyToGroup(group.id)}
                style={({ pressed }) => [styles.copyChip, pressed && styles.buttonPressed]}>
                <Text style={styles.copyChipText}>{group.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {!isActive && !canActivateMore ? (
        <Text style={styles.goalHint}>Max {maxActivePrograms} active goals reached. Pause one active goal first.</Text>
      ) : null}
    </View>
  );
}

export default function GoalsScreen() {
  const {
    currentProgram,
    activePrograms,
    selectedPrograms,
    availablePrograms,
    maxActivePrograms,
    setMaxActivePrograms,
    addGoal,
    createCustomChallenge,
    setProgramActive,
    setPrimaryProgram,
    pauseProgram,
    resetGoalProgress,
    groupSummaries,
    copyGoalToGroup,
  } = useAppSession();
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<'fitness' | 'learning' | 'reading' | 'mindset'>('fitness');
  const [customDuration, setCustomDuration] = useState<7 | 14 | 30>(14);
  const [customTargetGroupId, setCustomTargetGroupId] = useState<string | null>(null);

  const activeProgramIds = useMemo(() => new Set(activePrograms.map((program) => program.id)), [activePrograms]);
  const pausedPrograms = useMemo(
    () => selectedPrograms.filter((program) => !activeProgramIds.has(program.id)),
    [activeProgramIds, selectedPrograms]
  );
  const canActivateMore = activePrograms.length < maxActivePrograms;
  const handleBack = useCallback(() => router.back(), []);
  const canCreateCustom = customTitle.trim().length > 0;
  const groupNameById = useMemo(
    () => new Map(groupSummaries.map((group) => [group.id, group.name])),
    [groupSummaries]
  );
  const copyTargets = useMemo(
    () => groupSummaries.filter((group) => group.role === 'owner').map((group) => ({ id: group.id, name: group.name })),
    [groupSummaries]
  );
  const ownedGroupSummaries = useMemo(
    () => groupSummaries.filter((group) => group.role === 'owner'),
    [groupSummaries]
  );
  const targetOptions = useMemo(
    () => [
      { id: 'private', label: 'Private', groupId: null },
      ...ownedGroupSummaries.map((group) => ({ id: group.id, label: group.name, groupId: group.id })),
    ],
    [ownedGroupSummaries]
  );
  const confirmResetGoal = useCallback(
    (program: GoalCardProgram) => {
      Alert.alert(
        'Restart challenge?',
        `This resets "${program.title}" to day 0. Streak and progress stats start over, but your past check-ins for this goal are kept in your history.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restart',
            style: 'destructive',
            onPress: () => resetGoalProgress(program.id),
          },
        ]
      );
    },
    [resetGoalProgress]
  );

  const handleCreateCustom = useCallback(() => {
    if (!canCreateCustom) {
      return;
    }

    createCustomChallenge({
      title: customTitle,
      category: customCategory,
      durationDays: customDuration,
      groupId: customTargetGroupId,
    }).catch((error) => console.warn('Failed to create custom challenge:', error));
    setCustomTitle('');
    setCustomCategory('fitness');
    setCustomDuration(14);
    setCustomTargetGroupId(null);
  }, [canCreateCustom, createCustomChallenge, customCategory, customDuration, customTargetGroupId, customTitle]);

  return (
    <ScreenContainer compactTop>
      <View style={styles.topRow}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.kicker}>Goal Management</Text>
        <Text style={styles.title}>Manage your goals</Text>
        <Text style={styles.subtitle}>
          Simple setup: keep up to {maxActivePrograms} active, pause what you do not need now, and set one as primary.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={[styles.summaryChip, styles.summaryChipPrimary]}>
          <Text style={styles.summaryValue}>{currentProgram?.title ?? 'No primary goal yet'}</Text>
          <Text style={styles.summaryLabel}>Primary</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryCount}>{activePrograms.length}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryCount}>{pausedPrograms.length}</Text>
            <Text style={styles.summaryLabel}>Paused</Text>
          </View>
        </View>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>Active goal limit</Text>
          <View style={styles.limitChips}>
            {[1, 2, 3, 4, 5].map((limit) => (
              <Pressable
                key={limit}
                onPress={() => setMaxActivePrograms(limit)}
                style={[styles.limitChip, maxActivePrograms === limit && styles.limitChipActive]}>
                <Text style={[styles.limitChipText, maxActivePrograms === limit && styles.limitChipTextActive]}>
                  {limit}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active</Text>
      </View>
      {activePrograms.length > 0 ? (
        <View style={styles.list}>
          {activePrograms.map((program) => (
            <GoalCard
              key={program.id}
              program={program}
              statusLabel="active"
              primary={currentProgram?.id === program.id}
              canSetPrimary
              canActivateMore={canActivateMore}
              maxActivePrograms={maxActivePrograms}
              onSetPrimary={() => setPrimaryProgram(program.id)}
              onToggleActive={() => pauseProgram(program.id)}
              onResetProgress={() => confirmResetGoal(program)}
              onCopyToGroup={(groupId) => copyGoalToGroup(program.id, groupId)}
              groupName={program.groupId ? groupNameById.get(program.groupId) ?? 'Group' : null}
              copyTargets={copyTargets}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active goals yet.</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paused</Text>
      </View>
      {pausedPrograms.length > 0 ? (
        <View style={styles.list}>
          {pausedPrograms.map((program) => (
            <GoalCard
              key={program.id}
              program={program}
              statusLabel="paused"
              primary={false}
              canSetPrimary={canActivateMore}
              canActivateMore={canActivateMore}
              maxActivePrograms={maxActivePrograms}
              onSetPrimary={() => setPrimaryProgram(program.id)}
              onToggleActive={() => setProgramActive(program.id)}
              onResetProgress={() => confirmResetGoal(program)}
              onCopyToGroup={(groupId) => copyGoalToGroup(program.id, groupId)}
              groupName={program.groupId ? groupNameById.get(program.groupId) ?? 'Group' : null}
              copyTargets={copyTargets}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No paused goals.</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add New Goal</Text>
      </View>
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>Create Challenge</Text>
        <TextInput
          placeholder="Challenge title"
          placeholderTextColor="#94a3b8"
          value={customTitle}
          onChangeText={setCustomTitle}
          style={styles.input}
        />
        <View style={styles.optionRow}>
          {(['fitness', 'learning', 'reading', 'mindset'] as const).map((category) => (
            <Pressable
              key={category}
              onPress={() => setCustomCategory(category)}
              style={[
                styles.optionChip,
                customCategory === category && styles.optionChipActive,
              ]}>
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
              style={[
                styles.optionChip,
                customDuration === duration && styles.optionChipActive,
              ]}>
              <Text style={[styles.optionChipText, customDuration === duration && styles.optionChipTextActive]}>
                {duration} days
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.targetBlock}>
          <Text style={styles.copyLabel}>Goal location</Text>
          {ownedGroupSummaries.length === 0 ? (
            <Text style={styles.goalHint}>Only group creators can add goals to a group. Your challenge will stay private.</Text>
          ) : null}
          <View style={styles.targetSelector}>
            {targetOptions.map((target) => {
              const isSelected = customTargetGroupId === target.groupId;

              return (
                <Pressable
                  key={target.id}
                  onPress={() => setCustomTargetGroupId(target.groupId)}
                  style={({ pressed }) => [
                    styles.targetChip,
                    isSelected && styles.targetChipActive,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={[styles.targetChipText, isSelected && styles.targetChipTextActive]}>
                    {target.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Pressable
          disabled={!canCreateCustom}
          onPress={handleCreateCustom}
          style={({ pressed }) => [
            styles.goalActionPrimary,
            !canCreateCustom && styles.goalActionDisabled,
            pressed && canCreateCustom && styles.buttonPressed,
          ]}>
          <Text style={styles.goalActionPrimaryText}>Create challenge</Text>
        </Pressable>
      </View>

      {availablePrograms.length > 0 ? (
        <View style={styles.list}>
          {availablePrograms.map((program) => (
            <View key={program.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{program.title}</Text>
                <Text style={[styles.goalState, styles.goalStatePaused]}>Available</Text>
              </View>
              <Text style={styles.goalMeta}>{program.categoryLabel}</Text>
              <View style={styles.addTargetRow}>
                <Pressable
                  onPress={() => addGoal(program, null).catch((error) => console.warn('Failed to add goal:', error))}
                  style={({ pressed }) => [styles.goalActionPrimary, pressed && styles.buttonPressed]}>
                  <Text style={styles.goalActionPrimaryText}>Add private</Text>
                </Pressable>
                {groupSummaries.map((group) => (
                  group.role === 'owner' ? (
                    <Pressable
                      key={group.id}
                      onPress={() =>
                        addGoal(program, group.id).catch((error) => console.warn('Failed to add group goal:', error))
                      }
                      style={({ pressed }) => [styles.goalActionSecondary, pressed && styles.buttonPressed]}>
                      <Text style={styles.goalActionSecondaryText}>{group.name}</Text>
                    </Pressable>
                  ) : null
                ))}
              </View>
              {ownedGroupSummaries.length === 0 ? (
                <Text style={styles.goalHint}>Group goals can only be added by the group creator.</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No additional goals available right now.</Text>
        </View>
      )}
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
    color: '#164e2b',
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 12,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryChip: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flex: 1,
    gap: 4,
    padding: 14,
  },
  summaryChipPrimary: {
    backgroundColor: '#f0fdf4',
  },
  summaryValue: {
    color: '#102a19',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCount: {
    color: '#102a19',
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  limitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  limitLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  limitChips: {
    flexDirection: 'row',
    gap: 6,
  },
  limitChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  limitChipActive: {
    backgroundColor: '#16a34a',
  },
  limitChipText: {
    color: '#2f5f3b',
    fontSize: 12,
    fontWeight: '700',
  },
  limitChipTextActive: {
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#102a19',
    fontSize: 22,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 10,
    padding: 18,
  },
  goalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  goalTitle: {
    color: '#102a19',
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  goalState: {
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  goalStateActive: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  goalStatePaused: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  goalMeta: {
    color: '#64748b',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#102a19',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    backgroundColor: '#16a34a',
  },
  optionChipText: {
    color: '#2f5f3b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  optionChipTextActive: {
    color: '#ffffff',
  },
  goalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addTargetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalActionPrimary: {
    backgroundColor: '#16a34a',
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
    color: '#102a19',
    fontSize: 13,
    fontWeight: '700',
  },
  goalActionDanger: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalActionDangerText: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '700',
  },
  goalActionDisabled: {
    opacity: 0.45,
  },
  goalHint: {
    color: '#64748b',
    fontSize: 12,
  },
  copyRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    gap: 8,
    padding: 12,
  },
  copyLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  copyTargets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    gap: 8,
    padding: 12,
  },
  targetSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  targetChipActive: {
    backgroundColor: '#102a19',
  },
  targetChipText: {
    color: '#2f5f3b',
    fontSize: 12,
    fontWeight: '800',
  },
  targetChipTextActive: {
    color: '#ffffff',
  },
  copyChip: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyChipText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
