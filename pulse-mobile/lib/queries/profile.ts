import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthSession } from '@/contexts/auth-session';
import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  displayName: string | null;
  onboardingCompleted: boolean;
};

function profileKey(userId: string | undefined) {
  return ['profile', userId] as const;
}

export function useProfile() {
  const { user } = useAuthSession();
  const userId = user?.id;

  return useQuery({
    queryKey: profileKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, onboarding_completed')
        .eq('id', userId as string)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        displayName: data.display_name,
        onboardingCompleted: data.onboarding_completed,
      };
    },
  });
}

export function useCompleteOnboarding() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Not signed in.');
      }

      // Upsert rather than update: self-heals accounts whose profiles row
      // is missing (e.g. pre-dating the auth.users trigger that now creates
      // it), where a plain UPDATE would silently match zero rows and leave
      // onboarding permanently incomplete.
      const { error } = await supabase.from('profiles').upsert({ id: userId, onboarding_completed: true });

      if (error) {
        throw error;
      }
    },
    // Returning (not just calling) invalidateQueries makes react-query await
    // the refetch before resolving mutateAsync(). This matters here: the
    // caller navigates to (tabs) immediately after this mutation resolves,
    // and the tabs layout's guard reads this same query on its very first
    // render — a fire-and-forget invalidate() can lose that race, serving
    // stale onboardingCompleted: false and bouncing the user right back to
    // onboarding in a loop.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKey(userId) }),
  });
}
