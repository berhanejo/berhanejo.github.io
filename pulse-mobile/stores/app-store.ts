import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { createJSONStorage as createJSONStorageType, persist as persistType } from 'zustand/middleware';

import { GoalCategory, MockGroupMember, Program } from '@/data/mock-data';

export type LocalCheckInRecord = {
  id: string;
  userId: string;
  goalId: string;
  date: string;
  caption: string;
  imageUri: string;
  goalRun?: number;
};

export type PersistedUserData = {
  id: string;
  name: string;
  goal: string;
  groupName: string;
  groupMembers: MockGroupMember[];
  selectedCategoryIds: GoalCategory[];
  selectedProgramIds: string[];
  activeProgramIds: string[];
  maxActivePrograms: number;
  goalRunById: Record<string, number>;
  goalRunStartedAtById: Record<string, string>;
  archivedProgramIds: string[];
  customPrograms: Program[];
  checkIns: LocalCheckInRecord[];
};

type AppStoreState = {
  hasHydrated: boolean;
  usersById: Record<string, PersistedUserData>;
  mockAuthUserId: string | null;
  markHydrated: () => void;
  initializeIfEmpty: (seedUsersById: Record<string, PersistedUserData>) => void;
  setMockAuthUserId: (userId: string | null) => void;
  upsertUser: (user: PersistedUserData) => void;
  updateUser: (userId: string, updater: (user: PersistedUserData) => PersistedUserData) => void;
};

// Force CJS resolution for web bundling to avoid `import.meta` from the ESM middleware bundle.
const { createJSONStorage, persist } = require('zustand/middleware') as {
  createJSONStorage: typeof createJSONStorageType;
  persist: typeof persistType;
};

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      usersById: {},
      mockAuthUserId: null,
      markHydrated: () => set({ hasHydrated: true }),
      initializeIfEmpty: (seedUsersById) =>
        set((state) => {
          if (Object.keys(state.usersById).length > 0) {
            return state;
          }

          return {
            ...state,
            usersById: seedUsersById,
          };
        }),
      setMockAuthUserId: (userId) => set({ mockAuthUserId: userId }),
      upsertUser: (user) =>
        set((state) => {
          const existing = state.usersById[user.id];
          if (existing === user) {
            return state;
          }

          return {
            ...state,
            usersById: {
              ...state.usersById,
              [user.id]: user,
            },
          };
        }),
      updateUser: (userId, updater) =>
        set((state) => {
          const existing = state.usersById[userId];
          if (!existing) {
            return state;
          }
          const nextUser = updater(existing);
          if (nextUser === existing) {
            return state;
          }

          return {
            ...state,
            usersById: {
              ...state.usersById,
              [userId]: nextUser,
            },
          };
        }),
    }),
    {
      name: 'pulse-app-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        usersById: state.usersById,
        mockAuthUserId: state.mockAuthUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);
