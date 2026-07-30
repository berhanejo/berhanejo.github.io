import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useAuthSession } from '@/contexts/auth-session';
import type { Program } from '@/data/mock-data';
import { useDailyReminders } from '@/lib/notifications/use-daily-reminders';
import {
  useDeleteCheckIn,
  useGroupCheckIns,
  useMyCheckInEvents,
  useMyCheckIns,
  useSignedPhotoUrls,
  useSubmitCheckIn,
  useUpdateCheckIn,
} from '@/lib/queries/check-ins';
import {
  useCopyGoalToGroup,
  useCreateGoal,
  useGroupGoals,
  useMyGoals,
  useRestartGoal,
  useUpdateGoal,
  useUpdateGoalActivation,
} from '@/lib/queries/goals';
import { useGroupMembers, useMyGroups } from '@/lib/queries/groups';
import { useGroupRealtime } from '@/lib/realtime/use-group-realtime';
import { buildAppSessionViewModel } from '@/lib/session/app-session-view-model';
import { getActiveGoals } from '@/lib/session/goal-presenters';
import type { AppSessionActions, AppSessionContextValue, CreateCustomChallengeInput } from '@/lib/session/types';
import { useAppStore } from '@/stores/app-store';

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const userId = user?.id;

  const { data: groups = [] } = useMyGroups();
  const activeGroupIdPref = useAppStore((state) => state.activeGroupId);
  const setActiveGroupIdPref = useAppStore((state) => state.setActiveGroupId);
  const activeGroup = activeGroupIdPref
    ? groups.find((group) => group.id === activeGroupIdPref) ?? groups[0] ?? null
    : null;
  const groupId = activeGroup?.id;
  const { data: goals = [] } = useMyGoals();
  const { data: checkIns = [] } = useMyCheckIns();
  const { data: checkInEvents = [] } = useMyCheckInEvents();
  const { data: groupMembersRaw = [] } = useGroupMembers(groupId);
  const { data: groupGoals = [] } = useGroupGoals(groupId);
  const { data: groupCheckIns = [] } = useGroupCheckIns(groupId);
  useGroupRealtime(groupId);

  const maxActivePrograms = useAppStore((state) => state.maxActivePrograms);
  const setMaxActiveProgramsPref = useAppStore((state) => state.setMaxActivePrograms);
  const primaryGoalId = useAppStore((state) => state.primaryGoalId);
  const setPrimaryGoalIdPref = useAppStore((state) => state.setPrimaryGoalId);

  const createGoalMutation = useCreateGoal();
  const updateActivationMutation = useUpdateGoalActivation();
  const restartGoalMutation = useRestartGoal();
  const updateGoalMutation = useUpdateGoal();
  const copyGoalToGroupMutation = useCopyGoalToGroup();
  const submitCheckInMutation = useSubmitCheckIn();
  const updateCheckInMutation = useUpdateCheckIn();
  const deleteCheckInMutation = useDeleteCheckIn();

  const activeGoals = useMemo(() => getActiveGoals(goals), [goals]);
  const relevantPhotoPaths = useMemo(
    () => [...checkIns.map((entry) => entry.photoPath), ...groupCheckIns.map((entry) => entry.photoPath)],
    [checkIns, groupCheckIns]
  );
  const { data: signedUrlByPath = {} } = useSignedPhotoUrls(relevantPhotoPaths);

  const viewModel = useMemo(
    () =>
      buildAppSessionViewModel({
        user,
        userId,
        groups,
        activeGroupId: activeGroup?.id ?? null,
        goals,
        checkIns,
        checkInEvents,
        groupMembersRaw,
        groupGoals,
        groupCheckIns,
        signedUrlByPath,
        maxActivePrograms,
        primaryGoalId,
      }),
    [
      checkIns,
      checkInEvents,
      goals,
      groups,
      groupCheckIns,
      groupGoals,
      groupMembersRaw,
      maxActivePrograms,
      activeGroup?.id,
      primaryGoalId,
      signedUrlByPath,
      user,
      userId,
    ]
  );

  const actions = useMemo<AppSessionActions>(() => {
    async function addGoal(program: Program, groupId: string | null = null) {
      const shouldActivate = activeGoals.length < maxActivePrograms;
      await createGoalMutation.mutateAsync({
        category: program.category,
        title: program.title,
        durationDays: program.totalDays,
        isCustom: false,
        isActive: shouldActivate,
        groupId,
      });
    }

    async function createCustomChallenge(input: CreateCustomChallengeInput) {
      const cleanTitle = input.title.trim();
      if (!cleanTitle) {
        return;
      }

      const shouldActivate = activeGoals.length < maxActivePrograms;
      await createGoalMutation.mutateAsync({
        category: input.category,
        title: cleanTitle,
        durationDays: input.durationDays,
        isCustom: true,
        isActive: shouldActivate,
        groupId: input.groupId ?? null,
      });
    }

    function setProgramActive(goalId: string) {
      if (activeGoals.some((goal) => goal.id === goalId)) {
        return;
      }
      if (activeGoals.length >= maxActivePrograms) {
        return;
      }
      updateActivationMutation.mutate({ goalId, isActive: true });
    }

    function setPrimaryProgram(goalId: string) {
      const isActiveAlready = activeGoals.some((goal) => goal.id === goalId);
      if (!isActiveAlready) {
        if (activeGoals.length >= maxActivePrograms) {
          return;
        }
        updateActivationMutation.mutate({ goalId, isActive: true });
      }
      setPrimaryGoalIdPref(goalId);
    }

    function pauseProgram(goalId: string) {
      updateActivationMutation.mutate({ goalId, isActive: false });
      if (primaryGoalId === goalId) {
        setPrimaryGoalIdPref(null);
      }
    }

    function resetGoalProgress(goalId: string) {
      restartGoalMutation.mutate(goalId);
    }

    async function submitTodayCheckIn(goalId: string, caption: string, imageUri: string, groupId?: string | null) {
      const goal = goals.find((entry) => entry.id === goalId);
      if (!goal) {
        return;
      }

      await submitCheckInMutation.mutateAsync({
        goalId,
        groupId: groupId === undefined ? goal.groupId : groupId,
        runNumber: goal.runNumber,
        caption,
        localImageUri: imageUri,
      });
    }

    return {
      setMaxActivePrograms: setMaxActiveProgramsPref,
      setActiveGroup: setActiveGroupIdPref,
      addGoal,
      createCustomChallenge,
      setProgramActive,
      setPrimaryProgram,
      pauseProgram,
      resetGoalProgress,
      submitTodayCheckIn,
      updateCheckIn: async (checkInId, caption) => {
        await updateCheckInMutation.mutateAsync({ checkInId, caption });
      },
      deleteCheckIn: async (checkInId) => {
        await deleteCheckInMutation.mutateAsync(checkInId);
      },
      updateGoal: async (input) => {
        await updateGoalMutation.mutateAsync(input);
      },
      copyGoalToGroup: async (goalId, groupId) => {
        await copyGoalToGroupMutation.mutateAsync({ goalId, groupId });
      },
    };
  }, [
    activeGoals,
    copyGoalToGroupMutation,
    createGoalMutation,
    deleteCheckInMutation,
    goals,
    maxActivePrograms,
    primaryGoalId,
    restartGoalMutation,
    setActiveGroupIdPref,
    setMaxActiveProgramsPref,
    setPrimaryGoalIdPref,
    submitCheckInMutation,
    updateCheckInMutation,
    updateActivationMutation,
    updateGoalMutation,
  ]);

  const value = useMemo<AppSessionContextValue>(() => ({ ...viewModel, ...actions }), [actions, viewModel]);

  useDailyReminders({
    currentProgram: viewModel.currentProgram,
    todayCheckIn: viewModel.todayCheckIn,
    aiCoachMessage: viewModel.aiCoachMessage,
  });

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(AppSessionContext);

  if (!context) {
    throw new Error('useAppSession must be used within an AppSessionProvider');
  }

  return context;
}
