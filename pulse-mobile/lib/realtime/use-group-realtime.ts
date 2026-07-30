import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { supabase } from '@/lib/supabase';

/**
 * Subscribes to live check-in/reaction updates for a group while the
 * screen using it is focused. Small private groups only, so a plain
 * invalidate-and-refetch on every event is simple and fast enough —
 * no need for manual cache patching.
 */
export function useGroupRealtime(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      if (!groupId) {
        return;
      }

      const channel = supabase
        .channel(`group:${groupId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'check_ins', filter: `group_id=eq.${groupId}` },
          () => {
            queryClient.invalidateQueries({ queryKey: ['group-check-ins', groupId] });
            queryClient.invalidateQueries({ queryKey: ['group-goals', groupId] });
          }
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
          queryClient.invalidateQueries({ queryKey: ['reactions'] });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [groupId, queryClient])
  );
}
