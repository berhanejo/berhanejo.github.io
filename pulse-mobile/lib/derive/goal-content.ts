import { categoryOptions, GoalCategory, programsByCategory } from '@/data/mock-data';

export type GoalContent = {
  categoryLabel: string;
  focus: string;
  proofLabel: string;
  proofExamples: string[];
  nextReminder: string;
};

const GENERIC_PROOF_EXAMPLES = ['photo proof', 'screenshot proof', 'progress proof'];

/**
 * Non-custom goals are created from the static catalog with their title copied
 * verbatim, so an exact (category, title) match recovers the catalog's richer
 * copy (focus text, proof examples). Custom goals, or a catalog entry that no
 * longer exists, fall back to generic category-level content.
 */
export function getGoalContent(goal: { category: GoalCategory; title: string; isCustom: boolean }): GoalContent {
  if (!goal.isCustom) {
    const catalogMatch = programsByCategory[goal.category]?.find((entry) => entry.title === goal.title);

    if (catalogMatch) {
      return {
        categoryLabel: catalogMatch.categoryLabel,
        focus: catalogMatch.focus,
        proofLabel: catalogMatch.proofLabel,
        proofExamples: catalogMatch.proofExamples,
        nextReminder: catalogMatch.nextReminder,
      };
    }
  }

  const categoryLabel = categoryOptions.find((option) => option.id === goal.category)?.label ?? goal.category;

  return {
    categoryLabel,
    focus: 'Complete this challenge with one clear daily check-in.',
    proofLabel: 'Proof',
    proofExamples: GENERIC_PROOF_EXAMPLES,
    nextReminder: '20:00',
  };
}
