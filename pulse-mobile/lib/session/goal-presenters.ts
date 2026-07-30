import { programsByCategory } from '@/data/mock-data';
import { getGoalContent } from '@/lib/derive/goal-content';
import type { CoachMessage } from '@/lib/derive/coach-message';
import type { GoalCategory, Program } from '@/data/mock-data';
import type { Goal } from '@/lib/queries/goals';
import type { EnrichedGoal } from '@/lib/session/types';

export const NO_GOALS_COACH_MESSAGE: CoachMessage = {
  type: 'reminder',
  title: 'Add your first goal',
  body: 'Open Goal Management to pick a goal and start your streak.',
};

const ALL_CATALOG_PROGRAMS = Object.values(programsByCategory).flat();

export function getNonArchivedGoals(goals: Goal[]): Goal[] {
  return goals.filter((goal) => !goal.isArchived);
}

export function getActiveGoals(goals: Goal[]): Goal[] {
  return getNonArchivedGoals(goals).filter((goal) => goal.isActive);
}

export function enrichGoal(goal: Goal): EnrichedGoal {
  const content = getGoalContent(goal);

  return {
    id: goal.id,
    groupId: goal.groupId,
    title: goal.title,
    category: goal.category,
    categoryLabel: content.categoryLabel,
    focus: content.focus,
    totalDays: goal.durationDays,
    proofLabel: content.proofLabel,
    proofExamples: content.proofExamples,
    nextReminder: content.nextReminder,
    runNumber: goal.runNumber,
    runStartedAt: goal.runStartedAt,
  };
}

export function getAvailableCatalogPrograms(goals: Goal[]): Program[] {
  const existingGoalKeys = new Set(goals.map((goal) => `${goal.category}:${goal.title}`));

  return ALL_CATALOG_PROGRAMS.filter((program) => !existingGoalKeys.has(`${program.category}:${program.title}`));
}

export function getActiveFocusAreas(activeGoals: Goal[], nonArchivedGoals: Goal[]): GoalCategory[] {
  return activeGoals.length
    ? [...new Set(activeGoals.map((goal) => goal.category))]
    : [...new Set(nonArchivedGoals.map((goal) => goal.category))];
}
