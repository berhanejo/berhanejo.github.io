import { formatDateKey } from '@/lib/derive/date';

export type DailyStatus = 'pending' | 'done' | 'missed';

export type GoalStats = {
  elapsedDays: number;
  relevantDays: number;
  completedDays: number;
  missedDays: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  todayStatus: DailyStatus;
  yesterdayStatus: DailyStatus | null;
  recentMissedDays: number;
  hasCheckedInToday: boolean;
};

const EMPTY_STATS: GoalStats = {
  elapsedDays: 0,
  relevantDays: 0,
  completedDays: 0,
  missedDays: 0,
  completionRate: 0,
  currentStreak: 0,
  bestStreak: 0,
  todayStatus: 'pending',
  yesterdayStatus: null,
  recentMissedDays: 0,
  hasCheckedInToday: false,
};

/**
 * Computes streak/completion stats for a single goal's current run.
 * `checkInDates` must already be scoped to this goal's current run_number.
 */
export function computeGoalStats(params: {
  runStartedAt: string | null;
  durationDays: number;
  checkInDates: string[];
  today: Date;
}): GoalStats {
  const { runStartedAt, durationDays, checkInDates, today } = params;

  if (!runStartedAt) {
    return EMPTY_STATS;
  }

  const checkInDateSet = new Set(checkInDates);
  const todayDateKey = formatDateKey(today);
  const startDate = new Date(`${runStartedAt}T00:00:00`);
  const elapsedRaw = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const elapsedDays = Math.min(Math.max(elapsedRaw, 0), durationDays);

  const timelineStatuses: DailyStatus[] = Array.from({ length: elapsedDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const dateKey = formatDateKey(date);
    const hasCheckIn = checkInDateSet.has(dateKey);

    if (dateKey === todayDateKey) {
      return hasCheckIn ? 'done' : 'pending';
    }

    return hasCheckIn ? 'done' : 'missed';
  });

  const relevantTimelineStatuses = timelineStatuses.filter(
    (status, index) => !(index === timelineStatuses.length - 1 && status === 'pending')
  );
  const completedDays = relevantTimelineStatuses.filter((status) => status === 'done').length;
  const missedDays = relevantTimelineStatuses.filter((status) => status === 'missed').length;
  const relevantDays = relevantTimelineStatuses.length;
  const completionRate = relevantDays > 0 ? Math.round((completedDays / relevantDays) * 100) : 0;
  const yesterdayStatus = timelineStatuses.length > 1 ? timelineStatuses[timelineStatuses.length - 2] : null;
  const lastSevenStatuses = timelineStatuses.slice(-7);
  const recentMissedDays = lastSevenStatuses.filter((status) => status === 'missed').length;

  let currentStreak = 0;
  for (let index = timelineStatuses.length - 1; index >= 0; index -= 1) {
    const status = timelineStatuses[index];

    if (index === timelineStatuses.length - 1 && status === 'pending') {
      continue;
    }

    if (status === 'done') {
      currentStreak += 1;
      continue;
    }

    break;
  }

  let bestStreak = 0;
  let streakRun = 0;
  for (const status of timelineStatuses) {
    if (status === 'done') {
      streakRun += 1;
      bestStreak = Math.max(bestStreak, streakRun);
    } else {
      streakRun = 0;
    }
  }

  return {
    elapsedDays,
    relevantDays,
    completedDays,
    missedDays,
    completionRate,
    currentStreak,
    bestStreak,
    todayStatus: checkInDateSet.has(todayDateKey) ? 'done' : 'pending',
    yesterdayStatus,
    recentMissedDays,
    hasCheckedInToday: checkInDateSet.has(todayDateKey),
  };
}
