import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  CheckIn,
  checkInByCategory,
  defaultProgram,
  GoalCategory,
  GroupMember,
  MockUser,
  mockCheckIns,
  mockUsers,
  programsByCategory,
  Program,
} from '@/data/mock-data';
import { useAuthSession } from '@/contexts/auth-session';
import { supabase } from '@/lib/supabase';
import { LocalCheckInRecord, PersistedUserData, useAppStore } from '@/stores/app-store';

type LocalCheckInEntry = LocalCheckInRecord;

type SessionUser = {
  id: string;
  name: string;
  goal: string;
  groupName: string;
};

type DailyStatus = 'pending' | 'done' | 'missed';

type WeekCheckInItem = {
  dateKey: string;
  isToday: boolean;
  status: DailyStatus;
  label: string;
};

type CoachMessage = {
  type: 'reminder' | 'motivation' | 'streak_praise' | 'reentry' | 'callout';
  title: string;
  body: string;
};

type GroupChallengeStatusItem = {
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

type GroupActivityItem = {
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

type OwnActiveGoalStatusItem = {
  goalId: string;
  title: string;
  categoryLabel: string;
  status: DailyStatus;
  hasProof: boolean;
  caption: string | null;
  imageUri: string | null;
};

type GoalLatestCheckInItem = {
  goalId: string;
  caption: string | null;
  imageUri: string | null;
  date: string | null;
};

type CreateCustomChallengeInput = {
  title: string;
  category: GoalCategory;
  durationDays: 7 | 14 | 30;
};

function normalizeCheckInRecord(entry: LocalCheckInRecord): LocalCheckInRecord {
  const legacyEntry = entry as LocalCheckInRecord & {
    programId?: string;
    note?: string;
    proof?: {
      uri?: string;
    };
  };

  return {
    id: entry.id,
    userId: entry.userId,
    goalId: entry.goalId ?? legacyEntry.programId ?? '',
    date: entry.date,
    caption: entry.caption ?? legacyEntry.note ?? '',
    imageUri: entry.imageUri ?? legacyEntry.proof?.uri ?? '',
    goalRun: entry.goalRun ?? 0,
  };
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStartOfWeekMonday(date: Date) {
  const start = new Date(date);
  const day = start.getDay(); // Sunday: 0
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function areArraysEqual<T>(left: T[], right: T[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function areCheckInsEqual(left: LocalCheckInRecord[], right: LocalCheckInRecord[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftEntry = left[index];
    const rightEntry = right[index];

    if (
      leftEntry.id !== rightEntry.id ||
      leftEntry.userId !== rightEntry.userId ||
      leftEntry.goalId !== rightEntry.goalId ||
      leftEntry.date !== rightEntry.date ||
      leftEntry.caption !== rightEntry.caption ||
      leftEntry.imageUri !== rightEntry.imageUri ||
      (leftEntry.goalRun ?? 0) !== (rightEntry.goalRun ?? 0)
    ) {
      return false;
    }
  }

  return true;
}

function areRecordNumbersEqual(left: Record<string, number>, right: Record<string, number>) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function areRecordStringsEqual(left: Record<string, string>, right: Record<string, string>) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function areProgramsEqual(left: Program[], right: Program[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    const leftProgram = left[index];
    const rightProgram = right[index];

    if (
      leftProgram.id !== rightProgram.id ||
      leftProgram.title !== rightProgram.title ||
      leftProgram.category !== rightProgram.category ||
      leftProgram.totalDays !== rightProgram.totalDays
    ) {
      return false;
    }
  }

  return true;
}

function isValidProofCheckIn(entry: LocalCheckInRecord) {
  return entry.caption.trim().length > 0 && entry.imageUri.trim().length > 0;
}

type AppSessionContextValue = {
  currentUser: SessionUser | null;
  groupMembers: GroupMember[];
  todayChallengeStatuses: GroupChallengeStatusItem[];
  ownActiveGoalStatuses: OwnActiveGoalStatusItem[];
  ownGoalLatestCheckIns: GoalLatestCheckInItem[];
  groupActivityFeed: GroupActivityItem[];
  currentProgram: Program;
  selectedCategories: GoalCategory[];
  selectedPrograms: Program[];
  archivedPrograms: Program[];
  availablePrograms: Program[];
  activePrograms: Program[];
  activeFocusAreas: GoalCategory[];
  maxActivePrograms: number;
  setMaxActivePrograms: (nextMax: number) => void;
  todayCheckIn: CheckIn;
  hasCheckedInToday: boolean;
  totalActiveGoals: number;
  completedGoalsToday: number;
  completionPercentToday: number;
  todayOverallStatus: DailyStatus;
  latestCheckInCaption: string | null;
  latestCheckInImageUri: string | null;
  latestCheckInDate: string | null;
  currentWeekCheckIns: WeekCheckInItem[];
  elapsedDays: number;
  relevantDays: number;
  completedDays: number;
  missedDays: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  aiCoachMessage: CoachMessage;
  dayOffset: number;
  simulatedDateLabel: string;
  hasCompletedOnboarding: boolean;
  toggleCategory: (category: GoalCategory) => void;
  toggleProgram: (program: Program) => void;
  addGoal: (program: Program) => void;
  createCustomChallenge: (input: CreateCustomChallengeInput) => void;
  setProgramActive: (programId: string) => void;
  setPrimaryProgram: (programId: string) => void;
  pauseProgram: (programId: string) => void;
  resetGoalProgress: (programId: string) => void;
  archiveGoal: (programId: string) => void;
  restoreArchivedGoal: (programId: string) => void;
  removeProgram: (programId: string) => void;
  submitTodayCheckIn: (goalId: string, caption: string, imageUri: string) => void;
  goToNextDay: () => void;
  goToPreviousDay: () => void;
  resetToToday: () => void;
  login: (userId: string) => void;
  logout: () => void;
  syncGoalsNow: () => Promise<void>;
  completeOnboarding: () => void;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

const DEFAULT_MAX_ACTIVE_PROGRAMS = 3;
const allPrograms = Object.values(programsByCategory).flat();
const baseProgramById = new Map(allPrograms.map((program) => [program.id, program]));
const mockUsersById = new Map(mockUsers.map((user) => [user.id, user]));

function getMockUserForId(userId: string | null): MockUser | null {
  if (!userId) {
    return null;
  }

  const directMatch = mockUsersById.get(userId);
  if (directMatch) {
    return directMatch;
  }

  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }
  const safeIndex = Math.abs(hash) % mockUsers.length;
  return mockUsers[safeIndex];
}

function buildSeedCheckInsForUser(seedUser: MockUser): LocalCheckInRecord[] {
  const validOwners = new Set([seedUser.id, ...seedUser.groupMembers.map((member) => member.id)]);

  return mockCheckIns
    .filter((checkIn) => validOwners.has(checkIn.userId))
    .filter((checkIn) => baseProgramById.has(checkIn.programId))
    .map((checkIn) => ({
      id: `${checkIn.userId}-${checkIn.programId}-${checkIn.date}`,
      userId: checkIn.userId,
      goalId: checkIn.programId,
      date: checkIn.date,
      caption: checkIn.note,
      imageUri: '',
    }));
}

function buildPersistedUserDataForId(userId: string): PersistedUserData | null {
  const seedUser = getMockUserForId(userId);

  if (!seedUser) {
    return null;
  }

  const selectedProgramIds = seedUser.selectedProgramIds.filter((programId) => baseProgramById.has(programId));
  const activeProgramIds = seedUser.activeProgramIds
    .filter((programId) => selectedProgramIds.includes(programId))
    .slice(0, 3);

  return {
    id: userId,
    name: seedUser.name,
    goal: seedUser.goal,
    groupName: seedUser.groupName,
    groupMembers: seedUser.groupMembers,
    selectedCategoryIds: seedUser.selectedCategoryIds,
    selectedProgramIds,
    activeProgramIds,
    maxActivePrograms: DEFAULT_MAX_ACTIVE_PROGRAMS,
    goalRunById: {},
    goalRunStartedAtById: {},
    archivedProgramIds: [],
    customPrograms: [],
    checkIns: buildSeedCheckInsForUser(seedUser),
  };
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuthSession();
  const REMINDER_TIMES = [
    { hour: 18, minute: 0 },
    { hour: 21, minute: 0 },
  ] as const;
  const [selectedCategories, setSelectedCategories] = useState<GoalCategory[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<Program[]>([]);
  const [activeProgramIds, setActiveProgramIds] = useState<string[]>([]);
  const [maxActivePrograms, setMaxActiveProgramsState] = useState(DEFAULT_MAX_ACTIVE_PROGRAMS);
  const [goalRunById, setGoalRunById] = useState<Record<string, number>>({});
  const [goalRunStartedAtById, setGoalRunStartedAtById] = useState<Record<string, string>>({});
  const [archivedProgramIds, setArchivedProgramIds] = useState<string[]>([]);
  const [customPrograms, setCustomPrograms] = useState<Program[]>([]);
  const [checkIns, setCheckIns] = useState<LocalCheckInEntry[]>([]);
  const isStoreHydrated = useAppStore((state) => state.hasHydrated);
  const mockAuthUserId = useAppStore((state) => state.mockAuthUserId);
  const setMockAuthUserId = useAppStore((state) => state.setMockAuthUserId);
  const upsertUser = useAppStore((state) => state.upsertUser);
  const updateUser = useAppStore((state) => state.updateUser);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [hasLoadedRemoteGoals, setHasLoadedRemoteGoals] = useState(false);
  const scheduledNotificationIdsRef = useRef<string[]>([]);
  const isHydratingFromSupabaseRef = useRef(false);
  const lastHydratedUserIdRef = useRef<string | null>(null);
  const resolvedUserId = user?.id ?? mockAuthUserId ?? null;
  const currentPersistedUser = useAppStore(
    useCallback(
      (state) => (resolvedUserId ? state.usersById[resolvedUserId] ?? null : null),
      [resolvedUserId]
    )
  );
  const customProgramById = useMemo(
    () => new Map(customPrograms.map((program) => [program.id, program])),
    [customPrograms]
  );
  const mergedProgramById = useMemo(() => {
    const merged = new Map(baseProgramById);
    for (const [id, program] of customProgramById.entries()) {
      merged.set(id, program);
    }
    return merged;
  }, [customProgramById]);

  const persistGoalsToSupabase = useCallback(
    async (userId: string, programs: Program[], activeIds: string[]) => {
      const { error: deleteError } = await supabase.from('user_goals').delete().eq('user_id', userId);

      if (deleteError) {
        console.warn('Failed to clear goals in Supabase:', deleteError.message);
        return;
      }

      if (programs.length === 0) {
        return;
      }

      const payload = programs.map((program) => ({
        user_id: userId,
        program_id: program.id,
        category: program.category,
        title: program.title,
        is_active: activeIds.includes(program.id),
      }));

      const { error: insertError } = await supabase.from('user_goals').insert(payload);

      if (insertError) {
        console.warn('Failed to save goals in Supabase:', insertError.message);
      }
    },
    []
  );

  useEffect(() => {
    if (!isStoreHydrated) {
      return;
    }

    if (!resolvedUserId) {
      lastHydratedUserIdRef.current = null;
      setSelectedCategories([]);
      setSelectedPrograms([]);
      setActiveProgramIds([]);
      setMaxActiveProgramsState(DEFAULT_MAX_ACTIVE_PROGRAMS);
      setGoalRunById({});
      setGoalRunStartedAtById({});
      setArchivedProgramIds([]);
      setCustomPrograms([]);
      setCheckIns([]);
      setHasCompletedOnboarding(false);
      setHasLoadedRemoteGoals(false);
      return;
    }

    if (!currentPersistedUser) {
      const seeded = buildPersistedUserDataForId(resolvedUserId);
      if (seeded) {
        upsertUser(seeded);
      }
      return;
    }

    if (lastHydratedUserIdRef.current === resolvedUserId) {
      return;
    }

    const persistedCustomPrograms = (currentPersistedUser.customPrograms ?? []).filter(
      (program) => !baseProgramById.has(program.id)
    );
    const persistedProgramById = new Map(baseProgramById);
    for (const program of persistedCustomPrograms) {
      persistedProgramById.set(program.id, program);
    }
    const loadedPrograms = currentPersistedUser.selectedProgramIds
      .map((programId) => persistedProgramById.get(programId))
      .filter((program): program is Program => Boolean(program));
    const loadedMaxActivePrograms = Math.max(1, Math.min(currentPersistedUser.maxActivePrograms ?? DEFAULT_MAX_ACTIVE_PROGRAMS, 10));
    const loadedCategories =
      currentPersistedUser.selectedCategoryIds.length > 0
        ? currentPersistedUser.selectedCategoryIds
        : [...new Set(loadedPrograms.map((program) => program.category))];
    const loadedActiveIds = currentPersistedUser.activeProgramIds
      .filter((programId) => loadedPrograms.some((program) => program.id === programId))
      .slice(0, loadedMaxActivePrograms);
    const loadedGoalRunById = currentPersistedUser.goalRunById ?? {};
    const loadedGoalRunStartedAtById = currentPersistedUser.goalRunStartedAtById ?? {};
    const loadedArchivedIds = (currentPersistedUser.archivedProgramIds ?? []).filter((programId) =>
      persistedProgramById.has(programId)
    );

    setSelectedCategories(loadedCategories);
    setSelectedPrograms(loadedPrograms);
    setMaxActiveProgramsState(loadedMaxActivePrograms);
    setActiveProgramIds(loadedActiveIds.length > 0 ? loadedActiveIds : loadedPrograms[0] ? [loadedPrograms[0].id] : []);
    setGoalRunById(loadedGoalRunById);
    setGoalRunStartedAtById(loadedGoalRunStartedAtById);
    setArchivedProgramIds(loadedArchivedIds);
    setCustomPrograms(persistedCustomPrograms);
    setCheckIns((currentPersistedUser.checkIns ?? []).map(normalizeCheckInRecord));
    setHasCompletedOnboarding(loadedPrograms.length > 0);
    setHasLoadedRemoteGoals(false);
    lastHydratedUserIdRef.current = resolvedUserId;
  }, [currentPersistedUser, isStoreHydrated, resolvedUserId, upsertUser]);

  useEffect(() => {
    if (!isStoreHydrated || !resolvedUserId) {
      return;
    }

    const selectedProgramIds = selectedPrograms.map((program) => program.id);
    const normalizedActiveIds = activeProgramIds
      .filter((programId) => selectedProgramIds.includes(programId))
      .slice(0, maxActivePrograms);
    const normalizedGoalRunById = Object.fromEntries(
      Object.entries(goalRunById).filter(([goalId]) => selectedProgramIds.includes(goalId))
    );
    const normalizedGoalRunStartedAtById = Object.fromEntries(
      Object.entries(goalRunStartedAtById).filter(([goalId]) => selectedProgramIds.includes(goalId))
    );
    const normalizedArchivedIds = archivedProgramIds.filter((programId) => mergedProgramById.has(programId));
    const normalizedCustomPrograms = customPrograms.filter((program) => !baseProgramById.has(program.id));
    updateUser(resolvedUserId, (existing) => {
      const selectedCategoriesEqual = areArraysEqual(existing.selectedCategoryIds, selectedCategories);
      const selectedProgramsEqual = areArraysEqual(existing.selectedProgramIds, selectedProgramIds);
      const activeProgramsEqual = areArraysEqual(existing.activeProgramIds, normalizedActiveIds);
      const archivedProgramsEqual = areArraysEqual(existing.archivedProgramIds ?? [], normalizedArchivedIds);
      const customProgramsEqual = areProgramsEqual(existing.customPrograms ?? [], normalizedCustomPrograms);
      const maxActiveProgramsEqual = (existing.maxActivePrograms ?? DEFAULT_MAX_ACTIVE_PROGRAMS) === maxActivePrograms;
      const goalRunsEqual = areRecordNumbersEqual(existing.goalRunById ?? {}, normalizedGoalRunById);
      const goalRunStartsEqual = areRecordStringsEqual(
        existing.goalRunStartedAtById ?? {},
        normalizedGoalRunStartedAtById
      );
      const checkInsEqual = areCheckInsEqual(existing.checkIns, checkIns);

      if (
        selectedCategoriesEqual &&
        selectedProgramsEqual &&
        activeProgramsEqual &&
        archivedProgramsEqual &&
        customProgramsEqual &&
        maxActiveProgramsEqual &&
        goalRunsEqual &&
        goalRunStartsEqual &&
        checkInsEqual
      ) {
        return existing;
      }

      return {
        ...existing,
        selectedCategoryIds: selectedCategories,
        selectedProgramIds,
        activeProgramIds: normalizedActiveIds,
        maxActivePrograms,
        goalRunById: normalizedGoalRunById,
        goalRunStartedAtById: normalizedGoalRunStartedAtById,
        archivedProgramIds: normalizedArchivedIds,
        customPrograms: normalizedCustomPrograms,
        checkIns,
      };
    });
  }, [
    activeProgramIds,
    archivedProgramIds,
    checkIns,
    customPrograms,
    goalRunById,
    goalRunStartedAtById,
    isStoreHydrated,
    maxActivePrograms,
    mergedProgramById,
    resolvedUserId,
    selectedCategories,
    selectedPrograms,
    updateUser,
  ]);

  const toggleCategory = useCallback((category: GoalCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((entry) => entry !== category) : [...prev, category]
    );
  }, []);

  const toggleProgram = useCallback(
    (program: Program) => {
      setSelectedPrograms((prev) => {
        const exists = prev.some((entry) => entry.id === program.id);
        const nextPrograms = exists ? prev.filter((entry) => entry.id !== program.id) : [...prev, program];

        if (!exists) {
          setSelectedCategories((prevCategories) =>
            prevCategories.includes(program.category) ? prevCategories : [...prevCategories, program.category]
          );
        }

        setActiveProgramIds((prevIds) => {
          const idsWithoutRemoved = prevIds.filter((id) => id !== program.id);

          if (exists) {
            if (nextPrograms.length > 0 && idsWithoutRemoved.length === 0) {
              return [nextPrograms[0].id];
            }

            return idsWithoutRemoved;
          }

          if (idsWithoutRemoved.length >= maxActivePrograms) {
            return idsWithoutRemoved;
          }

          return [...idsWithoutRemoved, program.id];
        });

        return nextPrograms;
      });
      setArchivedProgramIds((prev) => prev.filter((id) => id !== program.id));
    },
    [maxActivePrograms]
  );

  const addGoal = useCallback(
    (program: Program) => {
      setSelectedPrograms((prev) => {
        if (prev.some((entry) => entry.id === program.id)) {
          return prev;
        }

        const nextPrograms = [...prev, program];
        setActiveProgramIds((prevIds) => {
          if (prevIds.includes(program.id) || prevIds.length >= maxActivePrograms) {
            return prevIds;
          }

          return [...prevIds, program.id];
        });
        setSelectedCategories((prevCategories) =>
          prevCategories.includes(program.category) ? prevCategories : [...prevCategories, program.category]
        );

        return nextPrograms;
      });
      setArchivedProgramIds((prev) => prev.filter((id) => id !== program.id));
    },
    [maxActivePrograms]
  );

  const createCustomChallenge = useCallback(
    ({ title, category, durationDays }: CreateCustomChallengeInput) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        return;
      }

      const idSeed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const customProgram: Program = {
        id: `custom-${idSeed}`,
        title: cleanTitle,
        category,
        categoryLabel: category.charAt(0).toUpperCase() + category.slice(1),
        focus: `Complete this ${durationDays}-day custom challenge with one daily check-in.`,
        day: 1,
        totalDays: durationDays,
        streak: 0,
        completionRate: 0,
        nextReminder: '20:00',
        proofLabel: 'Proof',
        proofExamples: ['photo proof', 'screenshot proof', 'progress proof'],
      };

      setCustomPrograms((prev) => [...prev, customProgram]);
      addGoal(customProgram);
    },
    [addGoal]
  );

  const setMaxActivePrograms = useCallback((nextMax: number) => {
    const safeMax = Math.max(1, Math.min(Math.round(nextMax), 10));
    setMaxActiveProgramsState(safeMax);
    setActiveProgramIds((prev) => prev.slice(0, safeMax));
  }, []);

  const simulatedTodayDateKey = useMemo(() => {
    const simulatedNow = new Date();
    simulatedNow.setDate(simulatedNow.getDate() + dayOffset);
    return getDateKey(simulatedNow);
  }, [dayOffset]);

  const resetGoalProgress = useCallback(
    (programId: string) => {
      if (!resolvedUserId) {
        return;
      }

      setGoalRunById((prev) => {
        const currentRun = prev[programId] ?? 0;
        return {
          ...prev,
          [programId]: currentRun + 1,
        };
      });
      setGoalRunStartedAtById((prev) => ({
        ...prev,
        [programId]: simulatedTodayDateKey,
      }));
      setCheckIns((prev) =>
        prev.filter((entry) => !(entry.userId === resolvedUserId && entry.goalId === programId))
      );
    },
    [resolvedUserId, simulatedTodayDateKey]
  );

  const setProgramActive = useCallback(
    (programId: string) => {
      const exists = selectedPrograms.some((program) => program.id === programId);

      if (!exists) {
        return;
      }

      setActiveProgramIds((prev) => {
        if (prev.includes(programId) || prev.length >= maxActivePrograms) {
          return prev;
        }

        return [...prev, programId];
      });
    },
    [maxActivePrograms, selectedPrograms]
  );

  const setPrimaryProgram = useCallback(
    (programId: string) => {
      const isSelected = selectedPrograms.some((program) => program.id === programId);
      if (!isSelected) {
        return;
      }

      setActiveProgramIds((prev) => {
        const idsWithoutProgram = prev.filter((id) => id !== programId);
        const canActivate = prev.includes(programId) || prev.length < maxActivePrograms;

        if (!canActivate) {
          return prev;
        }

        return [programId, ...idsWithoutProgram].slice(0, maxActivePrograms);
      });
    },
    [maxActivePrograms, selectedPrograms]
  );

  const pauseProgram = useCallback((programId: string) => {
    setActiveProgramIds((prev) => {
      if (!prev.includes(programId)) {
        return prev;
      }

      const next = prev.filter((id) => id !== programId);

      if (next.length > 0) {
        return next;
      }

      const fallback = selectedPrograms.find((program) => program.id !== programId);
      return fallback ? [fallback.id] : prev;
    });
  }, [selectedPrograms]);

  const archiveGoal = useCallback(
    (programId: string) => {
      setSelectedPrograms((prevPrograms) => {
        const nextPrograms = prevPrograms.filter((program) => program.id !== programId);

        setActiveProgramIds((prevIds) => {
          const nextIds = prevIds.filter((id) => id !== programId);

          if (nextIds.length > 0 || nextPrograms.length === 0) {
            return nextIds;
          }

          return [nextPrograms[0].id];
        });

        return nextPrograms;
      });

      setArchivedProgramIds((prev) => (prev.includes(programId) ? prev : [...prev, programId]));
    },
    []
  );

  const restoreArchivedGoal = useCallback(
    (programId: string) => {
      const program = mergedProgramById.get(programId);
      if (!program) {
        return;
      }

      addGoal(program);
      setArchivedProgramIds((prev) => prev.filter((id) => id !== programId));
    },
    [addGoal, mergedProgramById]
  );

  const removeProgram = useCallback((programId: string) => {
    setSelectedPrograms((prevPrograms) => {
      const nextPrograms = prevPrograms.filter((program) => program.id !== programId);

      setActiveProgramIds((prevIds) => {
        const nextIds = prevIds.filter((id) => id !== programId);

        if (nextIds.length > 0 || nextPrograms.length === 0) {
          return nextIds;
        }

        return [nextPrograms[0].id];
      });

      return nextPrograms;
    });
    setCheckIns((prev) => prev.filter((entry) => entry.goalId !== programId));
  }, []);

  const submitTodayCheckIn = useCallback(
    (goalId: string, caption: string, imageUri: string) => {
      const cleanCaption = caption.trim();
      const cleanImageUri = imageUri.trim();
      const currentGoalRun = goalRunById[goalId] ?? 0;
      if (!resolvedUserId) {
        return;
      }

      if (!goalId || !cleanCaption || !cleanImageUri) {
        return;
      }

      if (!activeProgramIds.includes(goalId)) {
        return;
      }

      setCheckIns((prev) => {
        const withoutToday = prev.filter(
          (entry) =>
            !(
              entry.userId === resolvedUserId &&
              entry.goalId === goalId &&
              entry.date === simulatedTodayDateKey &&
              (entry.goalRun ?? 0) === currentGoalRun
            )
        );

        return [
          ...withoutToday,
          {
            id: `${resolvedUserId}-${goalId}-${simulatedTodayDateKey}`,
            userId: resolvedUserId,
            goalId,
            date: simulatedTodayDateKey,
            caption: cleanCaption,
            imageUri: cleanImageUri,
            goalRun: currentGoalRun,
          },
        ];
      });
    },
    [activeProgramIds, goalRunById, resolvedUserId, simulatedTodayDateKey]
  );

  const goToNextDay = useCallback(() => setDayOffset((prev) => prev + 1), []);
  const goToPreviousDay = useCallback(() => setDayOffset((prev) => prev - 1), []);
  const resetToToday = useCallback(() => setDayOffset(0), []);
  const login = useCallback((userId: string) => {
    setMockAuthUserId(userId);
  }, [setMockAuthUserId]);
  const logout = useCallback(() => {
    setMockAuthUserId(null);
    setSelectedCategories([]);
    setSelectedPrograms([]);
    setActiveProgramIds([]);
    setMaxActiveProgramsState(DEFAULT_MAX_ACTIVE_PROGRAMS);
    setGoalRunById({});
    setGoalRunStartedAtById({});
    setArchivedProgramIds([]);
    setCustomPrograms([]);
    setCheckIns([]);
    setHasCompletedOnboarding(false);
    setHasLoadedRemoteGoals(false);
    setDayOffset(0);
  }, [setMockAuthUserId]);
  const syncGoalsNow = useCallback(async () => {
    const userId = user?.id;

    if (!userId) {
      return;
    }

    await persistGoalsToSupabase(userId, selectedPrograms, activeProgramIds);
  }, [activeProgramIds, persistGoalsToSupabase, selectedPrograms, user?.id]);
  const completeOnboarding = useCallback(() => {
    if (selectedPrograms.length > 0) {
      setActiveProgramIds((prev) => {
        const validIds = prev.filter((id) => selectedPrograms.some((program) => program.id === id));

        if (validIds.length > 0) {
          return validIds.slice(0, maxActivePrograms);
        }

        return [selectedPrograms[0].id];
      });
    }

    setHasCompletedOnboarding(true);
  }, [maxActivePrograms, selectedPrograms]);

  const value = useMemo(
    () => {
      const currentUser: SessionUser | null = currentPersistedUser
        ? {
            id: currentPersistedUser.id,
            name: currentPersistedUser.name,
            goal: currentPersistedUser.goal,
            groupName: currentPersistedUser.groupName,
          }
        : null;
      const safeSelectedPrograms = Array.isArray(selectedPrograms) ? selectedPrograms : [];
      const safeArchivedProgramIds = archivedProgramIds.filter((programId) => mergedProgramById.has(programId));
      const archivedPrograms = safeArchivedProgramIds
        .map((programId) => mergedProgramById.get(programId))
        .filter((program): program is Program => Boolean(program));
      const availablePrograms = allPrograms.filter(
        (program) =>
          !safeSelectedPrograms.some((selectedProgram) => selectedProgram.id === program.id) &&
          !safeArchivedProgramIds.includes(program.id)
      );
      const selectedProgramMap = new Map(safeSelectedPrograms.map((program) => [program.id, program]));
      const activePrograms = activeProgramIds
        .map((id) => selectedProgramMap.get(id))
        .filter((program): program is Program => Boolean(program));
      const safeProgram = activePrograms[0] ?? safeSelectedPrograms[0] ?? defaultProgram;
      const simulatedNow = new Date();
      simulatedNow.setDate(simulatedNow.getDate() + dayOffset);
      const todayDateKey = getDateKey(simulatedNow);
      const actualTodayDateKey = getDateKey(new Date());
      const isSimulatedFutureDay = todayDateKey > actualTodayDateKey;
      const safeProgramRun = goalRunById[safeProgram.id] ?? 0;
      const ownCheckInsForProgram = checkIns.filter(
        (entry) =>
          entry.userId === resolvedUserId &&
          entry.goalId === safeProgram.id &&
          (entry.goalRun ?? 0) === safeProgramRun &&
          isValidProofCheckIn(entry)
      );
      const ownCheckInByDate = new Map(ownCheckInsForProgram.map((entry) => [entry.date, entry]));
      const latestOwnCheckIn = ownCheckInsForProgram
        .slice()
        .sort((left, right) => right.date.localeCompare(left.date))[0];
      const peerMembers: GroupMember[] = (currentPersistedUser?.groupMembers ?? []).map((member) => {
        const hasDoneToday = checkIns.some(
          (entry) => entry.userId === member.id && entry.goalId === safeProgram.id && entry.date === todayDateKey
        );

        return {
          id: member.id,
          name: member.name,
          status: hasDoneToday ? 'done' : 'pending',
        };
      });
      const selfMember: GroupMember | null = resolvedUserId
        ? {
            id: resolvedUserId,
            name: 'You',
            status: ownCheckInByDate.has(todayDateKey) ? 'done' : 'pending',
          }
        : null;
      const groupMembers = selfMember ? [selfMember, ...peerMembers] : peerMembers;
      const groupUsers = [
        ...(selfMember ? [selfMember] : []),
        ...(currentPersistedUser?.groupMembers ?? []).map((member) => ({
          id: member.id,
          name: member.name,
        })),
      ];
      const statusPrograms = activePrograms.length > 0 ? activePrograms : [safeProgram];
      const ownCurrentRunCheckInKeys = new Set(
        checkIns
          .filter((entry) => {
            if (entry.userId !== resolvedUserId) {
              return false;
            }

            const currentRun = goalRunById[entry.goalId] ?? 0;
            return (entry.goalRun ?? 0) === currentRun && isValidProofCheckIn(entry);
          })
          .map((entry) => `${entry.goalId}:${entry.date}`)
      );
      const todayChallengeStatuses: GroupChallengeStatusItem[] = groupUsers.flatMap((member) =>
        statusPrograms.map((program) => {
          const memberProgramRun = goalRunById[program.id] ?? 0;
          const todayEntry =
            checkIns.find(
              (entry) =>
                entry.userId === member.id &&
                entry.goalId === program.id &&
                entry.date === todayDateKey &&
                (entry.userId !== resolvedUserId || isValidProofCheckIn(entry)) &&
                (entry.userId !== resolvedUserId || (entry.goalRun ?? 0) === memberProgramRun)
            ) ?? null;
          const status: DailyStatus = todayEntry
            ? isSimulatedFutureDay
              ? 'pending'
              : 'done'
            : todayDateKey < actualTodayDateKey
              ? 'missed'
              : 'pending';

          return {
            id: `${member.id}-${program.id}-${todayDateKey}`,
            userId: member.id,
            userName: member.name,
            goalId: program.id,
            goalTitle: program.title,
            date: todayDateKey,
            status,
            caption: todayEntry?.caption ?? null,
            imageUri: todayEntry?.imageUri ?? null,
            timestampLabel: todayEntry ? 'Today' : null,
          };
        })
      );
      const ownActiveGoalStatuses: OwnActiveGoalStatusItem[] = statusPrograms.map((program) => {
        const ownTodayEntry = checkIns.find((entry) => {
          if (
            entry.userId !== resolvedUserId ||
            entry.goalId !== program.id ||
            entry.date !== todayDateKey ||
            !isValidProofCheckIn(entry)
          ) {
            return false;
          }

          const currentRun = goalRunById[program.id] ?? 0;
          return (entry.goalRun ?? 0) === currentRun;
        }) ?? null;
        const status: DailyStatus = ownTodayEntry
          ? isSimulatedFutureDay
            ? 'pending'
            : 'done'
          : todayDateKey < actualTodayDateKey
            ? 'missed'
            : 'pending';

        return {
          goalId: program.id,
          title: program.title,
          categoryLabel: program.categoryLabel,
          status,
          hasProof: Boolean(ownTodayEntry?.imageUri),
          caption: ownTodayEntry?.caption ?? null,
          imageUri: ownTodayEntry?.imageUri ?? null,
        };
      });
      const ownGoalLatestCheckIns: GoalLatestCheckInItem[] = statusPrograms.map((program) => {
        const currentRun = goalRunById[program.id] ?? 0;
        const latestForGoal = checkIns
          .filter(
            (entry) =>
              entry.userId === resolvedUserId &&
              entry.goalId === program.id &&
              isValidProofCheckIn(entry) &&
              (entry.goalRun ?? 0) === currentRun
          )
          .slice()
          .sort((left, right) => right.date.localeCompare(left.date))[0];

        return {
          goalId: program.id,
          caption: latestForGoal?.caption ?? null,
          imageUri: latestForGoal?.imageUri ?? null,
          date: latestForGoal?.date ?? null,
        };
      });
      const visibleMemberIds = new Set(groupMembers.map((member) => member.id));
      const userNameById = new Map(
        groupMembers.map((member) => [member.id, member.id === resolvedUserId ? 'You' : member.name])
      );
      const goalById = new Map(safeSelectedPrograms.map((program) => [program.id, program]));
      const groupActivityFeed: GroupActivityItem[] = checkIns
        .filter((entry) => visibleMemberIds.has(entry.userId))
        .filter((entry) => goalById.has(entry.goalId))
        .filter((entry) => {
          if (entry.userId !== resolvedUserId) {
            return true;
          }
          const run = goalRunById[entry.goalId] ?? 0;
          return (entry.goalRun ?? 0) === run;
        })
        .slice()
        .sort((left, right) => {
          const dateCompare = right.date.localeCompare(left.date);
          if (dateCompare !== 0) {
            return dateCompare;
          }
          return right.id.localeCompare(left.id);
        })
        .map((entry) => {
          const goal = goalById.get(entry.goalId) ?? mergedProgramById.get(entry.goalId) ?? defaultProgram;
          const entryDate = new Date(`${entry.date}T12:00:00`);
          const isToday = entry.date === todayDateKey;

          return {
            id: entry.id,
            userId: entry.userId,
            userName: userNameById.get(entry.userId) ?? 'Member',
            goalId: entry.goalId,
            goalTitle: goal.title,
            caption: entry.caption,
            imageUri: entry.imageUri,
            date: entry.date,
            timestampLabel: isToday
              ? 'Today'
              : entryDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                }),
            status: isToday ? 'done' : 'completed',
            isToday,
          };
        });
      const programCheckInToday = ownCheckInByDate.get(todayDateKey);
      const hasCheckedInToday = isSimulatedFutureDay ? false : Boolean(programCheckInToday);
      const totalActiveGoals = statusPrograms.length;
      const completedGoalsToday = statusPrograms.reduce(
        (count, program) =>
          count +
          (isSimulatedFutureDay ? 0 : ownCurrentRunCheckInKeys.has(`${program.id}:${todayDateKey}`) ? 1 : 0),
        0
      );
      const completionPercentToday =
        totalActiveGoals > 0 ? Math.round((completedGoalsToday / totalActiveGoals) * 100) : 0;
      const todayOverallStatus: DailyStatus =
        totalActiveGoals > 0 && completedGoalsToday === totalActiveGoals
          ? 'done'
          : todayDateKey < actualTodayDateKey
            ? 'missed'
            : 'pending';
      const latestCheckInCaption = latestOwnCheckIn?.caption ?? null;
      const latestCheckInImageUri = latestOwnCheckIn?.imageUri || null;
      const latestCheckInDate = latestOwnCheckIn?.date ?? null;
      const inferredStartDate = new Date(simulatedNow);
      inferredStartDate.setDate(inferredStartDate.getDate() - (Math.max(safeProgram.day, 1) - 1));
      inferredStartDate.setHours(0, 0, 0, 0);
      const storedRunStartDateKey = goalRunStartedAtById[safeProgram.id];
      const startDate = storedRunStartDateKey ? new Date(`${storedRunStartDateKey}T00:00:00`) : inferredStartDate;
      startDate.setHours(0, 0, 0, 0);
      const elapsedBase = Math.floor((simulatedNow.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedRaw = storedRunStartDateKey ? elapsedBase : elapsedBase + 1;
      const elapsedDays = Math.min(Math.max(elapsedRaw, 0), safeProgram.totalDays);

      const timelineStatuses: DailyStatus[] = Array.from({ length: elapsedDays }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const dateKey = getDateKey(date);
        const hasCheckIn = ownCheckInByDate.has(dateKey);

        if (dateKey === todayDateKey) {
          return hasCheckIn ? 'done' : 'pending';
        }

        return hasCheckIn ? 'done' : 'missed';
      });

      const relevantTimelineStatuses = timelineStatuses.filter(
        (status, index) => !(index === timelineStatuses.length - 1 && status === 'pending')
      );
      const completedDays = relevantTimelineStatuses.filter((status) => status === 'done').length;
      const missedDays = relevantTimelineStatuses.filter((status) => status === 'missed').length;
      const relevantDays = relevantTimelineStatuses.length;
      const completionRate = relevantDays > 0 ? Math.round((completedDays / relevantDays) * 100) : 0;
      const yesterdayStatus =
        timelineStatuses.length > 1 ? timelineStatuses[timelineStatuses.length - 2] : null;
      const lastSevenStatuses = timelineStatuses.slice(-7);
      const recentMissedDays = lastSevenStatuses.filter((status) => status === 'missed').length;

      let currentStreak = 0;
      for (let index = timelineStatuses.length - 1; index >= 0; index -= 1) {
        const status = timelineStatuses[index];

        if (index === timelineStatuses.length - 1 && status === 'pending') {
          continue;
        }

        if (status === 'done') {
          currentStreak += 1;
          continue;
        }

        break;
      }
      let bestStreak = 0;
      let streakRun = 0;
      for (const status of timelineStatuses) {
        if (status === 'done') {
          streakRun += 1;
          if (streakRun > bestStreak) {
            bestStreak = streakRun;
          }
          continue;
        }

        streakRun = 0;
      }
      const activeFocusAreas = selectedCategories.length
        ? selectedCategories
        : [...new Set((activePrograms.length ? activePrograms : [safeProgram]).map((program) => program.category))];
      const baseCheckIn = checkInByCategory[safeProgram.category];
      const todayCheckIn: CheckIn = {
        ...baseCheckIn,
        status: hasCheckedInToday ? 'done' : 'pending',
      };
      const aiCoachMessage: CoachMessage = (() => {
        if (todayCheckIn.status === 'done' && currentStreak >= 3) {
          return {
            type: 'streak_praise',
            title: 'Strong streak',
            body: `${currentStreak} days in a row on ${safeProgram.categoryLabel.toLowerCase()}. Protect it tomorrow.`,
          };
        }

        if (yesterdayStatus === 'missed') {
          return {
            type: 'reentry',
            title: 'Reset day',
            body: `Yesterday was missed. One ${safeProgram.categoryLabel.toLowerCase()} check-in today puts you back in rhythm.`,
          };
        }

        if (recentMissedDays >= 2) {
          return {
            type: 'callout',
            title: 'Consistency check',
            body: `${recentMissedDays} missed days this week. Scale today down and finish one clear rep.`,
          };
        }

        if (todayCheckIn.status === 'pending' && currentStreak >= 3) {
          return {
            type: 'motivation',
            title: 'Keep the momentum',
            body: `You are on a ${currentStreak}-day streak. Finish today’s ${safeProgram.title.toLowerCase()} session.`,
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
          body: `Post one ${safeProgram.categoryLabel.toLowerCase()} proof today to mark the day as done.`,
        };
      })();
      const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const startOfWeek = getStartOfWeekMonday(simulatedNow);
      const currentWeekCheckIns: WeekCheckInItem[] = weekLabels.map((label, index) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + index);
        const dateKey = getDateKey(dayDate);
        const completedGoalsOnDate = statusPrograms.reduce(
          (count, program) => count + (ownCurrentRunCheckInKeys.has(`${program.id}:${dateKey}`) ? 1 : 0),
          0
        );
        const dayIsFullyDone = totalActiveGoals > 0 && completedGoalsOnDate === totalActiveGoals;
        const status: DailyStatus =
          dateKey > todayDateKey ? 'pending' : dayIsFullyDone ? 'done' : dateKey === todayDateKey ? 'pending' : 'missed';

        return {
          dateKey,
          isToday: dateKey === todayDateKey,
          status,
          label,
        };
      });

      return {
        currentUser,
        groupMembers,
        todayChallengeStatuses,
        ownActiveGoalStatuses,
        ownGoalLatestCheckIns,
        groupActivityFeed,
        currentProgram: safeProgram,
        selectedCategories,
        selectedPrograms: safeSelectedPrograms,
        archivedPrograms,
        availablePrograms,
        activePrograms,
        activeFocusAreas,
        maxActivePrograms,
        todayCheckIn,
        hasCheckedInToday,
        totalActiveGoals,
        completedGoalsToday,
        completionPercentToday,
        todayOverallStatus,
        latestCheckInCaption,
        latestCheckInImageUri,
        latestCheckInDate,
        currentWeekCheckIns,
        elapsedDays,
        relevantDays,
        completedDays,
        missedDays,
        completionRate,
        currentStreak,
        bestStreak,
        aiCoachMessage,
        dayOffset,
        simulatedDateLabel: simulatedNow.toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        hasCompletedOnboarding,
        toggleCategory,
        toggleProgram,
        addGoal,
        createCustomChallenge,
        setMaxActivePrograms,
        setProgramActive,
        setPrimaryProgram,
        pauseProgram,
        resetGoalProgress,
        archiveGoal,
        restoreArchivedGoal,
        removeProgram,
        submitTodayCheckIn,
        goToNextDay,
        goToPreviousDay,
        resetToToday,
        login,
        logout,
        syncGoalsNow,
        completeOnboarding,
      };
    },
    [
      activeProgramIds,
      addGoal,
      archiveGoal,
      archivedProgramIds,
      checkIns,
      completeOnboarding,
      currentPersistedUser,
      createCustomChallenge,
      customPrograms,
      dayOffset,
      goToNextDay,
      goToPreviousDay,
      hasCompletedOnboarding,
      isStoreHydrated,
      login,
      logout,
      goalRunById,
      goalRunStartedAtById,
      pauseProgram,
      resetGoalProgress,
      removeProgram,
      restoreArchivedGoal,
      resetToToday,
      resolvedUserId,
      setMaxActivePrograms,
      setPrimaryProgram,
      setProgramActive,
      selectedCategories,
      selectedPrograms,
      submitTodayCheckIn,
      syncGoalsNow,
      toggleCategory,
      toggleProgram,
      mergedProgramById,
    ]
  );

  useEffect(() => {
    if (isStoreHydrated) {
      return;
    }

    if (isAuthLoading) {
      return;
    }

    const userId = user?.id;

    if (!userId) {
      setHasLoadedRemoteGoals(false);
      return;
    }

    let isActive = true;

    async function loadGoalsFromSupabase() {
      const { data, error } = await supabase
        .from('user_goals')
        .select('program_id,is_active')
        .eq('user_id', userId);

      if (!isActive) {
        return;
      }

      if (error) {
        console.warn('Failed to load goals from Supabase:', error.message);
        setHasLoadedRemoteGoals(true);
        return;
      }

      const rows = data ?? [];
      const nextPrograms: Program[] = [];
      const nextActiveIds: string[] = [];
      const seen = new Set<string>();

      for (const row of rows) {
        const programId = row.program_id as string;
        const program = mergedProgramById.get(programId);

        if (!program || seen.has(programId)) {
          continue;
        }

        seen.add(programId);
        nextPrograms.push(program);

        if (row.is_active) {
          nextActiveIds.push(programId);
        }
      }

      if (nextPrograms.length > 0) {
        isHydratingFromSupabaseRef.current = true;
        setSelectedPrograms(nextPrograms);
        setSelectedCategories([...new Set(nextPrograms.map((program) => program.category))]);

        const validActive = nextActiveIds
          .filter((id) => nextPrograms.some((program) => program.id === id))
          .slice(0, maxActivePrograms);
        setActiveProgramIds(validActive.length > 0 ? validActive : [nextPrograms[0].id]);
      }

      setHasLoadedRemoteGoals(true);
      setTimeout(() => {
        isHydratingFromSupabaseRef.current = false;
      }, 0);
    }

    loadGoalsFromSupabase();

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, isStoreHydrated, maxActivePrograms, mergedProgramById, user?.id]);

  useEffect(() => {
    if (isStoreHydrated) {
      return;
    }

    const userId = user?.id;

    if (isAuthLoading || !userId || !hasLoadedRemoteGoals || isHydratingFromSupabaseRef.current) {
      return;
    }
    const safeUserId = userId;

    async function syncGoalsToSupabase() {
      await persistGoalsToSupabase(safeUserId, selectedPrograms, activeProgramIds);
    }

    syncGoalsToSupabase();
  }, [activeProgramIds, hasLoadedRemoteGoals, isAuthLoading, isStoreHydrated, persistGoalsToSupabase, selectedPrograms, user?.id]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setNotificationPermissionGranted(false);
      return;
    }

    async function setupNotifications() {
      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      const settings = await Notifications.getPermissionsAsync();
      let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

      if (!granted) {
        const request = await Notifications.requestPermissionsAsync();
        granted = request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      setNotificationPermissionGranted(granted);
    }

    setupNotifications();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    async function rescheduleDailyReminders() {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const id of scheduledNotificationIdsRef.current) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      scheduledNotificationIdsRef.current = [];

      if (
        !notificationPermissionGranted ||
        !value.hasCompletedOnboarding ||
        value.todayCheckIn.status !== 'pending' ||
        value.dayOffset !== 0
      ) {
        return;
      }

      const now = new Date();
      const newIds: string[] = [];

      for (const reminderTime of REMINDER_TIMES) {
        const triggerDate = new Date();
        triggerDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

        if (triggerDate <= now) {
          continue;
        }

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Pulse • ${value.aiCoachMessage.title}`,
            body: value.aiCoachMessage.body,
            sound: false,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });

        newIds.push(id);
      }

      scheduledNotificationIdsRef.current = newIds;
    }

    rescheduleDailyReminders();
  }, [
    notificationPermissionGranted,
    value.aiCoachMessage.body,
    value.aiCoachMessage.title,
    value.dayOffset,
    value.hasCompletedOnboarding,
    value.todayCheckIn.status,
  ]);

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used within an AppSessionProvider');
  }

  return context;
}
