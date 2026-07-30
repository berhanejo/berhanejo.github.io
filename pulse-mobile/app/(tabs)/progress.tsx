import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/progress-ring';
import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';

export default function ProgressScreen() {
  const {
    currentUser,
    currentProgram,
    currentWeekCheckIns,
    ownActiveGoalStatuses,
    totalActiveGoals,
    completedGoalsToday,
    completionPercentToday,
    todayOverallStatus,
    currentStreak,
    bestStreak,
    completionRate,
    completedDays,
    relevantDays,
    missedDays,
    historyItems,
  } =
    useAppSession();
  const weeklyCompleted = currentWeekCheckIns.filter((item) => item.status === 'done').length;
  const weeklyMissed = currentWeekCheckIns.filter((item) => item.status === 'missed').length;
  const weeklyPending = currentWeekCheckIns.filter((item) => item.status === 'pending').length;
  const hasCompletedCheckIns = completedDays > 0;
  const dayStatusLabel =
    todayOverallStatus === 'done' ? 'Done' : todayOverallStatus === 'missed' ? 'Missed' : 'In progress';

  if (!currentProgram) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.kicker}>Progress</Text>
          <Text style={styles.title}>Visible consistency</Text>
          <Text style={styles.subtitle}>Add a goal to start tracking your streak and completion rate.</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No progress yet</Text>
          <Text style={styles.emptyText}>Your streak, weekly activity, and completion pattern will show up after your first goal.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Progress</Text>
        <Text style={styles.title}>Visible consistency</Text>
        <Text style={styles.subtitle}>
          {currentUser?.name ? `${currentUser.name}, ` : ''}track how steadily you are showing up in your{' '}
          {currentProgram.categoryLabel.toLowerCase()} program.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.programLabel}>Active program</Text>
        <Text style={styles.programTitle}>{currentProgram.title}</Text>
        <Text style={styles.programMeta}>{currentProgram.categoryLabel}</Text>
        <Text style={styles.summaryText}>{currentProgram.focus}</Text>

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Program progress</Text>
          <Text style={styles.progressValue}>{completedDays} / {currentProgram.totalDays} completed</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
        </View>
      </View>

      <View style={styles.todayAggregateCard}>
        <View style={styles.todayAggregateMeta}>
          <Text style={styles.metricLabel}>Today Across Active Goals</Text>
          <Text style={styles.todayAggregateTitle}>{dayStatusLabel}</Text>
          <Text style={styles.todayAggregateHint}>
            {completedGoalsToday} / {totalActiveGoals} completed today
          </Text>
        </View>
        <ProgressRing
          progress={completionPercentToday}
          size={92}
          strokeWidth={8}
          centerLabel={completionPercentToday === 100 ? 'Done' : `${completionPercentToday}%`}
          centerSubLabel={`${completedGoalsToday}/${totalActiveGoals}`}
        />
      </View>

      <View style={styles.goalBreakdownCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today by goal</Text>
          <Text style={styles.sectionMeta}>
            {completedGoalsToday}/{totalActiveGoals} done
          </Text>
        </View>
        <View style={styles.goalBreakdownList}>
          {ownActiveGoalStatuses.map((goal) => {
            const isDone = goal.status === 'done';
            const isPending = goal.status === 'pending';

            return (
              <Pressable
                key={goal.goalId}
                onPress={() =>
                  router.push({
                    pathname: '/check-in',
                    params: { goalId: goal.goalId },
                  })
                }
                style={({ pressed }) => [styles.goalBreakdownItem, pressed && styles.buttonPressed]}>
                <View style={styles.goalBreakdownMeta}>
                  <Text style={styles.goalBreakdownTitle}>{goal.title}</Text>
                  <Text style={styles.goalBreakdownCategory}>{goal.categoryLabel}</Text>
                </View>
                <View
                  style={[
                    styles.goalBreakdownBadge,
                    isDone
                      ? styles.goalBreakdownBadgeDone
                      : isPending
                        ? styles.goalBreakdownBadgePending
                        : styles.goalBreakdownBadgeMissed,
                  ]}>
                  <Text
                    style={[
                      styles.goalBreakdownBadgeText,
                      isDone
                        ? styles.goalBreakdownBadgeTextDone
                        : isPending
                          ? styles.goalBreakdownBadgeTextPending
                          : styles.goalBreakdownBadgeTextMissed,
                    ]}>
                    {goal.status}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Current Streak</Text>
          <Text style={styles.metricValue}>{currentStreak}</Text>
          <Text style={styles.metricHint}>days in a row</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Best Streak</Text>
          <Text style={styles.metricValue}>{bestStreak}</Text>
          <Text style={styles.metricHint}>best run so far</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Completion</Text>
          <Text style={styles.metricValue}>{completionRate}%</Text>
          <Text style={styles.metricHint}>
            {completedDays} / {relevantDays} relevant days
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Completed Days</Text>
          <Text style={styles.metricValue}>{completedDays}</Text>
          <Text style={styles.metricHint}>{missedDays} missed</Text>
        </View>
      </View>

      <View style={styles.weekCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <Text style={styles.sectionMeta}>
            {weeklyCompleted} done, {weeklyMissed} missed, {weeklyPending} pending
          </Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          A quick scan of day-level completion across all active goals.
        </Text>
        {hasCompletedCheckIns ? (
          <View style={styles.weekRow}>
            {currentWeekCheckIns.map((item) => (
              <View
                key={item.dateKey}
                style={[
                  styles.dayCard,
                  item.status === 'done'
                    ? styles.dayCardDone
                    : item.status === 'missed'
                      ? styles.dayCardMissed
                      : styles.dayCardPending,
                  item.isToday && styles.dayCardToday,
                ]}>
                <Text
                  style={[
                    styles.dayStatus,
                    item.status === 'done'
                      ? styles.dayStatusDone
                      : item.status === 'missed'
                        ? styles.dayStatusMissed
                        : styles.dayStatusPending,
                  ]}>
                  {item.status}
                </Text>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor:
                        item.status === 'done' ? '#22c55e' : item.status === 'missed' ? '#f97316' : '#94a3b8',
                    },
                  ]}
                />
                <Text numberOfLines={1} style={styles.dayLabel}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No progress yet</Text>
            <Text style={styles.emptyText}>Your streak, weekly activity, and completion pattern will show up after your first check-in.</Text>
          </View>
        )}
      </View>

      <View style={styles.historyCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          <Text style={styles.sectionMeta}>{historyItems.length} events</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Your recent check-ins and edits, newest first.</Text>
        <View style={styles.historyList}>
          {historyItems.slice(0, 12).map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyDot} />
              <View style={styles.historyMeta}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                {item.caption ? <Text style={styles.historyCaption}>{item.caption}</Text> : null}
              </View>
              <Text style={styles.historyDate}>{item.dateLabel}</Text>
            </View>
          ))}
        </View>
      </View>
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
  summaryCard: {
    backgroundColor: '#102a19',
    borderRadius: 28,
    padding: 22,
    gap: 12,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  programLabel: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  programTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  programMeta: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  progressHeader: {
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
    backgroundColor: '#164e2b',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#facc15',
    borderRadius: 999,
    height: '100%',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  todayAggregateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    padding: 18,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  todayAggregateMeta: {
    flex: 1,
    minWidth: 0,
  },
  todayAggregateTitle: {
    color: '#102a19',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.6,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  todayAggregateHint: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    flex: 1,
    gap: 8,
    padding: 18,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  goalBreakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 10,
    padding: 18,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  goalBreakdownList: {
    gap: 8,
  },
  goalBreakdownItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goalBreakdownMeta: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  goalBreakdownTitle: {
    color: '#102a19',
    fontSize: 14,
    fontWeight: '700',
  },
  goalBreakdownCategory: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
  },
  goalBreakdownBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goalBreakdownBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  goalBreakdownBadgePending: {
    backgroundColor: '#fef3c7',
  },
  goalBreakdownBadgeMissed: {
    backgroundColor: '#fee2e2',
  },
  goalBreakdownBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalBreakdownBadgeTextDone: {
    color: '#166534',
  },
  goalBreakdownBadgeTextPending: {
    color: '#92400e',
  },
  goalBreakdownBadgeTextMissed: {
    color: '#991b1b',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    color: '#102a19',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  metricHint: {
    color: '#64748b',
    fontSize: 13,
  },
  weekCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 14,
    padding: 20,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  historyDot: {
    backgroundColor: '#16a34a',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  historyMeta: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    color: '#102a19',
    fontSize: 14,
    fontWeight: '800',
  },
  historyCaption: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  historyDate: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    gap: 6,
    padding: 16,
  },
  emptyTitle: {
    color: '#102a19',
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#102a19',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionSubtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCard: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    gap: 8,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  dayCardDone: {
    backgroundColor: '#dcfce7',
  },
  dayCardMissed: {
    backgroundColor: '#f8fafc',
  },
  dayCardPending: {
    backgroundColor: '#eef2ff',
  },
  dayCardToday: {
    borderColor: '#16a34a',
    borderWidth: 1,
  },
  dayDot: {
    borderRadius: 999,
    height: 20,
    width: 20,
  },
  dayStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayStatusDone: {
    color: '#15803d',
  },
  dayStatusMissed: {
    color: '#64748b',
  },
  dayStatusPending: {
    color: '#2f5f3b',
  },
  dayLabel: {
    color: '#2f5f3b',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
