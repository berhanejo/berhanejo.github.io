import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { createJSONStorage as createJSONStorageType, persist as persistType } from 'zustand/middleware';

type AppPreferencesState = {
  hasHydrated: boolean;
  activeGroupId: string | null;
  maxActivePrograms: number;
  primaryGoalId: string | null;
  markHydrated: () => void;
  setActiveGroupId: (groupId: string | null) => void;
  setMaxActivePrograms: (nextMax: number) => void;
  setPrimaryGoalId: (goalId: string | null) => void;
};

// Force CJS resolution for web bundling to avoid `import.meta` from the ESM middleware bundle.
const { createJSONStorage, persist } = require('zustand/middleware') as {
  createJSONStorage: typeof createJSONStorageType;
  persist: typeof persistType;
};

/**
 * Device-local UI preferences only. All real app data (goals, groups,
 * check-ins) lives in Supabase and is fetched via the react-query hooks in
 * lib/queries — nothing user-generated is persisted here.
 */
export const useAppStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      activeGroupId: null,
      maxActivePrograms: 3,
      primaryGoalId: null,
      markHydrated: () => set({ hasHydrated: true }),
      setActiveGroupId: (groupId) => set({ activeGroupId: groupId }),
      setMaxActivePrograms: (nextMax) =>
        set({ maxActivePrograms: Math.max(1, Math.min(Math.round(nextMax), 10)) }),
      setPrimaryGoalId: (goalId) => set({ primaryGoalId: goalId }),
    }),
    {
      name: 'pulse-app-preferences-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeGroupId: state.activeGroupId,
        maxActivePrograms: state.maxActivePrograms,
        primaryGoalId: state.primaryGoalId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
