import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthSession } from '@/contexts/auth-session';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/app-store';

export type GroupRole = 'owner' | 'member';

export type MyGroup = {
  id: string;
  name: string;
  ownerId: string;
  role: GroupRole;
};

export type GroupMember = {
  userId: string;
  displayName: string;
  role: GroupRole;
};

export type GroupInvite = {
  code: string;
  createdAt: string;
};

function myGroupsKey(userId: string | undefined) {
  return ['my-groups', userId] as const;
}

function groupMembersKey(groupId: string | undefined) {
  return ['group-members', groupId] as const;
}

function groupInviteKey(groupId: string | undefined) {
  return ['group-invite', groupId] as const;
}

/**
 * Confirms the current session with a real round-trip to Supabase Auth
 * before a security-sensitive write. Using the React-context user id alone
 * can race a just-completed sign-up/sign-in, where the app already has a
 * user object but the Postgrest client hasn't finished attaching the fresh
 * session token yet — this forces that to settle first.
 */
async function getConfirmedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.id) {
    throw new Error('Your session could not be confirmed. Please sign out and sign in again.');
  }

  return data.user.id;
}

export function useMyGroup() {
  const groupsQuery = useMyGroups();
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const activeGroup = groupsQuery.data?.find((group) => group.id === activeGroupId) ?? groupsQuery.data?.[0] ?? null;

  return {
    ...groupsQuery,
    data: activeGroup,
  };
}

export function useMyGroups() {
  const { user } = useAuthSession();
  const userId = user?.id;

  return useQuery({
    queryKey: myGroupsKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<MyGroup[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('role, groups(id, name, owner_id)')
        .eq('user_id', userId as string)
        .order('joined_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? [])
        .filter((row) => row.groups)
        .map((row) => {
          const group = row.groups as unknown as { id: string; name: string; owner_id: string };

          return {
            id: group.id,
            name: group.name,
            ownerId: group.owner_id,
            role: row.role as GroupRole,
          };
        });
    },
  });
}

export function useCreateGroup() {
  const { user } = useAuthSession();
  const setActiveGroupId = useAppStore((state) => state.setActiveGroupId);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (name: string): Promise<MyGroup> => {
      const cleanName = name.trim();
      if (!cleanName) {
        throw new Error('Give your group a name.');
      }

      const confirmedUserId = await getConfirmedUserId();

      const { data, error } = await supabase
        .from('groups')
        .insert({ name: cleanName, owner_id: confirmedUserId })
        .select('id, name, owner_id')
        .single();

      if (error) {
        throw error;
      }

      const { error: inviteError } = await supabase.rpc('create_group_invite', {
        p_group_id: data.id,
      });

      if (inviteError) {
        console.warn('Group created but failed to mint an initial invite code:', inviteError.message);
      }

      return { id: data.id, name: data.name, ownerId: data.owner_id, role: 'owner' };
    },
    // See the comment in lib/queries/profile.ts's useCompleteOnboarding:
    // returning (not just calling) invalidateQueries makes the mutation
    // await the refetch, so callers that navigate right after don't race a
    // still-stale myGroup cache.
    onSuccess: (group) => {
      setActiveGroupId(group.id);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: myGroupsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: groupInviteKey(group.id) }),
      ]);
    },
  });
}

export function useJoinGroupByCode() {
  const { user } = useAuthSession();
  const setActiveGroupId = useAppStore((state) => state.setActiveGroupId);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        throw new Error('Enter an invite code.');
      }

      await getConfirmedUserId();

      const { data, error } = await supabase.rpc('redeem_group_invite', { p_code: cleanCode });

      if (error) {
        if (error.message.includes('invalid_or_expired_invite')) {
          throw new Error('That invite code is invalid or expired.');
        }
        throw error;
      }

      return data as string;
    },
    onSuccess: (groupId) => {
      setActiveGroupId(groupId);
      return queryClient.invalidateQueries({ queryKey: myGroupsKey(userId) });
    },
  });
}

export function useLeaveGroup() {
  const { user } = useAuthSession();
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const setActiveGroupId = useAppStore((state) => state.setActiveGroupId);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (groupId?: string): Promise<void> => {
      const { error } = await supabase.rpc('leave_group', { p_group_id: groupId ?? activeGroupId });
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setActiveGroupId(null);
      return queryClient.invalidateQueries({ queryKey: myGroupsKey(userId) });
    },
  });
}

