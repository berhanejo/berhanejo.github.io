import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/progress-ring';
import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';

export default function HomeScreen() {
  const {
    currentUser,
    todayChallengeStatuses,
    ownActiveGoalStatuses,
    currentProgram,
    todayCheckIn,
    hasCheckedInToday,
    totalActiveGoals,
    completedGoalsToday,
    completionPercentToday,
    todayOverallStatus,
    completedDays,
    currentStreak,
    bestStreak,
    completionRate,
    aiCoachMessage,
    latestCheckInCaption,
    latestCheckInDate,
    latestCheckInImageUri,
  } = useAppSession();
  const doneCount = todayChallengeStatuses.filter((item) => item.status === 'done').length;
  const pendingCount = todayChallengeStatuses.filter((item) => item.status === 'pending').length;
  const missedCount = todayChallengeStatuses.filter((item) => item.status === 'missed').length;
  const completionWidth = `${completionRate}%` as `${number}%`;
  const primaryGoalStatus =
    ownActiveGoalStatuses.find((item) => item.goalId === currentProgram.id) ??
    ownActiveGoalStatuses[0] ??
    null;
  const secondaryGoalStatuses = ownActiveGoalStatuses.filter((item) => item.goalId !== currentProgram.id);
  const firstName = currentUser?.name.split(' ')[0] ?? 'there';
  const latestCheckInLabel = latestCheckInDate
    ? new Date(`${latestCheckInDate}T12:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const dayStatusTitle =
    todayOverallStatus === 'done' ? 'Done' : todayOverallStatus === 'missed' ? 'Missed' : 'In progress';
  const dayRingLabel = completionPercentToday === 100 ? 'Done' : `${completionPercentToday}%`;
  const dayRingSubLabel =
    completionPercentToday === 100 ? `${completedGoalsToday}/${totalActiveGoals}` : `${completedGoalsToday}/${totalActiveGoals}`;
  const pendingGoals = ownActiveGoalStatuses.filter((goal) => goal.status === 'pending');

  function openPrimaryCheckIn() {
    if (!primaryGoalStatus) {
      router.push('/check-in');
      return;
    }

    router.push({
      pathname: '/check-in',
      params: { goalId: primaryGoalStatus.goalId },
    });
  }

  function openGoalCheckIn(goalId: string) {
    router.push({
      pathname: '/check-in',
      params: { goalId },
    });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening, {firstName}</Text>
          <Text style={styles.headerCaption}>Stay consistent today. Your group is already moving.</Text>
        </View>
        <View style={styles.dayPill}>
          <Text style={styles.dayPillText}>Today {completedGoalsToday}/{totalActiveGoals}</Text>
        </View>
      </View>

      <Pressable onPress={openPrimaryCheckIn} style={({ pressed }) => [styles.programCard, pressed && styles.buttonPressed]}>
        <Text style={styles.programEyebrow}>Primary Program</Text>
        <Text style={styles.programTitle}>{currentProgram.title}</Text>
        <Text style={styles.programCategory}>{currentProgram.categoryLabel}</Text>
        <Text style={styles.programSubtitle}>{currentProgram.focus}</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Program progress</Text>
          <Text style={styles.progressValue}>{completedDays} / {currentProgram.totalDays}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: completionWidth }]} />
        </View>
        {secondaryGoalStatuses.length > 0 ? (
          <View style={styles.secondaryGoalsRow}>
            <Text style={styles.secondaryGoalsLabel}>Also active</Text>
            <View style={styles.secondaryGoalsChips}>
              {secondaryGoalStatuses.map((goal) => (
                <Pressable key={goal.goalId} onPress={() => openGoalCheckIn(goal.goalId)} style={styles.secondaryGoalChip}>
                  <Text style={styles.secondaryGoalChipText}>{goal.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.todayCard}>
        <View style={styles.todayTopRow}>
          <View style={styles.todayTopMeta}>
            <Text style={styles.cardLabel}>Today&apos;s Status</Text>
            <Text style={styles.todayStatus}>{dayStatusTitle}</Text>
            <Text style={styles.todayStatusMeta}>
              {completedGoalsToday} of {totalActiveGoals} active goals completed.
            </Text>
          </View>
          <ProgressRing
            progress={completionPercentToday}
            size={92}
            strokeWidth={8}
            centerLabel={dayRingLabel}
            centerSubLabel={dayRingSubLabel}
          />
        </View>
        <Text style={styles.reminderText}>Reminder {currentProgram.nextReminder}</Text>
        <Text style={styles.todayPrompt}>{todayCheckIn.prompt}</Text>

        <Pressable
          onPress={openPrimaryCheckIn}
          style={({ pressed }) => [
            styles.checkInButton,
            hasCheckedInToday && styles.checkInButtonDone,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.checkInButtonText}>
            {hasCheckedInToday ? 'Primary goal complete' : 'Post check-in for primary goal'}
          </Text>
          <Text style={styles.checkInButtonHint}>
            {hasCheckedInToday
              ? 'Great work. Your primary challenge is marked as done.'
              : 'Open check-in and submit proof for your primary challenge.'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.goalChecklistCard}>
        <View style={styles.goalChecklistHeader}>
          <Text style={styles.secondaryStatusTitle}>Today&apos;s goal checklist</Text>
          <Text style={styles.goalChecklistMeta}>
            {completedGoalsToday}/{totalActiveGoals} done
          </Text>
        </View>
        <View style={styles.goalChecklistList}>
          {ownActiveGoalStatuses.map((goal) => {
            const isDone = goal.status === 'done';
            const isPending = goal.status === 'pending';

            return (
              <Pressable
                key={goal.goalId}
                onPress={() => openGoalCheckIn(goal.goalId)}
                style={({ pressed }) => [styles.goalChecklistItem, pressed && styles.buttonPressed]}>
                <View style={[styles.goalChecklistDot, isDone && styles.goalChecklistDotDone, isPending && styles.goalChecklistDotPending]}>
                  <MaterialIcons
                    name={isDone ? 'check' : isPending ? 'schedule' : 'close'}
                    size={12}
                    color={isDone ? '#166534' : isPending ? '#92400e' : '#991b1b'}
                  />
                </View>
                <View style={styles.goalChecklistMetaWrap}>
                  <Text style={styles.goalChecklistTitle}>{goal.title}</Text>
                  <Text style={styles.goalChecklistCategory}>{goal.categoryLabel}</Text>
                </View>
                <View
                  style={[
                    styles.goalChecklistBadge,
                    isDone ? styles.goalChecklistBadgeDone : isPending ? styles.goalChecklistBadgePending : styles.goalChecklistBadgeMissed,
                  ]}>
                  <Text
                    style={[
                      styles.goalChecklistBadgeText,
                      isDone
                        ? styles.goalChecklistBadgeTextDone
                        : isPending
                          ? styles.goalChecklistBadgeTextPending
                          : styles.goalChecklistBadgeTextMissed,
                    ]}>
                    {goal.status}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        {pendingGoals.length > 0 ? (
          <Text style={styles.goalChecklistHint}>Tap any pending goal to open check-in directly.</Text>
        ) : null}
      </View>

      {secondaryGoalStatuses.length > 0 ? (
        <View style={styles.secondaryStatusCard}>
          <Text style={styles.secondaryStatusTitle}>Other active challenges</Text>
          <Text style={styles.secondaryStatusSubtitle}>Each challenge tracks its own daily status.</Text>
          <View style={styles.secondaryStatusList}>
            {secondaryGoalStatuses.map((goal) => (
              <Pressable
                key={goal.goalId}
                onPress={() => openGoalCheckIn(goal.goalId)}
                style={({ pressed }) => [
                  styles.secondaryStatusItem,
                  pressed && styles.buttonPressed,
                ]}>
                <View style={styles.secondaryStatusMeta}>
                  <Text style={styles.secondaryStatusGoal}>{goal.title}</Text>
                  <Text style={styles.secondaryStatusCategory}>{goal.categoryLabel}</Text>
                </View>
                <View style={styles.secondaryStatusRight}>
                  <Text style={styles.secondaryStatusLabel}>{goal.status}</Text>
                  {goal.status === 'pending' ? (
                    <Pressable onPress={() => openGoalCheckIn(goal.goalId)} style={styles.secondaryStatusButton}>
                      <Text style={styles.secondaryStatusButtonText}>Check in</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {latestCheckInCaption || latestCheckInImageUri ? (
        <View style={styles.latestCard}>
          <View style={styles.latestHeader}>
            <Text style={styles.cardLabel}>Last Check-in</Text>
            {latestCheckInLabel ? <Text style={styles.latestMeta}>{latestCheckInLabel}</Text> : null}
          </View>
          {latestCheckInImageUri ? <Image source={{ uri: latestCheckInImageUri }} style={styles.latestImage} /> : null}
          {latestCheckInCaption ? <Text style={styles.latestCaption}>{latestCheckInCaption}</Text> : null}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.cardLabel}>Last Check-in</Text>
          <Text style={styles.emptyTitle}>No check-ins yet</Text>
          <Text style={styles.emptyText}>Your latest post will appear here after your first check-in.</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Streak</Text>
          <Text style={styles.statValue}>{currentStreak} days</Text>
          <Text style={styles.statHint}>Best: {bestStreak} days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.cardLabel}>Completion Rate</Text>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statHint}>Strong consistency so far.</Text>
        </View>
      </View>

      <View style={styles.coachCard}>
        <Text style={styles.cardLabel}>AI Coach</Text>
        <Text style={styles.coachTitle}>{aiCoachMessage.title}</Text>
        <Text style={styles.coachText}>{aiCoachMessage.body}</Text>
      </View>

      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>Group Status</Text>
          <Text style={styles.groupMeta}>{currentUser?.groupName ?? 'Your Group'}</Text>
        </View>
        <Text style={styles.groupSummary}>
          {doneCount} done, {pendingCount} pending, {missedCount} missed across active challenges.
        </Text>
        <View style={styles.challengeStatusList}>
          {todayChallengeStatuses.slice(0, 6).map((item) => (
            <View key={item.id} style={styles.challengeStatusItem}>
              <View
                style={[
                  styles.challengeStatusDot,
                  item.status === 'done'
                    ? styles.statusDone
                    : item.status === 'pending'
                      ? styles.statusPending
                      : styles.statusMissed,
                ]}
              />
              <View style={styles.challengeStatusMeta}>
                <Text style={styles.challengeStatusUser}>{item.userName}</Text>
                <Text style={styles.challengeStatusGoal}>{item.goalTitle}</Text>
              </View>
              <Text style={styles.challengeStatusLabel}>{item.status}</Text>
            </View>
          ))}
        </View>
        {todayChallengeStatuses.length > 6 ? (
          <Text style={styles.challengeStatusMore}>+{todayChallengeStatuses.length - 6} more challenge statuses</Text>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    gap: 14,
  },
  greeting: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  headerCaption: {
    color: '#64748b',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  dayPill: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dayPillText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  programCard: {
    backgroundColor: '#0f172a',
    borderRadius: 28,
    padding: 22,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 3,
  },
  programEyebrow: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  programTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  programCategory: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '700',
  },
  programSubtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  progressValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#38bdf8',
    borderRadius: 999,
    height: '100%',
  },
  todayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  secondaryGoalsRow: {
    gap: 10,
    marginTop: 4,
  },
  secondaryGoalsLabel: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryGoalsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryGoalChip: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  secondaryGoalChipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  todayTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  todayTopMeta: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  todayStatus: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  todayStatusMeta: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  reminderText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  todayPrompt: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  checkInButton: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  checkInButtonDone: {
    backgroundColor: '#15803d',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  checkInButtonHint: {
    color: '#dbeafe',
    fontSize: 13,
    marginTop: 4,
  },
  secondaryStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  goalChecklistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  goalChecklistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalChecklistMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalChecklistList: {
    gap: 8,
  },
  goalChecklistItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalChecklistDot: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  goalChecklistDotDone: {
    backgroundColor: '#dcfce7',
  },
  goalChecklistDotPending: {
    backgroundColor: '#fef3c7',
  },
  goalChecklistMetaWrap: {
    flex: 1,
    minWidth: 0,
  },
  goalChecklistTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  goalChecklistCategory: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
  },
  goalChecklistBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goalChecklistBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  goalChecklistBadgePending: {
    backgroundColor: '#fef3c7',
  },
  goalChecklistBadgeMissed: {
    backgroundColor: '#fee2e2',
  },
  goalChecklistBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalChecklistBadgeTextDone: {
    color: '#166534',
  },
  goalChecklistBadgeTextPending: {
    color: '#92400e',
  },
  goalChecklistBadgeTextMissed: {
    color: '#991b1b',
  },
  goalChecklistHint: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryStatusTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryStatusSubtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryStatusList: {
    gap: 10,
  },
  secondaryStatusItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryStatusMeta: {
    flex: 1,
    minWidth: 0,
  },
  secondaryStatusGoal: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryStatusCategory: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
  },
  secondaryStatusRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  secondaryStatusLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  secondaryStatusButton: {
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryStatusButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  latestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  latestHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  latestMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  latestImage: {
    borderRadius: 18,
    height: 180,
    width: '100%',
  },
  latestCaption: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
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
  statValue: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statHint: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  coachCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  coachTitle: {
    color: '#0f172a',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  coachText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
  },
  groupMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  groupSummary: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  challengeStatusList: {
    gap: 10,
  },
  challengeStatusItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  challengeStatusDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  challengeStatusMeta: {
    flex: 1,
    minWidth: 0,
  },
  challengeStatusUser: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  challengeStatusGoal: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
  },
  challengeStatusLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  challengeStatusMore: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  statusDone: {
    backgroundColor: '#22c55e',
  },
  statusPending: {
    backgroundColor: '#f59e0b',
  },
  statusMissed: {
    backgroundColor: '#ef4444',
  },
});
