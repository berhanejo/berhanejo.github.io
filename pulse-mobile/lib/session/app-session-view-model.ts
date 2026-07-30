import type { User } from '@supabase/supabase-js';

import { checkInByCategory } from '@/data/mock-data';
import { formatDateKey } from '@/lib/derive/date';
import { computeCoachMessage } from '@/lib/derive/coach-message';
import { computeGoalStats } from '@/lib/derive/streaks';
import { computeWeekView } from '@/lib/derive/week-view';
import type { CheckIn, CheckInEvent } from '@/lib/queries/check-ins';
import type { Goal } from '@/lib/queries/goals';
import type { GroupMember, MyGroup } from '@/lib/queries/groups';
import {
  buildGroupActivityFeed,
  buildGroupChallengeStatuses,
  buildGroupMembers,
  buildOwnActiveGoalStatuses,
  buildOwnGoalLatestCheckIns,
  createImageResolver,
  createMemberNameMap,
  findCheckInForDate,
} from '@/lib/session/check-in-presenters';
import {
  enrichGoal,
  getActiveFocusAreas,
  getActiveGoals,
  getAvailableCatalogPrograms,
  getNonArchivedGoals,
  NO_GOALS_COACH_MESSAGE,
} from '@/lib/session/goal-presenters';
import type { AppSessionViewModel, HistoryItem, TodayCheckInPrompt } from '@/lib/session/types';

export type BuildAppSessionViewModelParams = {
  user: User | null;
  userId: string | undefined;
  groups: MyGroup[];
  activeGroupId: string | null;
  goals: Goal[];
  checkIns: CheckIn[];
  checkInEvents: CheckInEvent[];
  groupMembersRaw: GroupMember[];
  groupGoals: Goal[];
  groupCheckIns: CheckIn[];
  signedUrlByPath: Record<string, string>;
  maxActivePrograms: number;
  primaryGoalId: string | null;
  today?: Date;
};

function formatHistoryDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildHistoryItems(checkIns: CheckIn[], events: CheckInEvent[]): HistoryItem[] {
  const eventItems = events.map((event) => ({
    id: `event-${event.id}`,
    type: event.eventType,
    title:
      event.eventType === 'created'
        ? 'Check-in posted'
        : event.eventType === 'updated'
          ? 'Check-in edited'
          : 'Check-in deleted',
    caption: event.caption,
    dateLabel: formatHistoryDate(event.createdAt),
    timestamp: event.createdAt,
  }));

  const checkInItems = checkIns.map((entry) => ({
    id: `check-in-${entry.id}`,
    type: 'check_in' as const,
    title: entry.goalTitle ? `${entry.goalTitle} completed` : 'Check-in completed',
    caption: entry.caption,
    dateLabel: formatHistoryDate(entry.createdAt),
    timestamp: entry.createdAt,
  }));

  return [...eventItems, ...checkInItems]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 80);
}

function getUserDisplayName(user: User): string {
  const displayName = user.user_metadata?.display_name;

  return typeof displayName === 'string' && displayName.trim() ? displayName : user.email ?? 'You';
}

