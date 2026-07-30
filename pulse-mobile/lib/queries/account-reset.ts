import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthSession } from '@/contexts/auth-session';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app-store';

export function useResetAccountData() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const setActiveGroupId = useAppStore((state) => state.setActiveGroupId);
  const setMaxActivePrograms = useAppStore((state) => state.setMaxActivePrograms);
  const setPrimaryGoalId = useAppStore((state) => state.setPrimaryGoalId);

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('You need to be signed in to reset your workspace.');
      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc('reset_my_workspace');

      if (!rpcError && rpcResult === 'reset') {
        return;
      }

      if (
        rpcError &&
        !rpcError.message.includes('reset_my_workspace') &&
        !rpcError.message.includes('Could not find the function')
      ) {
        throw rpcError;
      }

      await deleteOwnRows('reactions', userId);
      await deleteOwnRows('check_in_events', userId);
      await deleteOwnRows('check_ins', userId);
      await deleteOwnRows('goals', userId);
      await deleteOwnedGroups(userId);
      await deleteOwnRows('group_members', userId);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }
    },
    onSuccess: async () => {
      setActiveGroupId(null);
      setMaxActivePrograms(3);
      setPrimaryGoalId(null);
      await queryClient.invalidateQueries();
    },
  });
}

async function deleteOwnRows(tableName: string, userId: string) {
  const { error } = await supabase.from(tableName).delete().eq('user_id', userId);

  if (error) {
    throw error;
  }
}

async function deleteOwnedGroups(userId: string) {
  const { error } = await supabase.from('groups').delete().eq('owner_id', userId);

  if (error) {
    throw error;
  }
}
