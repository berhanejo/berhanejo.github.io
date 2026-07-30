import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthSession } from '@/contexts/auth-session';
import { GoalCategory } from '@/data/mock-data';
import { formatDateKey } from '@/lib/derive/date';
import { useMyGroup } from '@/lib/queries/groups';
import { supabase } from '@/lib/supabase';
import { getSignedCheckInPhotoUrls, uploadCheckInPhoto } from '@/lib/supabase-storage';

export type CheckIn = {
  id: string;
  userId: string;
  goalId: string;
  groupId: string | null;
  runNumber: number;
  checkInDate: string;
  caption: string;
  photoPath: string | null;
  editedAt: string | null;
  createdAt: string;
  goalTitle?: string;
  goalCategory?: GoalCategory;
};

export type CheckInEvent = {
  id: string;
  checkInId: string | null;
  userId: string;
  eventType: 'created' | 'updated' | 'deleted';
  caption: string | null;
  photoPath: string | null;
  createdAt: string;
};

type CheckInRow = {
  id: string;
  user_id: string;
  goal_id: string;
  group_id: string | null;
  run_number: number;
  check_in_date: string;
  caption: string;
  photo_path: string | null;
  edited_at: string | null;
  created_at: string;
  goals?: { title: string; category: string } | { title: string; category: string }[] | null;
};

type CheckInEventRow = {
  id: string;
  check_in_id: string | null;
  user_id: string;
  event_type: string;
  caption: string | null;
  photo_path: string | null;
  created_at: string;
};

function mapCheckInRow(row: CheckInRow): CheckIn {
  const goal = Array.isArray(row.goals) ? row.goals[0] : row.goals;

  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    groupId: row.group_id,
    runNumber: row.run_number,
    checkInDate: row.check_in_date,
    caption: row.caption,
    photoPath: row.photo_path,
    editedAt: row.edited_at,
    createdAt: row.created_at,
    goalTitle: goal?.title,
    goalCategory: goal?.category as GoalCategory | undefined,
  };
}

function mapCheckInEventRow(row: CheckInEventRow): CheckInEvent {
  return {
    id: row.id,
    checkInId: row.check_in_id,
    userId: row.user_id,
    eventType: row.event_type as CheckInEvent['eventType'],
    caption: row.caption,
    photoPath: row.photo_path,
    createdAt: row.created_at,
  };
}

function myCheckInsKey(userId: string | undefined) {
  return ['my-check-ins', userId] as const;
}

function groupCheckInsKey(groupId: string | undefined) {
  return ['group-check-ins', groupId] as const;
}

function myCheckInEventsKey(userId: string | undefined) {
  return ['my-check-in-events', userId] as const;
}

export function useMyCheckIns() {
  const { user } = useAuthSession();
  const userId = user?.id;

  return useQuery({
    queryKey: myCheckInsKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<CheckIn[]> => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*, goals(title, category)')
        .eq('user_id', userId as string)
        .order('check_in_date', { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapCheckInRow);
    },
  });
}

export function useMyCheckInEvents() {
  const { user } = useAuthSession();
  const userId = user?.id;

  return useQuery({
    queryKey: myCheckInEventsKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<CheckInEvent[]> => {
      const { data, error } = await supabase
        .from('check_in_events')
        .select('*')
        .eq('user_id', userId as string)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapCheckInEventRow);
    },
  });
}

