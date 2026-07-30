import { create } from 'zustand';

import { GoalCategory, Program } from '@/data/mock-data';

type OnboardingState = {
  selectedCategories: GoalCategory[];
  selectedPrograms: Program[];
  toggleCategory: (category: GoalCategory) => void;
  toggleProgram: (program: Program) => void;
  reset: () => void;
};

/**
 * Transient wizard state for the group -> category -> program onboarding
 * flow. Not persisted to disk: if the app is killed mid-onboarding, starting
 * over from welcome is expected and fine. Final selections are written to
 * real `goals` rows only once the user finishes the flow.
 */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  selectedCategories: [],
  selectedPrograms: [],
  toggleCategory: (category) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((entry) => entry !== category)
        : [...state.selectedCategories, category],
    })),
  toggleProgram: (program) =>
    set((state) => {
      const exists = state.selectedPrograms.some((entry) => entry.id === program.id);

      return {
        selectedPrograms: exists
          ? state.selectedPrograms.filter((entry) => entry.id !== program.id)
          : [...state.selectedPrograms, program],
        selectedCategories:
          exists || state.selectedCategories.includes(program.category)
            ? state.selectedCategories
            : [...state.selectedCategories, program.category],
      };
    }),
  reset: () => set({ selectedCategories: [], selectedPrograms: [] }),
}));
