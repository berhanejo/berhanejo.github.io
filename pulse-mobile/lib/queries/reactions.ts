import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthSession } from '@/contexts/auth-session';
import { supabase } from '@/lib/supabase';

export const KUDOS_EMOJI = '👏';

export type ReactionSummary = {
  count: number;
  reactedByMe: boolean;
};

export function useReactionsForCheckIns(checkInIds: string[]) {
  const { user } = useAuthSession();
  const userId = user?.id;
  const sortedIds = [...new Set(checkInIds)].sort();

  return useQuery({
    queryKey: ['reactions', sortedIds],
    enabled: sortedIds.length > 0,
    queryFn: async (): Promise<Record<string, ReactionSummary>> => {
      const { data, error } = await supabase.from('reactions').select('check_in_id, user_id').in('check_in_id', sortedIds);

      if (error) {
        throw error;
      }

      const summary: Record<string, ReactionSummary> = {};
      for (const row of data ?? []) {
        const existing = summary[row.check_in_id] ?? { count: 0, reactedByMe: false };
        existing.count += 1;
        if (row.user_id === userId) {
          existing.reactedByMe = true;
        }
        summary[row.check_in_id] = existing;
      }

      return summary;
    },
  });
}

export function useToggleKudos() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (params: { checkInId: string; reactedByMe: boolean }) => {
      if (!userId) {
        throw new Error('Not signed in.');
      }

      if (params.reactedByMe) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('check_in_id', params.checkInId)
          .eq('user_id', userId);
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase
        .from('reactions')
        .upsert({ check_in_id: params.checkInId, user_id: userId, emoji: KUDOS_EMOJI }, { onConflict: 'check_in_id,user_id' });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions'] });
    },
  });
}
