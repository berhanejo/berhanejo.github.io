import { DailyStatus } from '@/lib/derive/streaks';

export type CoachMessage = {
  type: 'reminder' | 'motivation' | 'streak_praise' | 'reentry' | 'callout';
  title: string;
  body: string;
};

export function computeCoachMessage(params: {
  categoryLabel: string;
  goalTitle: string;
  todayStatus: DailyStatus;
  currentStreak: number;
  yesterdayStatus: DailyStatus | null;
  recentMissedDays: number;
  completionRate: number;
}): CoachMessage {
  const { categoryLabel, goalTitle, todayStatus, currentStreak, yesterdayStatus, recentMissedDays, completionRate } =
    params;

  if (todayStatus === 'done' && currentStreak >= 3) {
    return {
      type: 'streak_praise',
      title: 'Strong streak',
      body: `${currentStreak} days in a row on ${categoryLabel.toLowerCase()}. Protect it tomorrow.`,
    };
  }

  if (yesterdayStatus === 'missed') {
    return {
      type: 'reentry',
      title: 'Reset day',
      body: `Yesterday was missed. One ${categoryLabel.toLowerCase()} check-in today puts you back in rhythm.`,
    };
  }

  if (recentMissedDays >= 2) {
    return {
      type: 'callout',
      title: 'Consistency check',
      body: `${recentMissedDays} missed days this week. Scale today down and finish one clear rep.`,
    };
  }

  if (todayStatus === 'pending' && currentStreak >= 3) {
    return {
      type: 'motivation',
      title: 'Keep the momentum',
      body: `You are on a ${currentStreak}-day streak. Finish today's ${goalTitle.toLowerCase()} session.`,
    };
  }

  if (completionRate >= 75) {
    return {
      type: 'motivation',
      title: 'Solid pace',
      body: `${completionRate}% completion so far. Another done day keeps this program on track.`,
    };
  }

  return {
    type: 'reminder',
    title: 'Today needs one check-in',
    body: `Post one ${categoryLabel.toLowerCase()} proof today to mark the day as done.`,
  };
}