export function buildAppSessionViewModel(params: BuildAppSessionViewModelParams): AppSessionViewModel {
  const today = params.today ?? new Date();
  const todayDateKey = formatDateKey(today);
  const activeGroup = params.activeGroupId
    ? params.groups.find((group) => group.id === params.activeGroupId) ?? params.groups[0] ?? null
    : null;
  const activeGroupId = activeGroup?.id ?? null;

  const nonArchivedGoals = getNonArchivedGoals(params.goals);
  const activeGoals = getActiveGoals(params.goals);
  const primaryGoal = activeGoals.find((goal) => goal.id === params.primaryGoalId) ?? activeGoals[0] ?? null;

  const currentUser = params.user ? { id: params.user.id, name: getUserDisplayName(params.user) } : null;
  const memberNameById = createMemberNameMap(params.groupMembersRaw, params.userId);
  const resolveImageUri = createImageResolver(params.signedUrlByPath);

  const ownActiveGoalStatuses = buildOwnActiveGoalStatuses({
    activeGoals,
    checkIns: params.checkIns,
    todayDateKey,
    resolveImageUri,
  });
  const groupMembers = activeGroup
    ? buildGroupMembers(params.groupMembersRaw, params.userId)
    : currentUser
      ? [{ id: currentUser.id, name: 'You' }]
      : [];
  const todayChallengeStatuses = activeGroup
    ? buildGroupChallengeStatuses({
        groupGoals: params.groupGoals,
        groupCheckIns: params.groupCheckIns,
        todayDateKey,
        memberNameById,
        resolveImageUri,
      })
    : ownActiveGoalStatuses.map((item) => ({
        id: `private-${item.goalId}-${todayDateKey}`,
        userId: currentUser?.id ?? 'private',
        userName: 'You',
        goalId: item.goalId,
        goalTitle: item.title,
        date: todayDateKey,
        status: item.status,
        caption: item.caption,
        imageUri: item.imageUri,
        timestampLabel: item.status === 'done' ? 'Today' : null,
      }));
  const ownGoalLatestCheckIns = buildOwnGoalLatestCheckIns({
    activeGoals,
    checkIns: params.checkIns,
    resolveImageUri,
  });
  const groupActivityFeed = buildGroupActivityFeed({
    groupCheckIns: activeGroup ? params.groupCheckIns : params.checkIns.filter((entry) => entry.groupId === null),
    todayDateKey,
    memberNameById: activeGroup ? memberNameById : new Map(currentUser ? [[currentUser.id, 'You']] : []),
    resolveImageUri,
  });

  const currentProgram = primaryGoal ? enrichGoal(primaryGoal) : null;
  const selectedPrograms = nonArchivedGoals.map(enrichGoal);
  const activePrograms = activeGoals.map(enrichGoal);
  const availablePrograms = getAvailableCatalogPrograms(params.goals);
  const activeFocusAreas = getActiveFocusAreas(activeGoals, nonArchivedGoals);

  const totalActiveGoals = activeGoals.length;
  const completedGoalsToday = activeGoals.filter((goal) =>
    Boolean(findCheckInForDate(params.checkIns, goal.id, goal.runNumber, todayDateKey))
  ).length;
  const completionPercentToday =
    totalActiveGoals > 0 ? Math.round((completedGoalsToday / totalActiveGoals) * 100) : 0;
  const todayOverallStatus = totalActiveGoals > 0 && completedGoalsToday === totalActiveGoals ? 'done' : 'pending';

  const primaryGoalCheckInDates = primaryGoal
    ? params.checkIns
        .filter((entry) => entry.goalId === primaryGoal.id && entry.runNumber === primaryGoal.runNumber)
        .map((entry) => entry.checkInDate)
    : [];
  const primaryGoalStats = primaryGoal
    ? computeGoalStats({
        runStartedAt: primaryGoal.runStartedAt,
        durationDays: primaryGoal.durationDays,
        checkInDates: primaryGoalCheckInDates,
        today,
      })
    : null;

  const todayCheckIn: TodayCheckInPrompt | null = currentProgram
    ? {
        ...checkInByCategory[currentProgram.category],
        status: primaryGoalStats?.hasCheckedInToday ? 'done' : 'pending',
      }
    : null;

  const latestPrimaryCheckIn = ownGoalLatestCheckIns.find((entry) => entry.goalId === primaryGoal?.id) ?? null;

  const currentWeekCheckIns = computeWeekView({
    today,
    totalActiveGoals,
    isDateFullyDone: (dateKey) =>
      activeGoals.length > 0 &&
      activeGoals.every((goal) => Boolean(findCheckInForDate(params.checkIns, goal.id, goal.runNumber, dateKey))),
  });

  const aiCoachMessage =
    currentProgram && primaryGoalStats
      ? computeCoachMessage({
          categoryLabel: currentProgram.categoryLabel,
          goalTitle: currentProgram.title,
          todayStatus: primaryGoalStats.todayStatus,
          currentStreak: primaryGoalStats.currentStreak,
          yesterdayStatus: primaryGoalStats.yesterdayStatus,
          recentMissedDays: primaryGoalStats.recentMissedDays,
          completionRate: primaryGoalStats.completionRate,
        })
      : NO_GOALS_COACH_MESSAGE;

  return {
    currentUser,
    groups: params.groups,
    activeGroupId,
    activeGroup,
    groupSummaries: params.groups.map((group) => ({
      id: group.id,
      name: group.name,
      role: group.role,
      isActive: group.id === activeGroupId,
    })),
    groupName: activeGroup?.name ?? 'Private',
    groupMembers,
    todayChallengeStatuses,
    ownActiveGoalStatuses,
    ownGoalLatestCheckIns,
    groupActivityFeed,
    currentProgram,
    selectedPrograms,
    availablePrograms,
    activePrograms,
    activeFocusAreas,
    maxActivePrograms: params.maxActivePrograms,
    todayCheckIn,
    hasCheckedInToday: primaryGoalStats?.hasCheckedInToday ?? false,
    totalActiveGoals,
    completedGoalsToday,
    completionPercentToday,
    todayOverallStatus,
    latestCheckInCaption: latestPrimaryCheckIn?.caption ?? null,
    latestCheckInImageUri: latestPrimaryCheckIn?.imageUri ?? null,
    latestCheckInDate: latestPrimaryCheckIn?.date ?? null,
    currentWeekCheckIns,
    elapsedDays: primaryGoalStats?.elapsedDays ?? 0,
    relevantDays: primaryGoalStats?.relevantDays ?? 0,
    completedDays: primaryGoalStats?.completedDays ?? 0,
    missedDays: primaryGoalStats?.missedDays ?? 0,
    completionRate: primaryGoalStats?.completionRate ?? 0,
    currentStreak: primaryGoalStats?.currentStreak ?? 0,
    bestStreak: primaryGoalStats?.bestStreak ?? 0,
    aiCoachMessage,
    historyItems: buildHistoryItems(params.checkIns, params.checkInEvents),
  };
}
