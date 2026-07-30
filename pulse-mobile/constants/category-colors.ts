import { GoalCategory } from '@/data/mock-data';

/**
 * One accent color per goal category (Duolingo-style: each topic gets its
 * own saturated identity instead of one flat brand blue everywhere). Used
 * for icons/badges/rings across Home, Check-in, Goals, and Progress so the
 * app reads as more alive and easier to scan at a glance.
 */
export const CATEGORY_COLORS: Record<GoalCategory, { accent: string; background: string; icon: string }> = {
  fitness: { accent: '#ea580c', background: '#fff7ed', icon: 'directions-run' },
  learning: { accent: '#4f46e5', background: '#eef2ff', icon: 'school' },
  reading: { accent: '#0d9488', background: '#f0fdfa', icon: 'menu-book' },
  mindset: { accent: '#7c3aed', background: '#f5f3ff', icon: 'self-improvement' },
};
