import type { GoalCategory, Program } from '@/data/mock-data';
import type { CoachMessage } from '@/lib/derive/coach-message';
import type { DailyStatus } from '@/lib/derive/streaks';
import type { CheckInEvent } from '@/lib/queries/check-ins';
import type { MyGroup } from '@/lib/queries/groups';
import type { WeekDayItem } from '@/lib/derive/week-view';

export type SessionUser = {
  id: string;
  name: string;
};

export type EnrichedGoal = {
  id: string;
  groupId: string | null;
  title: string;
  category: GoalCategory;
  categoryLabel: string;
  focus: string;
  totalDays: number;
  proofLabel: string;
  proofExamples: string[];
  nextReminder: string;
  runNumber: number;
  runStartedAt: string | null;
};

export type TodayCheckInPrompt = {
  status: DailyStatus;
  prompt: string;
  instructions: string;
  captionPlaceholder: string;
  ctaLabel: string;
};

export type GroupChallengeStatusItem = {
  id: string;
  userId: string;
  userName: string;
  goalId: string;
  goalTitle: string;
  date: string;
  status: DailyStatus;
  caption: string | null;
  imageUri: string | null;
  timestampLabel: string | null;
};

export type GroupActivityItem = {
  id: string;
  userId: string;
  userName: string;
  goalId: string;
  goalTitle: string;
  caption: string;
  imageUri: string;
  date: string;
  timestampLabel: string;
  status: 'done' | 'completed';
  isToday: boolean;
};

export type OwnActiveGoalStatusItem = {
  goalId: string;
  title: string;
  categoryLabel: string;
  status: DailyStatus;
  hasProof: boolean;
  caption: string | null;
  imageUri: string | null;
};

export type GoalLatestCheckInItem = {
  checkInId: string | null;
  goalId: string;
  caption: string | null;
  imageUri: string | null;
  date: string | null;
};

export type GroupSummaryItem = {
  id: string;
  name: string;
  role: 'owner' | 'member';
  isActive: boolean;
};

export type HistoryItem = {
  id: string;
  type: CheckInEvent['eventType'] | 'check_in';
  title: string;
  caption: string | null;
  dateLabel: string;
  timestamp: string;
};

export type CreateCustomChallengeInput = {
  title: string;
  category: GoalCategory;
  durationDays: 7 | 14 | 30;
  groupId?: string | null;
};

export type AppSessionViewModel = {
  currentUser: SessionUser | null;
  groups: MyGroup[];
  activeGroupId: string | null;
  activeGroup: MyGroup | null;
  groupSummaries: GroupSummaryItem[];
  groupName: string | null;
  groupMembers: { id: string; name: string }[];
  todayChallengeStatuses: GroupChallengeStatusItem[];
  ownActiveGoalStatuses: OwnActiveGoalStatusItem[];
  ownGoalLatestCheckIns: GoalLatestCheckInItem[];
  groupActivityFeed: GroupActivityItem[];
  currentProgram: EnrichedGoal | null;
  selectedPrograms: EnrichedGoal[];
  availablePrograms: Program[];
  activePrograms: EnrichedGoal[];
  activeFocusAreas: GoalCategory[];
  maxActivePrograms: number;
  todayCheckIn: TodayCheckInPrompt | null;
  hasCheckedInToday: boolean;
  totalActiveGoals: number;
  completedGoalsToday: number;
  completionPercentToday: number;
  todayOverallStatus: DailyStatus;
  latestCheckInCaption: string | null;
  latestCheckInImageUri: string | null;
  latestCheckInDate: string | null;
  currentWeekCheckIns: WeekDayItem[];
  elapsedDays: number;
  relevantDays: number;
  completedDays: number;
  missedDays: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  aiCoachMessage: CoachMessage;
  historyItems: HistoryItem[];
};

export type AppSessionActions = {
  setActiveGroup: (groupId: string | null) => void;
  setMaxActivePrograms: (nextMax: number) => void;
  addGoal: (program: Program, groupId?: string | null) => Promise<void>;
  createCustomChallenge: (input: CreateCustomChallengeInput) => Promise<void>;
  setProgramActive: (goalId: string) => void;
  setPrimaryProgram: (goalId: string) => void;
  pauseProgram: (goalId: string) => void;
  resetGoalProgress: (goalId: string) => void;
  submitTodayCheckIn: (goalId: string, caption: string, imageUri: string, groupId?: string | null) => Promise<void>;
  updateCheckIn: (checkInId: string, caption: string) => Promise<void>;
  deleteCheckIn: (checkInId: string) => Promise<void>;
  updateGoal: (input: { goalId: string; title?: string; durationDays?: number; isActive?: boolean; groupId?: string | null }) => Promise<void>;
  copyGoalToGroup: (goalId: string, groupId: string) => Promise<void>;
};

export type AppSessionContextValue = AppSessionViewModel & AppSessionActions;
