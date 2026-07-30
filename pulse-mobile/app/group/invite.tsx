import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { getErrorMessage } from '@/lib/error-message';
import {
  useDeleteGroup,
  useGroupInvite,
  useGroupMembers,
  useLeaveGroup,
  useMyGroup,
  useRegenerateGroupInvite,
} from '@/lib/queries/groups';

export default function InviteScreen() {
  const { data: group, isLoading: isGroupLoading } = useMyGroup();
  const { data: invite, isLoading: isInviteLoading, isError: isInviteError } = useGroupInvite(group?.id);
  const { data: members = [] } = useGroupMembers(group?.id);
  const regenerateInvite = useRegenerateGroupInvite(group?.id);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const [copied, setCopied] = useState(false);
  const isOwner = group?.role === 'owner';

  async function handleShare() {
    if (!invite || !group) {
      return;
    }

    await Share.share({
      message: `Join my Pulse group "${group.name}" with the code ${invite.code}.`,
    });
  }

  async function handleCopy() {
    if (!invite) {
      return;
    }

    await Clipboard.setStringAsync(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLeave() {
    if (!group) {
      return;
    }

    const willDeleteGroup = isOwner && members.length <= 1;
    const message = willDeleteGroup
      ? `You're the only member of "${group.name}". Leaving will delete this group and its invite code — check-in history you've already posted is kept.`
      : isOwner
        ? `You're the owner of "${group.name}". Leaving will hand ownership to the longest-standing other member.`
        : `You'll leave "${group.name}" and can join or create a different group any time.`;

    Alert.alert('Leave group?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave group',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveGroup.mutateAsync(group.id);
            router.back();
          } catch (leaveError) {
            Alert.alert('Could not leave the group', getErrorMessage(leaveError, 'Please try again.'));
          }
        },
      },
    ]);
  }

  function handleDeleteGroup() {
    if (!group || !isOwner) {
      return;
    }

    Alert.alert(
      'Delete group?',
      `This permanently deletes "${group.name}" for everyone. Existing goals and check-in history are kept as private history, but the group, members, invites, and group feed disappear.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete group',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup.mutateAsync(group.id);
              router.replace('/(tabs)/group');
            } catch (deleteError) {
              Alert.alert('Could not delete the group', getErrorMessage(deleteError, 'Please try again.'));
            }
          },
        },
      ]
    );
  }

  if (isGroupLoading || isInviteLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loading}>
          <ActivityIndicator color="#16a34a" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer compactTop disableAutomaticScrollInsets comfortableBottom>
      <View style={styles.header}>
        <Text style={styles.kicker}>{group?.name ?? 'Your group'}</Text>
        <Text style={styles.title}>Invite people</Text>
        <Text style={styles.subtitle}>
          Share this code with people you want in your private accountability group. Anyone with the code can join.
        </Text>
      </View>

      <View style={styles.codeCard}>
        {invite ? (
          <>
            <Text style={styles.codeLabel}>Active invite code</Text>
            <Text style={styles.code}>{invite.code}</Text>
            <View style={styles.codeActionsRow}>
              <Pressable style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share code</Text>
              </Pressable>
              <Pressable style={styles.copyButton} onPress={handleCopy}>
                <Text style={styles.copyButtonText}>{copied ? 'Copied!' : 'Copy'}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>
            {isInviteError ? 'Could not load the invite code.' : 'No active invite code yet.'}
          </Text>
        )}
      </View>

      {isOwner ? (
        <>
          <Pressable
            disabled={regenerateInvite.isPending}
            onPress={() => regenerateInvite.mutate()}
            style={[styles.secondaryButton, regenerateInvite.isPending && styles.secondaryButtonDisabled]}>
            <Text style={styles.secondaryButtonText}>
              {regenerateInvite.isPending ? 'Generating…' : invite ? 'Regenerate code' : 'Generate code'}
            </Text>
          </Pressable>
          {regenerateInvite.isError ? (
            <Text style={styles.error}>{getErrorMessage(regenerateInvite.error, 'Could not generate a code. Please try again.')}</Text>
          ) : null}
        </>
      ) : (
        <Text style={styles.ownerHint}>Only the group owner can regenerate this code.</Text>
      )}

      <Pressable disabled={leaveGroup.isPending || deleteGroup.isPending} onPress={handleLeave} style={styles.leaveButton}>
        {leaveGroup.isPending ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text style={styles.leaveButtonText}>Leave group</Text>
        )}
      </Pressable>

      {isOwner ? (
        <Pressable disabled={deleteGroup.isPending || leaveGroup.isPending} onPress={handleDeleteGroup} style={styles.deleteButton}>
          {deleteGroup.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete group</Text>
          )}
        </Pressable>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 60,
  },
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
    color: '#102a19',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  codeCard: {
    alignItems: 'center',
    backgroundColor: '#102a19',
    borderRadius: 28,
    gap: 16,
    padding: 28,
  },
  codeLabel: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  code: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 8,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 15,
    textAlign: 'center',
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    backgroundColor: '#16a34a',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: '#102a19',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  ownerHint: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  leaveButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  leaveButtonText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
