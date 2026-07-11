import { router } from 'expo-router';
import { memo, useCallback, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenList } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';

const statusColors = {
  done: '#16a34a',
  pending: '#d97706',
  missed: '#dc2626',
  completed: '#1d4ed8',
} as const;

const statusBackgrounds = {
  done: '#dcfce7',
  pending: '#fef3c7',
  missed: '#fee2e2',
  completed: '#dbeafe',
} as const;

type FeedItemData = {
  id: string;
  userName: string;
  goalTitle: string;
  caption: string;
  imageUri: string;
  timestampLabel: string;
  status: 'done' | 'completed';
};

type TodayStatusItemData = {
  id: string;
  userId: string;
  userName: string;
  goalId: string;
  goalTitle: string;
  status: 'done' | 'pending' | 'missed';
  caption: string | null;
  imageUri: string | null;
  timestampLabel: string | null;
};

const FeedItem = memo(function FeedItem({ item }: { item: FeedItemData }) {
  return (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.feedMeta}>
          <Text style={styles.feedUser}>{item.userName}</Text>
          <Text style={styles.feedGoal}>{item.goalTitle}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBackgrounds[item.status] }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors[item.status] }]}>{item.status}</Text>
        </View>
      </View>

      {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.feedImage} /> : null}
      {item.caption ? <Text style={styles.feedCaption}>{item.caption}</Text> : null}

      <View style={styles.feedFooter}>
        <Text style={styles.feedTimestamp}>{item.timestampLabel}</Text>
        <Text style={styles.feedType}>Challenge check-in</Text>
      </View>
    </View>
  );
});

const TodayStatusItem = memo(function TodayStatusItem({ item }: { item: TodayStatusItemData }) {
  return (
    <View style={styles.todayStatusCard}>
      <View style={styles.todayStatusHeader}>
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

const ListHeader = memo(function ListHeader({
  groupName,
  memberCount,
  doneCount,
  pendingCount,
  missedCount,
  todayStatusItems,
  ownTodayStatusItems,
  onOpenPendingGoal,
}: {
  groupName: string;
  memberCount: number;
  doneCount: number;
  pendingCount: number;
  missedCount: number;
  todayStatusItems: TodayStatusItemData[];
  ownTodayStatusItems: TodayStatusItemData[];
  onOpenPendingGoal: (goalId: string) => void;
}) {
  const ownDoneCount = ownTodayStatusItems.filter((item) => item.status === 'done').length;
  const ownPendingCount = ownTodayStatusItems.filter((item) => item.status === 'pending').length;

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.kicker}>Group</Text>
        <Text style={styles.title}>Activity feed</Text>
        <Text style={styles.subtitle}>Private accountability stream for {groupName}. Status is shown per challenge.</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today&apos;s Challenge Overview</Text>
          <Text style={styles.summaryMeta}>{memberCount} members</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statChip, styles.doneChip]}>
            <Text style={styles.statValue}>{doneCount}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={[styles.statChip, styles.pendingChip]}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statChip, styles.missedChip]}>
            <Text style={styles.statValue}>{missedCount}</Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
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
              onPress={() => item.status !== 'done' && onOpenPendingGoal(item.goalId)}
              style={({ pressed }) => [styles.myChecklistItem, pressed && item.status !== 'done' && styles.buttonPressed]}>
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
        <Text style={styles.sectionSubtitle}>Each card is one member + one active challenge.</Text>
      </View>
      <View style={styles.todayStatusList}>
        {todayStatusItems.map((item) => {
          const isOwnPending = item.userName === 'You' && item.status === 'pending';

          if (!isOwnPending) {
            return <TodayStatusItem key={item.id} item={item} />;
          }

          return (
            <View key={item.id} style={styles.todayStatusPressable}>
              <View style={styles.todayStatusTapWrap}>
                <TodayStatusItem item={item} />
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
  const { currentUser, groupMembers, groupActivityFeed, todayChallengeStatuses, setPrimaryProgram } = useAppSession();
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

  const renderItem = useCallback(
    ({ item }: { item: FeedItemData }) => (
      <FeedItem
        item={{
          id: item.id,
          userName: item.userName,
          goalTitle: item.goalTitle,
          caption: item.caption,
          imageUri: item.imageUri,
          timestampLabel: item.timestampLabel,
          status: item.status,
        }}
      />
    ),
    []
  );
  const keyExtractor = useCallback((item: FeedItemData) => item.id, []);
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
        groupName={currentUser?.groupName ?? 'Your Group'}
        memberCount={groupMembers.length}
        doneCount={doneCount}
        pendingCount={pendingCount}
        missedCount={missedCount}
        todayStatusItems={todayChallengeStatuses}
        ownTodayStatusItems={ownTodayStatuses}
        onOpenPendingGoal={openPendingGoalCheckIn}
      />
    ),
    [currentUser?.groupName, doneCount, groupMembers.length, missedCount, openPendingGoalCheckIn, ownTodayStatuses, pendingCount, todayChallengeStatuses]
  );
  const emptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No completed check-ins yet</Text>
        <Text style={styles.emptyText}>As soon as your group posts challenge proof, it appears here in chronological order.</Text>
      </View>
    ),
    []
  );

  return (
    <ScreenList
      data={groupActivityFeed}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={emptyState}
      ItemSeparatorComponent={ItemSeparator}
    />
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
  kicker: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    padding: 22,
    gap: 14,
    shadowColor: '#0f172a',
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
    color: '#0f172a',
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
    color: '#0f172a',
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
    color: '#0f172a',
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
    color: '#2563eb',
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
    color: '#0f172a',
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
    color: '#334155',
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  feedHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  feedMeta: {
    flex: 1,
    minWidth: 0,
  },
  feedUser: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  feedGoal: {
    color: '#475569',
    fontSize: 14,
    marginTop: 2,
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
    height: 170,
    width: '100%',
  },
  feedCaption: {
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },
  feedFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  feedTimestamp: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  feedType: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    gap: 8,
    padding: 18,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
});
