import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { ScreenContainer, ScreenList } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';
import { getErrorMessage } from '@/lib/error-message';
import { useDeleteGroup } from '@/lib/queries/groups';
import { useReactionsForCheckIns, useToggleKudos } from '@/lib/queries/reactions';

const statusColors = {
  done: '#16a34a',
  pending: '#d97706',
  missed: '#dc2626',
  completed: '#15803d',
} as const;

const statusBackgrounds = {
  done: '#dcfce7',
  pending: '#fef3c7',
  missed: '#fee2e2',
  completed: '#dcfce7',
} as const;

type FeedItemData = {
  id: string;
  userName: string;
  goalTitle: string;
  caption: string;
  imageUri: string;
  timestampLabel: string;
  status: 'done' | 'completed';
  reactionCount: number;
  reactedByMe: boolean;
  isMine: boolean;
  onToggleKudos: (checkInId: string, reactedByMe: boolean) => void;
  onDelete: (checkInId: string) => void;
};

type TodayStatusItemData = {
  id: string;
  userId: string;
  userName: string;
  goalId: string;
  goalTitle: string;
  date: string;
  status: 'done' | 'pending' | 'missed';
  caption: string | null;
  imageUri: string | null;
  timestampLabel: string | null;
};

const FeedItem = memo(function FeedItem({ item }: { item: FeedItemData }) {
  return (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <Avatar name={item.userName} size={38} />
        <View style={styles.feedMeta}>
          <Text style={styles.feedUser}>{item.userName}</Text>
          <View style={styles.feedGoalRow}>
            <MaterialIcons name="check-circle" size={13} color="#16a34a" />
            <Text style={styles.feedGoal}>{item.goalTitle}</Text>
          </View>
        </View>
        <Text style={styles.feedTimestamp}>{item.timestampLabel}</Text>
      </View>

      {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.feedImage} /> : null}

      <View style={styles.feedActionsRow}>
        <View style={styles.feedReactionWrap}>
          <Pressable
            hitSlop={8}
            onPress={() => item.onToggleKudos(item.id, item.reactedByMe)}
            style={({ pressed }) => [styles.kudosButton, pressed && styles.buttonPressed]}>
            <MaterialIcons
              name={item.reactedByMe ? 'favorite' : 'favorite-border'}
              size={24}
              color={item.reactedByMe ? '#dc2626' : '#102a19'}
            />
          </Pressable>
          {item.reactionCount > 0 ? (
            <Text style={styles.reactionCount}>
              {item.reactionCount} {item.reactionCount === 1 ? 'kudos' : 'kudos'}
            </Text>
          ) : null}
        </View>
        {item.isMine ? (
          <Pressable
            hitSlop={8}
            onPress={() => item.onDelete(item.id)}
            style={({ pressed }) => [styles.feedDeleteButton, pressed && styles.buttonPressed]}>
            <MaterialIcons name="delete-outline" size={20} color="#991b1b" />
            <Text style={styles.feedDeleteText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>

      {item.caption ? (
        <Text style={styles.feedCaption}>
          <Text style={styles.feedCaptionUser}>{item.userName} </Text>
          {item.caption}
        </Text>
      ) : null}
    </View>
  );
});

const TodayStatusItem = memo(function TodayStatusItem({ item }: { item: TodayStatusItemData }) {
  return (
    <View style={styles.todayStatusCard}>
      <View style={styles.todayStatusHeader}>
        <Avatar name={item.userName} size={30} />
        <View style={styles.todayStatusMeta}>
          <Text style={styles.todayStatusUser}>{item.userName}</Text>
          <Text style={styles.todayStatusGoal}>{item.goalTitle}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBackgrounds[item.status] }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.todayStatusImage} /> : null}
      {item.caption ? <Text style={styles.todayStatusCaption}>{item.caption}</Text> : null}
      {item.timestampLabel ? <Text style={styles.todayStatusTimestamp}>{item.timestampLabel}</Text> : null}
    </View>
  );
});