export function useDeleteGroup() {
  const { user } = useAuthSession();
  const activeGroupId = useAppStore((state) => state.activeGroupId);
  const setActiveGroupId = useAppStore((state) => state.setActiveGroupId);
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (groupId?: string): Promise<string> => {
      const targetGroupId = groupId ?? activeGroupId;
      if (!targetGroupId) {
        throw new Error('No active group.');
      }

      const confirmedUserId = await getConfirmedUserId();
      const { data: group, error: readError } = await supabase
        .from('groups')
        .select('id, name, owner_id')
        .eq('id', targetGroupId)
        .maybeSingle();

      if (readError) {
        throw readError;
      }

      if (!group) {
        throw new Error('This group was not found or your session cannot access it.');
      }

      if (group.owner_id !== confirmedUserId) {
        throw new Error('Only the group creator can delete this group.');
      }

      const { data: forceDeleted, error: forceDeleteError } = await supabase.rpc('force_delete_group', {
        p_group_id: targetGroupId,
      });

      if (!forceDeleteError && forceDeleted === 'deleted') {
        return targetGroupId;
      }

      if (
        forceDeleteError &&
        !forceDeleteError.message.includes('force_delete_group') &&
        !forceDeleteError.message.includes('Could not find the function')
      ) {
        throw forceDeleteError;
      }

      const { data: rpcDeleted, error: rpcV2Error } = await supabase.rpc('delete_group_v2', {
        p_group_id: targetGroupId,
      });

      if (!rpcV2Error && rpcDeleted === true) {
        return targetGroupId;
      }

      if (
        rpcV2Error &&
        !rpcV2Error.message.includes('delete_group_v2') &&
        !rpcV2Error.message.includes('Could not find the function')
      ) {
        throw rpcV2Error;
      }

      const { data: deletedGroup, error: deleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', targetGroupId)
        .eq('owner_id', confirmedUserId)
        .select('id')
        .maybeSingle();

      if (!deleteError && deletedGroup?.id) {
        return targetGroupId;
      }

      const { error: rpcError } = await supabase.rpc('delete_group', { p_group_id: targetGroupId });
      if (rpcError) {
        if (rpcError.message.includes('delete_group') || rpcError.message.includes('Could not find the function')) {
          throw new Error(
            'Supabase is missing the force_delete_group function or has not refreshed its schema cache. Run supabase/delete-group-rpc.sql in the Supabase SQL editor, wait a minute, then reload the app.'
          );
        }
        throw rpcError;
      }

      const { data: stillExists, error: verifyError } = await supabase
        .from('groups')
        .select('id')
        .eq('id', targetGroupId)
        .maybeSingle();

      if (verifyError) {
        throw verifyError;
      }

      if (stillExists) {
        throw new Error('Supabase accepted the delete request, but the group still exists. Check the groups delete policy.');
      }

      return targetGroupId;
    },
    onSuccess: (deletedGroupId) => {
      setActiveGroupId(null);
      queryClient.setQueryData<MyGroup[]>(myGroupsKey(userId), (groups) =>
        groups ? groups.filter((group) => group.id !== deletedGroupId) : groups
      );
      queryClient.removeQueries({ queryKey: groupMembersKey(deletedGroupId) });
      queryClient.removeQueries({ queryKey: groupInviteKey(deletedGroupId) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: myGroupsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ['my-goals', userId] }),
        queryClient.invalidateQueries({ queryKey: ['my-check-ins', userId] }),
        queryClient.invalidateQueries({ queryKey: ['group-goals'] }),
        queryClient.invalidateQueries({ queryKey: ['group-check-ins'] }),
      ]);
    },
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: groupMembersKey(groupId),
    enabled: Boolean(groupId),
    queryFn: async (): Promise<GroupMember[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, role, profiles(display_name)')
        .eq('group_id', groupId as string)
        .order('joined_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => {
        const profile = row.profiles as unknown as { display_name: string | null } | null;
        return {
          userId: row.user_id,
          displayName: profile?.display_name ?? 'Member',
          role: row.role as GroupRole,
        };
      });
    },
  });
}

export function useGroupInvite(groupId: string | undefined) {
  return useQuery({
    queryKey: groupInviteKey(groupId),
    enabled: Boolean(groupId),
    queryFn: async (): Promise<GroupInvite | null> => {
      const { data, error } = await supabase
        .from('group_invites')
        .select('code, created_at')
        .eq('group_id', groupId as string)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? { code: data.code, createdAt: data.created_at } : null;
    },
  });
}

export function useRegenerateGroupInvite(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!groupId) {
        throw new Error('No active group.');
      }

      const { data, error } = await supabase.rpc('create_group_invite', { p_group_id: groupId });

      if (error) {
        throw error;
      }

      return data as string;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: groupInviteKey(groupId) }),
  });
}
