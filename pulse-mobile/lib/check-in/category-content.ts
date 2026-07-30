import type { GoalCategory } from '@/data/mock-data';

type CheckInCategoryContent = {
  icon: 'directions-run' | 'school' | 'menu-book' | 'self-improvement';
  proofTitle: string;
  proofDescription: string;
  captionTitle: string;
  captionHint: string;
};

const CATEGORY_CONTENT: Record<GoalCategory, CheckInCategoryContent> = {
  fitness: {
    icon: 'directions-run',
    proofTitle: 'Show today’s movement proof',
    proofDescription: 'Upload something that clearly shows you completed the session or movement goal.',
    captionTitle: 'Session note',
    captionHint: 'Add a short note about the session, effort, or what you completed.',
  },
  learning: {
    icon: 'school',
    proofTitle: 'Show today’s learning proof',
    proofDescription: 'Upload something that clearly shows you completed the study block or lesson.',
    captionTitle: 'Learning note',
    captionHint: 'Add a short note about what you learned, finished, or reviewed.',
  },
  reading: {
    icon: 'menu-book',
    proofTitle: 'Show today’s reading proof',
    proofDescription: 'Upload something that clearly shows your reading progress or reflection.',
    captionTitle: 'Reading note',
    captionHint: 'Add a short note about the chapter, page range, or one idea that stood out.',
  },
  mindset: {
    icon: 'self-improvement',
    proofTitle: 'Show today’s reset proof',
    proofDescription: 'Upload something that clearly shows you completed the reset, reflection, or journal step.',
    captionTitle: 'Reflection note',
    captionHint: 'Add a short note about your reset, reflection, or how you showed up today.',
  },
};

export function getCheckInCategoryContent(category: GoalCategory | undefined): CheckInCategoryContent | null {
  return category ? CATEGORY_CONTENT[category] : null;
}