function StatusDetailModal({
  item,
  visible,
  onClose,
  onOpenCheckIn,
}: {
  item: TodayStatusItemData | null;
  visible: boolean;
  onClose: () => void;
  onOpenCheckIn: (goalId: string) => void;
}) {
  if (!item) {
    return null;
  }

  const hasProof = Boolean(item.caption || item.imageUri);
  const canOpenCheckIn = item.userName === 'You' && item.status !== 'done';

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.statusDetailCard}>
          <View style={styles.statusDetailHeader}>
            <View>
              <Text style={styles.cardEyebrow}>Status detail</Text>
              <Text style={styles.statusDetailTitle}>{item.goalTitle}</Text>
            </View>
            <Pressable hitSlop={8} onPress={onClose} style={styles.modalCloseButton}>
              <MaterialIcons name="close" size={22} color="#102a19" />
            </Pressable>
          </View>

          <View style={styles.statusDetailMetaRow}>
            <Avatar name={item.userName} size={34} />
            <View style={styles.statusDetailMeta}>
              <Text style={styles.todayStatusUser}>{item.userName}</Text>
              <Text style={styles.todayStatusTimestamp}>{item.timestampLabel ?? item.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBackgrounds[item.status] }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors[item.status] }]}>{item.status}</Text>
            </View>
          </View>

          {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.statusDetailImage} /> : null}

          {hasProof ? (
            <View style={styles.statusDetailProof}>
              <Text style={styles.cardEyebrow}>What was done</Text>
              <Text style={styles.statusDetailText}>{item.caption ?? 'Photo proof was posted without a note.'}</Text>
            </View>
          ) : (
            <View style={styles.statusDetailProof}>
              <Text style={styles.cardEyebrow}>What was done</Text>
              <Text style={styles.statusDetailText}>
                {item.status === 'missed'
                  ? 'No proof was posted for this challenge.'
                  : 'No proof has been posted yet. This challenge is still open.'}
              </Text>
            </View>
          )}

          {canOpenCheckIn ? (
            <Pressable
              onPress={() => {
                onClose();
                onOpenCheckIn(item.goalId);
              }}
              style={({ pressed }) => [styles.statusDetailAction, pressed && styles.buttonPressed]}>
              <Text style={styles.statusDetailActionText}>Open Check-in</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

type MemberStory = {
  userId: string;
  userName: string;
  status: 'done' | 'partial' | 'pending';
};

const StoryAvatar = memo(function StoryAvatar({ story }: { story: MemberStory }) {
  const ringStyle =
    story.status === 'done' ? styles.storyRingDone : story.status === 'partial' ? styles.storyRingPartial : styles.storyRingPending;

  return (
    <View style={styles.storyItem}>
      <View style={[styles.storyRing, ringStyle]}>
        <Avatar name={story.userName} size={54} />
      </View>
      <Text numberOfLines={1} style={styles.storyName}>
        {story.userName}
      </Text>
    </View>
  );
});

const ListHeader = memo(function ListHeader({
  groupName,
  memberCount,
  memberStories,
  doneCount,
  pendingCount,
  missedCount,
  todayStatusItems,
  ownTodayStatusItems,
  onOpenPendingGoal,
  onOpenStatusDetail,
  isConfirmingActiveGroupDelete,
  isDeletingActiveGroup,
  activeGroupDeleteError,
  onRequestDeleteActiveGroup,
  onCancelDeleteActiveGroup,
  onConfirmDeleteActiveGroup,
  groupSummaries,
  activeGroupId,
  onSelectGroup,
}: {
  groupName: string;
  memberCount: number;
  groupSummaries: { id: string; name: string; role: 'owner' | 'member'; isActive: boolean }[];
  activeGroupId: string | null;
  memberStories: MemberStory[];
  doneCount: number;
  pendingCount: number;
  missedCount: number;
  todayStatusItems: TodayStatusItemData[];
  ownTodayStatusItems: TodayStatusItemData[];
  onOpenPendingGoal: (goalId: string) => void;
  onOpenStatusDetail: (item: TodayStatusItemData) => void;
  isConfirmingActiveGroupDelete: boolean;
  isDeletingActiveGroup: boolean;
  activeGroupDeleteError: string | null;
  onRequestDeleteActiveGroup: () => void;
  onCancelDeleteActiveGroup: () => void;
  onConfirmDeleteActiveGroup: () => void;
  onSelectGroup: (groupId: string | null) => void;
}) {
  const ownDoneCount = ownTodayStatusItems.filter((item) => item.status === 'done').length;
  const ownPendingCount = ownTodayStatusItems.filter((item) => item.status === 'pending').length;
  const firstDoneStatus = todayStatusItems.find((item) => item.status === 'done');
  const firstPendingStatus = todayStatusItems.find((item) => item.status === 'pending');
  const firstMissedStatus = todayStatusItems.find((item) => item.status === 'missed');
  const activeGroupSummary = groupSummaries.find((group) => group.id === activeGroupId) ?? null;
  const canDeleteActiveGroup = activeGroupSummary?.role === 'owner';

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.kicker}>Group</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/onboarding/group')} style={styles.newGroupButton}>
              <Text style={styles.newGroupButtonText}>New group</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/group/invite')} style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>Invite</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.title}>Activity feed</Text>
        <Text style={styles.subtitle}>Private accountability stream for {groupName}. Status is shown per challenge.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupSwitcherRow}>
        <Pressable
          onPress={() => onSelectGroup(null)}
          style={[styles.groupSwitchChip, !activeGroupId && styles.groupSwitchChipActive]}>
          <Text style={[styles.groupSwitchName, !activeGroupId && styles.groupSwitchNameActive]}>Private</Text>
          <Text style={[styles.groupSwitchRole, !activeGroupId && styles.groupSwitchRoleActive]}>only you</Text>
        </Pressable>
        {groupSummaries.map((group) => (
          <Pressable
            key={group.id}
            onPress={() => onSelectGroup(group.id)}
            style={[styles.groupSwitchChip, group.isActive && styles.groupSwitchChipActive]}>
            <Text style={[styles.groupSwitchName, group.isActive && styles.groupSwitchNameActive]}>{group.name}</Text>
            <Text style={[styles.groupSwitchRole, group.isActive && styles.groupSwitchRoleActive]}>{group.role}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => router.push('/onboarding/group')} style={styles.groupSwitchNewChip}>
          <MaterialIcons name="add" size={18} color="#16a34a" />
          <Text style={styles.groupSwitchNewText}>New group</Text>
        </Pressable>
      </ScrollView>

      {canDeleteActiveGroup ? (
        <View style={styles.groupDangerCard}>
          <View style={styles.groupDangerTextWrap}>
            <Text style={styles.groupDangerTitle}>Manage {activeGroupSummary.name}</Text>
            <Text style={styles.groupDangerText}>
              {isConfirmingActiveGroupDelete
                ? 'This deletes the group for everyone. Existing progress is kept as private history.'
                : 'Delete this group here without opening invite settings.'}
            </Text>
            {activeGroupDeleteError ? <Text style={styles.groupDangerError}>{activeGroupDeleteError}</Text> : null}
          </View>
          {isConfirmingActiveGroupDelete ? (
            <View style={styles.groupDeleteConfirmActions}>
              <Pressable
                disabled={isDeletingActiveGroup}
                onPress={onCancelDeleteActiveGroup}
                style={({ pressed }) => [styles.groupCancelDeleteButton, pressed && !isDeletingActiveGroup && styles.buttonPressed]}>
                <Text style={styles.groupCancelDeleteButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={isDeletingActiveGroup}
                onPress={onConfirmDeleteActiveGroup}
                style={({ pressed }) => [styles.groupDeleteButton, isDeletingActiveGroup && styles.groupDeleteButtonDisabled, pressed && !isDeletingActiveGroup && styles.buttonPressed]}>
                <MaterialIcons name="delete-outline" size={18} color="#ffffff" />
                <Text style={styles.groupDeleteButtonText}>{isDeletingActiveGroup ? 'Deleting' : 'Delete permanently'}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onRequestDeleteActiveGroup}
              style={({ pressed }) => [styles.groupDeleteButton, pressed && styles.buttonPressed]}>
              <MaterialIcons name="delete-outline" size={18} color="#ffffff" />
              <Text style={styles.groupDeleteButtonText}>Delete</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      {memberStories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storyRow}>
          {memberStories.map((story) => (
            <StoryAvatar key={story.userId} story={story} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today&apos;s Challenge Overview</Text>
          <Text style={styles.summaryMeta}>{memberCount} members</Text>
        </View>
        <View style={styles.statsRow}>
          <Pressable
            disabled={!firstDoneStatus}
            onPress={() => firstDoneStatus && onOpenStatusDetail(firstDoneStatus)}
            style={({ pressed }) => [styles.statChip, styles.doneChip, pressed && styles.buttonPressed]}>
            <Text style={styles.statValue}>{doneCount}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </Pressable>
          <Pressable
            disabled={!firstPendingStatus}
            onPress={() => firstPendingStatus && onOpenStatusDetail(firstPendingStatus)}
            style={({ pressed }) => [styles.statChip, styles.pendingChip, pressed && styles.buttonPressed]}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Pressable>
          <Pressable
            disabled={!firstMissedStatus}
            onPress={() => firstMissedStatus && onOpenStatusDetail(firstMissedStatus)}
            style={({ pressed }) => [styles.statChip, styles.missedChip, pressed && styles.buttonPressed]}>
            <Text style={styles.statValue}>{missedCount}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.myChecklistCard}>
        <View style={styles.myChecklistHeader}>
          <Text style={styles.myChecklistTitle}>Your goals today</Text>
          <Text style={styles.myChecklistMeta}>
            {ownDoneCount} done, {ownPendingCount} open
          </Text>
        </View>
        <View style={styles.myChecklistList}>
          {ownTodayStatusItems.map((item) => (
            <Pressable
              key={`own-${item.id}`}
              onPress={() => onOpenStatusDetail(item)}
              style={({ pressed }) => [styles.myChecklistItem, pressed && styles.buttonPressed]}>
              <Text style={styles.myChecklistGoal}>{item.goalTitle}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBackgrounds[item.status] }]}>
                <Text style={[styles.statusBadgeText, { color: statusColors[item.status] }]}>{item.status}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.todaySection}>
        <Text style={styles.sectionTitle}>Today&apos;s status by challenge</Text>
        <Text style={styles.sectionSubtitle}>Tap a status to see the proof, note, and what is still open today.</Text>
      </View>
      <View style={styles.todayStatusList}>
        {todayStatusItems.map((item) => {
          const isOwnPending = item.userName === 'You' && item.status === 'pending';

          if (!isOwnPending) {
            return (
              <Pressable
                key={item.id}
                onPress={() => onOpenStatusDetail(item)}
                style={({ pressed }) => [pressed && styles.buttonPressed]}>
                <TodayStatusItem item={item} />
              </Pressable>
            );
          }

          return (
            <View key={item.id} style={styles.todayStatusPressable}>
              <View style={styles.todayStatusTapWrap}>
                <Pressable onPress={() => onOpenStatusDetail(item)}>
                  <TodayStatusItem item={item} />
                </Pressable>
              </View>
              <View style={styles.todayStatusActionRow}>
                <Text style={styles.todayStatusActionHint}>Pending for you</Text>
                <Pressable onPress={() => onOpenPendingGoal(item.goalId)}>
                  <Text style={styles.todayStatusActionLink}>Open Check-in</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.feedSection}>
        <Text style={styles.sectionTitle}>Recent completed check-ins</Text>
        <Text style={styles.sectionSubtitle}>Only completed challenge check-ins from your group are listed.</Text>
      </View>
    </>
  );
});

export default function GroupScreen() {
  const {
    currentUser,
    activeGroupId,
    groupName,
    groupMembers,
    groupActivityFeed,
    todayChallengeStatuses,
    groupSummaries,
    setActiveGroup,
    setPrimaryProgram,
    deleteCheckIn,
  } = useAppSession();
  const [selectedStatusItem, setSelectedStatusItem] = useState<TodayStatusItemData | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null);
  const feedCheckInIds = useMemo(() => groupActivityFeed.map((item) => item.id), [groupActivityFeed]);
  const { data: reactionsByCheckIn = {} } = useReactionsForCheckIns(feedCheckInIds);
  const toggleKudosMutation = useToggleKudos();
  const deleteGroupMutation = useDeleteGroup();
  const handleToggleKudos = useCallback(
    (checkInId: string, reactedByMe: boolean) => {
      toggleKudosMutation.mutate({ checkInId, reactedByMe });
    },
    [toggleKudosMutation]
  );
  const handleDeletePost = useCallback(
    (checkInId: string) => {
      Alert.alert('Delete post?', 'This removes the proof from your feed and today will become open again.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCheckIn(checkInId).catch((error) => {
              console.warn('Delete check-in failed:', error);
              Alert.alert('Could not delete post', 'Please try again.');
            });
          },
        },
      ]);
    },
    [deleteCheckIn]
  );
  const handleDeleteActiveGroup = useCallback(() => {
    const activeGroup = groupSummaries.find((group) => group.id === activeGroupId);
    if (!activeGroup || activeGroup.role !== 'owner') {
      return;
    }

    setDeleteGroupError(null);
    deleteGroupMutation.mutate(activeGroup.id, {
      onSuccess: () => {
        setConfirmDeleteGroupId(null);
        setDeleteGroupError(null);
      },
      onError: (error) => {
        console.warn('Delete group failed:', error);
        setDeleteGroupError(getErrorMessage(error, 'Please try again.'));
      },
    });
  }, [activeGroupId, deleteGroupMutation, groupSummaries]);
  const requestDeleteActiveGroup = useCallback(() => {
    const activeGroup = groupSummaries.find((group) => group.id === activeGroupId);
    if (!activeGroup || activeGroup.role !== 'owner') {
      return;
    }

    setDeleteGroupError(null);
    setConfirmDeleteGroupId(activeGroup.id);
  }, [activeGroupId, groupSummaries]);
  const cancelDeleteActiveGroup = useCallback(() => {
    setConfirmDeleteGroupId(null);
    setDeleteGroupError(null);
  }, []);
  const { doneCount, pendingCount, missedCount } = useMemo(
    () =>
      todayChallengeStatuses.reduce(
        (acc, item) => {
          if (item.status === 'done') {
            acc.doneCount += 1;
          } else if (item.status === 'pending') {
            acc.pendingCount += 1;
          } else {
            acc.missedCount += 1;
          }

          return acc;
        },
        { doneCount: 0, pendingCount: 0, missedCount: 0 }
      ),
    [todayChallengeStatuses]
  );
  const ownTodayStatuses = useMemo(
    () => todayChallengeStatuses.filter((item) => item.userName === 'You'),
    [todayChallengeStatuses]
  );
  const memberStories = useMemo<MemberStory[]>(() => {
    const statusesByUser = new Map<string, ('done' | 'pending' | 'missed')[]>();
    for (const item of todayChallengeStatuses) {
      const list = statusesByUser.get(item.userId) ?? [];
      list.push(item.status);
      statusesByUser.set(item.userId, list);
    }

    return groupMembers.map((member) => {
      const statuses = statusesByUser.get(member.id) ?? [];
      const doneCountForMember = statuses.filter((status) => status === 'done').length;
      let status: MemberStory['status'] = 'pending';
      if (statuses.length > 0 && doneCountForMember === statuses.length) {
        status = 'done';
      } else if (doneCountForMember > 0) {
        status = 'partial';
      }
      return { userId: member.id, userName: member.name, status };
    });
  }, [groupMembers, todayChallengeStatuses]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof groupActivityFeed)[number] }) => {
      const reaction = reactionsByCheckIn[item.id];

      return (
        <FeedItem
          item={{
            id: item.id,
            userName: item.userName,
            goalTitle: item.goalTitle,
            caption: item.caption,
            imageUri: item.imageUri,
            timestampLabel: item.timestampLabel,
            status: item.status,
            reactionCount: reaction?.count ?? 0,
            reactedByMe: reaction?.reactedByMe ?? false,
            isMine: item.userId === currentUser?.id || item.userName === 'You',
            onToggleKudos: handleToggleKudos,
            onDelete: handleDeletePost,
          }}
        />
      );
    },
    [currentUser?.id, handleDeletePost, handleToggleKudos, reactionsByCheckIn]
  );
  const keyExtractor = useCallback((item: (typeof groupActivityFeed)[number]) => item.id, []);
  const openPendingGoalCheckIn = useCallback(
    (goalId: string) => {
      setPrimaryProgram(goalId);
      router.push({
        pathname: '/check-in',
        params: { goalId },
      });
    },
    [setPrimaryProgram]
  );
  const header = useMemo(
    () => (
      <ListHeader
        groupName={groupName ?? 'Your Group'}
        memberCount={groupMembers.length}
        groupSummaries={groupSummaries}
        activeGroupId={activeGroupId}
        memberStories={memberStories}
        doneCount={doneCount}
        pendingCount={pendingCount}
        missedCount={missedCount}
        todayStatusItems={todayChallengeStatuses}
        ownTodayStatusItems={ownTodayStatuses}
        onOpenPendingGoal={openPendingGoalCheckIn}
        onOpenStatusDetail={setSelectedStatusItem}
        isConfirmingActiveGroupDelete={Boolean(activeGroupId && confirmDeleteGroupId === activeGroupId)}
        isDeletingActiveGroup={deleteGroupMutation.isPending}
        activeGroupDeleteError={deleteGroupError}
        onRequestDeleteActiveGroup={requestDeleteActiveGroup}
        onCancelDeleteActiveGroup={cancelDeleteActiveGroup}
        onConfirmDeleteActiveGroup={handleDeleteActiveGroup}
        onSelectGroup={setActiveGroup}
      />
    ),
    [
      groupName,
      activeGroupId,
      groupSummaries,
      doneCount,
      groupMembers.length,
      memberStories,
      missedCount,
      openPendingGoalCheckIn,
      handleDeleteActiveGroup,
      requestDeleteActiveGroup,
      cancelDeleteActiveGroup,
      confirmDeleteGroupId,
      deleteGroupError,
      deleteGroupMutation.isPending,
      ownTodayStatuses,
      pendingCount,
      setSelectedStatusItem,
      todayChallengeStatuses,
      setActiveGroup,
    ]
  );
  const emptyState = useMemo(
    () => (
      <EmptyState
        icon="photo-camera"
        title="No completed check-ins yet"
        text="As soon as your group posts challenge proof, it appears here in chronological order."
      />
    ),
    []
  );

  if (!groupName) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.kicker}>Group</Text>
          <Text style={styles.title}>Activity feed</Text>
        </View>
        <EmptyState
          icon="groups"
          title="You're not in a group yet"
          text="Create a private group or join one with an invite code to share check-ins and see each other's progress. A group is optional — you can keep tracking goals on your own too."
          actionLabel="Create or join a group"
          onAction={() => router.push('/onboarding/group')}
        />
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenList
        data={groupActivityFeed}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        ItemSeparatorComponent={ItemSeparator}
      />
      <StatusDetailModal
        item={selectedStatusItem}
        visible={Boolean(selectedStatusItem)}
        onClose={() => setSelectedStatusItem(null)}
        onOpenCheckIn={openPendingGoalCheckIn}
      />
    </>
  );
}

