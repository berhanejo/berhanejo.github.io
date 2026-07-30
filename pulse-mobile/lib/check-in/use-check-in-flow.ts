import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { useAppSession } from '@/contexts/app-session';
import { checkInByCategory } from '@/data/mock-data';
import { getErrorMessage } from '@/lib/error-message';
import { getCheckInCategoryContent } from '@/lib/check-in/category-content';
import type { EnrichedGoal } from '@/lib/session/types';

type PublishTarget = {
  id: string;
  label: string;
  helper: string;
  groupId: string | null;
  matchingGoalIds?: string[];
};

function goalsMatch(a: EnrichedGoal, b: EnrichedGoal) {
  return a.title === b.title && a.category === b.category;
}

export function useCheckInFlow() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const {
    currentUser,
    activePrograms,
    groupSummaries,
    ownActiveGoalStatuses,
    ownGoalLatestCheckIns,
    currentProgram,
    todayCheckIn,
    setPrimaryProgram,
    submitTodayCheckIn,
    updateCheckIn,
    deleteCheckIn,
  } = useAppSession();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedPublishTargetId, setSelectedPublishTargetId] = useState('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requiresGoalSelection = activePrograms.length > 1;
  const selectedGoal = activePrograms.find((program) => program.id === selectedGoalId) ?? null;
  const matchingSelectedGoals = selectedGoal
    ? activePrograms.filter((program) => goalsMatch(program, selectedGoal))
    : [];
  const displayProgram = selectedGoal ?? currentProgram ?? null;
  const selectedGoalStatus =
    ownActiveGoalStatuses.find((item) => item.goalId === selectedGoal?.id) ??
    ownActiveGoalStatuses.find((item) => item.goalId === currentProgram?.id) ??
    null;
  const selectedGoalLatest =
    ownGoalLatestCheckIns.find((item) => item.goalId === selectedGoal?.id) ??
    ownGoalLatestCheckIns.find((item) => item.goalId === currentProgram?.id) ??
    null;
  const selectedGoalHasDuplicates = matchingSelectedGoals.length > 1;
  const latestCheckInId = selectedGoalLatest?.checkInId ?? null;
  const latestCheckInCaption = selectedGoalLatest?.caption ?? null;
  const latestCheckInImageUri = selectedGoalLatest?.imageUri ?? null;
  const latestCheckInDate = selectedGoalLatest?.date ?? null;
  const displayCheckIn = selectedGoal
    ? (todayCheckIn ?? checkInByCategory[selectedGoal.category])
    : displayProgram
      ? checkInByCategory[displayProgram.category]
      : null;
  const publishTargets = useMemo<PublishTarget[]>(() => {
    const targets: PublishTarget[] = [
      {
        id: 'private',
        label: 'Private',
        helper: `${activePrograms.filter((program) => program.groupId === null).length} private goals`,
        groupId: null,
      },
      ...groupSummaries.map((group) => ({
        id: group.id,
        label: group.name,
        helper: `${activePrograms.filter((program) => program.groupId === group.id).length} group goals`,
        groupId: group.id,
      })),
    ];

    if (selectedGoalHasDuplicates) {
      const groupedMatches = matchingSelectedGoals.filter((program) => program.groupId);
      if (groupedMatches.length > 1) {
        targets.unshift({
          id: `matching:${selectedGoal?.category}:${selectedGoal?.title}`,
          label: 'All matching groups',
          helper: `${groupedMatches.length} group copies of this goal`,
          groupId: null,
          matchingGoalIds: groupedMatches.map((program) => program.id),
        });
      }
    }

    return targets;
  }, [activePrograms, groupSummaries, matchingSelectedGoals, selectedGoal?.category, selectedGoal?.title, selectedGoalHasDuplicates]);
  const selectedPublishTarget =
    publishTargets.find((target) => target.id === selectedPublishTargetId) ?? publishTargets[0];
  const filteredActivePrograms = useMemo(() => {
    if (selectedPublishTarget?.matchingGoalIds) {
      return activePrograms.filter((program) => selectedPublishTarget.matchingGoalIds?.includes(program.id));
    }

    return activePrograms.filter((program) => program.groupId === selectedPublishTarget?.groupId);
  }, [activePrograms, selectedPublishTarget]);
  const selectedSubmitGoals = useMemo(() => {
    if (!selectedGoal) {
      return [];
    }

    if (selectedPublishTarget?.matchingGoalIds) {
      return filteredActivePrograms.filter((program) => goalsMatch(program, selectedGoal));
    }

    return filteredActivePrograms.filter((program) => program.id === selectedGoal.id);
  }, [filteredActivePrograms, selectedGoal, selectedPublishTarget]);
  const hasCheckedInToday =
    selectedSubmitGoals.length > 0 &&
    selectedSubmitGoals.every(
      (program) => ownActiveGoalStatuses.find((item) => item.goalId === program.id)?.status === 'done'
    );
  const pendingSubmitGoals = selectedSubmitGoals.filter(
    (program) => ownActiveGoalStatuses.find((item) => item.goalId === program.id)?.status !== 'done'
  );
  const canSubmit = Boolean(selectedGoal && pendingSubmitGoals.length > 0 && caption.trim() && selectedImageUri && selectedPublishTarget);
  const categoryContent = getCheckInCategoryContent(displayProgram?.category);

  useEffect(() => {
    const goalIdFromParams = typeof params.goalId === 'string' ? params.goalId : null;
    if (!goalIdFromParams) {
      return;
    }

    const match = activePrograms.find((program) => program.id === goalIdFromParams);
    if (!match) {
      return;
    }

    setSelectedGoalId(match.id);
    setSelectedPublishTargetId(match.groupId ?? 'private');
  }, [activePrograms, params.goalId]);

  useEffect(() => {
    const goalIdFromParams = typeof params.goalId === 'string' ? params.goalId : null;
    if (goalIdFromParams && activePrograms.some((program) => program.id === goalIdFromParams)) {
      return;
    }

    if (activePrograms.length === 0) {
      setSelectedGoalId(null);
      return;
    }

    if (activePrograms.length === 1) {
      const onlyGoalId = activePrograms[0].id;
      setSelectedGoalId(onlyGoalId);
      setSelectedPublishTargetId(activePrograms[0].groupId ?? 'private');
      if (currentProgram?.id !== onlyGoalId) {
        setPrimaryProgram(onlyGoalId);
      }
      return;
    }

    setSelectedGoalId((prev) => (prev && activePrograms.some((program) => program.id === prev) ? prev : null));
  }, [activePrograms, currentProgram?.id, params.goalId, setPrimaryProgram]);

  useEffect(() => {
    if (!selectedPublishTarget) {
      return;
    }

    setSelectedGoalId((prev) => {
      if (prev && filteredActivePrograms.some((program) => program.id === prev)) {
        return prev;
      }

      return filteredActivePrograms[0]?.id ?? null;
    });
  }, [filteredActivePrograms, selectedPublishTarget]);

  useEffect(() => {
    if (!hasCheckedInToday) {
      return;
    }

    setCaption('');
    setSelectedImageUri(null);
  }, [hasCheckedInToday]);

  useEffect(() => {
    setEditCaption(latestCheckInCaption ?? '');
  }, [latestCheckInCaption, latestCheckInId]);

  useEffect(() => {
    setCaption('');
    setSelectedImageUri(null);
  }, [selectedGoalId]);

  function handleSelectGoal(goalId: string) {
    const goal = activePrograms.find((program) => program.id === goalId);
    if (!goal) {
      return;
    }

    const matchingGroupGoals = activePrograms.filter((program) => goalsMatch(program, goal) && program.groupId);
    setSelectedGoalId(goalId);

    if (goal.groupId) {
      setSelectedPublishTargetId(goal.groupId);
    } else if (matchingGroupGoals.length > 1) {
      setSelectedPublishTargetId(`matching:${goal.category}:${goal.title}`);
    } else {
      setSelectedPublishTargetId('private');
    }
  }

  async function handleTakePhoto() {
    if (hasCheckedInToday || !selectedGoal) {
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Camera access is needed to take a photo. You can allow it in your device settings.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    setSubmitError(null);
    setSelectedImageUri(result.assets[0].uri);
  }

  async function handlePickImage() {
    if (hasCheckedInToday || !selectedGoal) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSubmitError('Photo library access is needed to select a photo. You can allow it in your device settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    setSubmitError(null);
    setSelectedImageUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!selectedGoal || !selectedImageUri || !caption.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      for (const goal of pendingSubmitGoals) {
        await submitTodayCheckIn(goal.id, caption, selectedImageUri, goal.groupId ?? selectedPublishTarget.groupId);
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (error) {
      console.warn('Submit check-in failed:', error);
      setSubmitError(getErrorMessage(error, 'Could not submit check-in.'));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateLatestCheckIn() {
    if (!latestCheckInId || !editCaption.trim()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateCheckIn(latestCheckInId, editCaption);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (error) {
      console.warn('Update check-in failed:', error);
      setSubmitError(getErrorMessage(error, 'Could not update check-in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteLatestCheckIn() {
    if (!latestCheckInId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await deleteCheckIn(latestCheckInId);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (error) {
      console.warn('Delete check-in failed:', error);
      setSubmitError(getErrorMessage(error, 'Could not delete check-in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    currentUser,
    activePrograms,
    filteredActivePrograms,
    publishTargets,
    selectedPublishTarget,
    selectedPublishTargetId,
    ownActiveGoalStatuses,
    selectedGoal,
    displayProgram,
    displayCheckIn,
    categoryContent,
    requiresGoalSelection,
    hasCheckedInToday,
    latestCheckInCaption,
    latestCheckInId,
    latestCheckInImageUri,
    latestCheckInDate,
    caption,
    editCaption,
    selectedImageUri,
    isSubmitting,
    submitError,
    canSubmit,
    setCaption,
    setEditCaption,
    setSelectedPublishTargetId,
    handleSelectGoal,
    handleTakePhoto,
    handlePickImage,
    handleSubmit,
    handleUpdateLatestCheckIn,
    handleDeleteLatestCheckIn,
  };
}
