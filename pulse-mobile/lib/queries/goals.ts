import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthSession } from '@/contexts/auth-session';
import { GoalCategory } from '@/data/mock-data';
import { useMyGroup } from '@/lib/queries/groups';
import { formatDateKey } from '@/lib/derive/date';
import { supabase } from '@/lib/supabase';

export type Goal = {
  id: string;
  userId: string;
  groupId: string | null;
  category: GoalCategory;
  title: string;
  isCustom: boolean;
  durationDays: number;
  isActive: boolean;
  isArchived: boolean;
  runNumber: number;
  runStartedAt: string | null;
  createdAt: string;
};

type GoalRow = {
  id: string;
  user_id: string;
  group_id: string | null;
  category: string;
  title: string;
  is_custom: boolean;
  duration_days: number;
  is_active: boolean;
  is_archived: boolean;
  run_number: number;
  run_started_at: string | null;
  created_at: string;
};

function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    category: row.category as GoalCategory,
    title: row.title,
    isCustom: row.is_custom,
    durationDays: row.duration_days,
    isActive: row.is_active,
    isArchived: row.is_archived,
    runNumber: row.run_number,
    runStartedAt: row.run_started_at,
    createdAt: row.created_at,
  };
}

function myGoalsKey(userId: string | undefined) {
  return ['my-goals', userId] as const;
}

function groupGoalsKey(groupId: string | undefined) {
  return ['group-goals', groupId] as const;
}

export function useMyGoals() {
  const { user } = useAuthSession();
  const userId = user?.id;

  return useQuery({
    queryKey: myGoalsKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapGoalRow);
    },
  });
}

export function useGroupGoals(groupId: string | undefined) {
  return useQuery({
    queryKey: groupGoalsKey(groupId),
    enabled: Boolean(groupId),
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('group_id', groupId as string)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapGoalRow);
    },
  });
}

export function useCreateGoal() {
  const { user } = useAuthSession();
  const { data: myGroup } = useMyGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (input: {
      category: GoalCategory;
      title: string;
      durationDays: number;
      isCustom: boolean;
      isActive: boolean;
      groupId?: string | null;
    }): Promise<Goal> => {
      if (!userId) {
        throw new Error('You need to be signed in to add a goal.');
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          group_id: input.groupId === undefined ? myGroup?.id ?? null : input.groupId,
          category: input.category,
          title: input.title,
          is_custom: input.isCustom,
          duration_days: input.durationDays,
          is_active: input.isActive,
          run_started_at: formatDateKey(new Date()),
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return mapGoalRow(data);
    },
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: myGoalsKey(userId) });
      if (goal.groupId) {
        queryClient.invalidateQueries({ queryKey: groupGoalsKey(goal.groupId) });
      }
    },
  });
}

export function useUpdateGoal() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (input: {
      goalId: string;
      title?: string;
      durationDays?: number;
      isActive?: boolean;
      groupId?: string | null;
    }) => {
      const updates: {
        title?: string;
        duration_days?: number;
        is_active?: boolean;
        group_id?: string | null;
      } = {};

      if (input.title !== undefined) {
        const cleanTitle = input.title.trim();
        if (!cleanTitle) {
          throw new Error('Goal title cannot be empty.');
        }
        updates.title = cleanTitle;
      }

      if (input.durationDays !== undefined) {
        updates.duration_days = input.durationDays;
      }

      if (input.isActive !== undefined) {
        updates.is_active = input.isActive;
      }

      if (input.groupId !== undefined) {
        updates.group_id = input.groupId;
      }

      const { error } = await supabase.from('goals').update(updates).eq('id', input.goalId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: myGoalsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ['group-goals'] }),
      ]),
  });
}

export function useCopyGoalToGroup() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (input: { goalId: string; groupId: string }): Promise<Goal> => {
      if (!userId) {
        throw new Error('You need to be signed in to copy a goal.');
      }

      const { data: source, error: sourceError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', input.goalId)
        .eq('user_id', userId)
        .single();

      if (sourceError) {
        throw sourceError;
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          group_id: input.groupId,
          category: source.category,
          title: source.title,
          is_custom: source.is_custom,
          duration_days: source.duration_days,
          is_active: source.is_active,
          run_started_at: formatDateKey(new Date()),
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      return mapGoalRow(data);
    },
    onSuccess: (goal) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: myGoalsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: groupGoalsKey(goal.groupId ?? undefined) }),
      ]),
  });
}

export function useUpdateGoalActivation() {
  const { user } = useAuthSession();
  const { data: myGroup } = useMyGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (params: { goalId: string; isActive: boolean }) => {
      const { error } = await supabase.from('goals').update({ is_active: params.isActive }).eq('id', params.goalId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myGoalsKey(userId) });
      if (myGroup?.id) {
        queryClient.invalidateQueries({ queryKey: groupGoalsKey(myGroup.id) });
      }
    },
  });
}

export function useArchiveGoal() {
  const { user } = useAuthSession();
  const { data: myGroup } = useMyGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false, is_archived: true })
        .eq('id', goalId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myGoalsKey(userId) });
      if (myGroup?.id) {
        queryClient.invalidateQueries({ queryKey: groupGoalsKey(myGroup.id) });
      }
    },
  });
}

export function useRestartGoal() {
  const { user } = useAuthSession();
  const { data: myGroup } = useMyGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (goalId: string) => {
      const goals = queryClient.getQueryData<Goal[]>(myGoalsKey(userId)) ?? [];
      const goal = goals.find((entry) => entry.id === goalId);

      if (!goal) {
        throw new Error('Goal not found.');
      }

      const { error } = await supabase
        .from('goals')
        .update({ run_number: goal.runNumber + 1, run_started_at: formatDateKey(new Date()) })
        .eq('id', goalId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myGoalsKey(userId) });
      if (myGroup?.id) {
        queryClient.invalidateQueries({ queryKey: groupGoalsKey(myGroup.id) });
      }
    },
  });
}