function ItemSeparator() {
  return <View style={styles.listGap} />;
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    paddingHorizontal: 4,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  newGroupButton: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  newGroupButtonText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inviteButton: {
    backgroundColor: '#102a19',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kicker: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#102a19',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  storyRow: {
    gap: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  groupSwitcherRow: {
    gap: 10,
    paddingHorizontal: 4,
  },
  groupSwitchChip: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 132,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  groupSwitchChipActive: {
    backgroundColor: '#102a19',
    borderColor: '#16a34a',
  },
  groupSwitchName: {
    color: '#102a19',
    fontSize: 14,
    fontWeight: '800',
  },
  groupSwitchNameActive: {
    color: '#ffffff',
  },
  groupSwitchRole: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase',
  },
  groupSwitchRoleActive: {
    color: '#86efac',
  },
  groupSwitchNewChip: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#bbf7d0',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    minWidth: 132,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  groupSwitchNewText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
  },
  groupDangerCard: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  groupDangerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  groupDangerTitle: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '800',
  },
  groupDangerText: {
    color: '#be123c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  groupDangerError: {
    color: '#7f1d1d',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 6,
  },
  groupDeleteConfirmActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  groupCancelDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#fecaca',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  groupCancelDeleteButtonText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  groupDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  groupDeleteButtonDisabled: {
    opacity: 0.55,
  },
  groupDeleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
    width: 66,
  },
  storyRing: {
    borderRadius: 999,
    borderWidth: 2.5,
    padding: 3,
  },
  storyRingDone: {
    borderColor: '#16a34a',
  },
  storyRingPartial: {
    borderColor: '#d97706',
  },
  storyRingPending: {
    borderColor: '#cbd5e1',
  },
  storyName: {
    color: '#2f5f3b',
    fontSize: 11,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#102a19',
    borderRadius: 26,
    padding: 22,
    gap: 14,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  myChecklistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    gap: 10,
    padding: 16,
  },
  myChecklistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  myChecklistTitle: {
    color: '#102a19',
    fontSize: 18,
    fontWeight: '700',
  },
  myChecklistMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  myChecklistList: {
    gap: 8,
  },
  myChecklistItem: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  myChecklistGoal: {
    color: '#102a19',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  summaryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  summaryMeta: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    borderRadius: 18,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  doneChip: {
    backgroundColor: '#14532d',
  },
  pendingChip: {
    backgroundColor: '#78350f',
  },
  missedChip: {
    backgroundColor: '#7f1d1d',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  todaySection: {
    gap: 4,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#102a19',
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 14,
  },
  todayStatusList: {
    gap: 10,
  },
  todayStatusPressable: {
    gap: 6,
  },
  todayStatusTapWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  todayStatusActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  todayStatusActionHint: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  todayStatusActionLink: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  todayStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    gap: 8,
    padding: 14,
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  todayStatusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  todayStatusMeta: {
    flex: 1,
    minWidth: 0,
  },
  todayStatusUser: {
    color: '#102a19',
    fontSize: 15,
    fontWeight: '700',
  },
  todayStatusGoal: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  todayStatusImage: {
    borderRadius: 12,
    height: 120,
    width: '100%',
  },
  todayStatusCaption: {
    color: '#2f5f3b',
    fontSize: 13,
    lineHeight: 18,
  },
  todayStatusTimestamp: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  feedSection: {
    gap: 4,
    paddingHorizontal: 4,
    marginTop: 6,
  },
  listGap: {
    height: 14,
  },
  feedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 12,
    padding: 18,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  feedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  feedMeta: {
    flex: 1,
    minWidth: 0,
  },
  feedUser: {
    color: '#102a19',
    fontSize: 15,
    fontWeight: '700',
  },
  feedGoalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  feedGoal: {
    color: '#64748b',
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  feedImage: {
    borderRadius: 14,
    height: 320,
    width: '100%',
  },
  feedActionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedReactionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  feedDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  feedDeleteText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reactionCount: {
    color: '#102a19',
    fontSize: 13,
    fontWeight: '700',
  },
  feedCaption: {
    color: '#2f5f3b',
    fontSize: 14,
    lineHeight: 20,
  },
  feedCaptionUser: {
    color: '#102a19',
    fontWeight: '700',
  },
  feedTimestamp: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  kudosButton: {
    padding: 4,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  statusDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 14,
    maxWidth: 520,
    padding: 18,
    width: '100%',
  },
  statusDetailHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusDetailTitle: {
    color: '#102a19',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    marginTop: 4,
  },
  modalCloseButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  statusDetailMetaRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  statusDetailMeta: {
    flex: 1,
    minWidth: 0,
  },
  statusDetailImage: {
    borderRadius: 16,
    height: 260,
    width: '100%',
  },
  statusDetailProof: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 6,
    padding: 14,
  },
  statusDetailText: {
    color: '#2f5f3b',
    fontSize: 14,
    lineHeight: 20,
  },
  statusDetailAction: {
    alignItems: 'center',
    backgroundColor: '#102a19',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  statusDetailActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