export function useGroupCheckIns(groupId: string | undefined) {
  return useQuery({
    queryKey: groupCheckInsKey(groupId),
    enabled: Boolean(groupId),
    queryFn: async (): Promise<CheckIn[]> => {
      const { data, error } = await supabase
        .from('check_ins')
        .select('*, goals(title, category)')
        .eq('group_id', groupId as string)
        .order('check_in_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapCheckInRow);
    },
  });
}

export function useSubmitCheckIn() {
  const { user } = useAuthSession();
  const { data: myGroup } = useMyGroup();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const groupId = myGroup?.id;

  return useMutation({
    mutationFn: async (input: {
      goalId: string;
      groupId?: string | null;
      runNumber: number;
      caption: string;
      localImageUri: string;
    }): Promise<CheckIn> => {
      if (!userId) {
        throw new Error('You need to be signed in to check in.');
      }

      const cleanCaption = input.caption.trim();
      if (!cleanCaption) {
        throw new Error('Add a short caption.');
      }

      const { data: inserted, error: insertError } = await supabase
        .from('check_ins')
        .insert({
          user_id: userId,
          goal_id: input.goalId,
          group_id: input.groupId === undefined ? groupId ?? null : input.groupId,
          run_number: input.runNumber,
          check_in_date: formatDateKey(new Date()),
          caption: cleanCaption,
        })
        .select('*')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error("You've already checked in for this goal today.");
        }
        throw insertError;
      }

      try {
        const photoPath = await uploadCheckInPhoto({
          // Photos not tied to a group live under a per-user "solo" prefix
          // (see the storage RLS policies in supabase/schema.sql).
          groupId: (input.groupId === undefined ? groupId : input.groupId) ?? 'solo',
          userId,
          checkInId: inserted.id,
          localUri: input.localImageUri,
        });

        const { data: updated, error: updateError } = await supabase
          .from('check_ins')
          .update({ photo_path: photoPath })
          .eq('id', inserted.id)
          .select('*')
          .single();

        if (updateError) {
          throw updateError;
        }

        const mapped = mapCheckInRow(updated);
        await supabase.from('check_in_events').insert({
          check_in_id: mapped.id,
          user_id: userId,
          event_type: 'created',
          caption: mapped.caption,
          photo_path: mapped.photoPath,
        });

        return mapped;
      } catch (uploadError) {
        console.warn('Photo upload failed; check-in was saved without a photo:', uploadError);
        const mapped = mapCheckInRow(inserted);
        await supabase.from('check_in_events').insert({
          check_in_id: mapped.id,
          user_id: userId,
          event_type: 'created',
          caption: mapped.caption,
          photo_path: mapped.photoPath,
        });
        return mapped;
      }
    },
    onSuccess: (checkIn) => {
      queryClient.invalidateQueries({ queryKey: myCheckInsKey(userId) });
      queryClient.invalidateQueries({ queryKey: myCheckInEventsKey(userId) });
      queryClient.invalidateQueries({ queryKey: groupCheckInsKey(checkIn.groupId ?? undefined) });
    },
  });
}

export function useUpdateCheckIn() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (input: { checkInId: string; caption: string }): Promise<CheckIn> => {
      const cleanCaption = input.caption.trim();
      if (!cleanCaption) {
        throw new Error('Caption cannot be empty.');
      }

      const { data, error } = await supabase
        .from('check_ins')
        .update({ caption: cleanCaption, edited_at: new Date().toISOString() })
        .eq('id', input.checkInId)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      const mapped = mapCheckInRow(data);
      await supabase.from('check_in_events').insert({
        check_in_id: mapped.id,
        user_id: mapped.userId,
        event_type: 'updated',
        caption: mapped.caption,
        photo_path: mapped.photoPath,
      });

      return mapped;
    },
    onSuccess: (checkIn) => {
      queryClient.invalidateQueries({ queryKey: myCheckInsKey(userId) });
      queryClient.invalidateQueries({ queryKey: myCheckInEventsKey(userId) });
      queryClient.invalidateQueries({ queryKey: groupCheckInsKey(checkIn.groupId ?? undefined) });
    },
  });
}

export function useDeleteCheckIn() {
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (checkInId: string): Promise<void> => {
      const { data: existing, error: readError } = await supabase
        .from('check_ins')
        .select('*')
        .eq('id', checkInId)
        .single();

      if (readError) {
        throw readError;
      }

      await supabase.from('check_in_events').insert({
        check_in_id: null,
        user_id: existing.user_id,
        event_type: 'deleted',
        caption: existing.caption,
        photo_path: existing.photo_path,
      });

      const { error } = await supabase.from('check_ins').delete().eq('id', checkInId);
      if (error) {
        throw error;
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: myCheckInsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: myCheckInEventsKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ['group-check-ins'] }),
      ]),
  });
}

export function useSignedPhotoUrls(paths: (string | null | undefined)[]) {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))].sort();

  return useQuery({
    queryKey: ['signed-photo-urls', uniquePaths],
    enabled: uniquePaths.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: () => getSignedCheckInPhotoUrls(uniquePaths),
  });
}
