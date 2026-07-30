import { getGoalContent } from '@/lib/derive/goal-content';
import type { DailyStatus } from '@/lib/derive/streaks';
import type { CheckIn } from '@/lib/queries/check-ins';
import type { Goal } from '@/lib/queries/goals';
import type { GroupMember } from '@/lib/queries/groups';
import type {
  GoalLatestCheckInItem,
  GroupActivityItem,
  GroupChallengeStatusItem,
  OwnActiveGoalStatusItem,
} from '@/lib/session/types';

type ImageResolver = (photoPath: string | null) => string | null;

export function createMemberNameMap(members: GroupMember[], currentUserId: string | undefined) {
  return new Map(members.map((member) => [member.userId, member.userId === currentUserId ? 'You' : member.displayName]));
}

export function createImageResolver(signedUrlByPath: Record<string, string>): ImageResolver {
  return (photoPath: string | null) => {
    if (!photoPath) {
      return null;
    }

    return signedUrlByPath[photoPath] ?? null;
  };
}

export function findCheckInForDate(source: CheckIn[], goalId: string, runNumber: number, dateKey: string) {
  return source.find((entry) => entry.goalId === goalId && entry.runNumber === runNumber && entry.checkInDate === dateKey);
}

export function buildGroupMembers(members: GroupMember[], currentUserId: string | undefined) {
  return members.map((member) => ({
    id: member.userId,
    name: member.userId === currentUserId ? 'You' : member.displayName,
  }));
}

export function buildGroupChallengeStatuses(params: {
  groupGoals: Goal[];
  groupCheckIns: CheckIn[];
  todayDateKey: string;
  memberNameById: Map<string, string>;
  resolveImageUri: ImageResolver;
}): GroupChallengeStatusItem[] {
  return params.groupGoals
    .filter((goal) => goal.isActive)
    .map((goal) => {
      const entry = findCheckInForDate(params.groupCheckIns, goal.id, goal.runNumber, params.todayDateKey);

      return {
        id: `${goal.userId}-${goal.id}-${params.todayDateKey}`,
        userId: goal.userId,
        userName: params.memberNameById.get(goal.userId) ?? 'Member',
        goalId: goal.id,
        goalTitle: goal.title,
        date: params.todayDateKey,
        status: entry ? 'done' : ('pending' as DailyStatus),
        caption: entry?.caption ?? null,
        imageUri: entry ? params.resolveImageUri(entry.photoPath) : null,
        timestampLabel: entry ? 'Today' : null,
      };
    });
}

export function buildOwnActiveGoalStatuses(params: {
  activeGoals: Goal[];
  checkIns: CheckIn[];
  todayDateKey: string;
  resolveImageUri: ImageResolver;
}): OwnActiveGoalStatusItem[] {
  return params.activeGoals.map((goal) => {
    const entry = findCheckInForDate(params.checkIns, goal.id, goal.runNumber, params.todayDateKey);
    const content = getGoalContent(goal);

    return {
      goalId: goal.id,
      title: goal.title,
      categoryLabel: content.categoryLabel,
      status: entry ? 'done' : ('pending' as DailyStatus),
      hasProof: Boolean(entry?.photoPath),
      caption: entry?.caption ?? null,
      imageUri: entry ? params.resolveImageUri(entry.photoPath) : null,
    };
  });
}

export function buildOwnGoalLatestCheckIns(params: {
  activeGoals: Goal[];
  checkIns: CheckIn[];
  resolveImageUri: ImageResolver;
}): GoalLatestCheckInItem[] {
  return params.activeGoals.map((goal) => {
    const relevant = params.checkIns.filter((entry) => entry.goalId === goal.id && entry.runNumber === goal.runNumber);
    const latest = relevant.slice().sort((left, right) => right.checkInDate.localeCompare(left.checkInDate))[0];

    return {
      checkInId: latest?.id ?? null,
      goalId: goal.id,
      caption: latest?.caption ?? null,
      imageUri: latest ? params.resolveImageUri(latest.photoPath) : null,
      date: latest?.checkInDate ?? null,
    };
  });
}

export function buildGroupActivityFeed(params: {
  groupCheckIns: CheckIn[];
  todayDateKey: string;
  memberNameById: Map<string, string>;
  resolveImageUri: ImageResolver;
}): GroupActivityItem[] {
  return params.groupCheckIns
    .slice()
    .sort((left, right) => right.checkInDate.localeCompare(left.checkInDate) || right.id.localeCompare(left.id))
    .map((entry) => {
      const isToday = entry.checkInDate === params.todayDateKey;
      const entryDate = new Date(`${entry.checkInDate}T12:00:00`);

      return {
        id: entry.id,
        userId: entry.userId,
        userName: params.memberNameById.get(entry.userId) ?? 'Member',
        goalId: entry.goalId,
        goalTitle: entry.goalTitle ?? 'Goal',
        caption: entry.caption,
        imageUri: params.resolveImageUri(entry.photoPath) ?? '',
        date: entry.checkInDate,
        timestampLabel: isToday ? 'Today' : entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        status: isToday ? 'done' : 'completed',
        isToday,
      };
    });
}
