import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { useAppSession } from '@/contexts/app-session';
import { checkInByCategory } from '@/data/mock-data';
import { getErrorMessage } from '@/lib/error-message';
import { getCheckInCategoryContent } from '@/lib/check-in/category-content';

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
  const selectedGoal =
    activePrograms.find((program) => program.id === selectedGoalId) ??
    (requiresGoalSelection ? null : activePrograms[0] ?? null);
  const displayProgram = selectedGoal ?? currentProgram ?? null;
  const selectedGoalStatus =
    ownActiveGoalStatuses.find((item) => item.goalId === selectedGoal?.id) ??
    ownActiveGoalStatuses.find((item) => item.goalId === currentProgram?.id) ??
    null;
  const selectedGoalLatest =
    ownGoalLatestCheckIns.find((item) => item.goalId === selectedGoal?.id) ??
    ownGoalLatestCheckIns.find((item) => item.goalId === currentProgram?.id) ??
    null;
  const hasCheckedInToday = selectedGoalStatus?.status === 'done';
  const latestCheckInId = selectedGoalLatest?.checkInId ?? null;
  const latestCheckInCaption = selectedGoalLatest?.caption ?? null;
  const latestCheckInImageUri = selectedGoalLatest?.imageUri ?? null;
  const latestCheckInDate = selectedGoalLatest?.date ?? null;
  const displayCheckIn = selectedGoal
    ? (todayCheckIn ?? checkInByCategory[selectedGoal.category])
    : displayProgram
      ? checkInByCategory[displayProgram.category]
      : null;
  const publishTargets = useMemo(
    () => [
      {
        id: 'private',
        label: 'Private',
        helper: 'Only visible in your own progress',
        groupId: null,
      },
      ...groupSummaries.map((group) => ({
        id: group.id,
        label: group.name,
        helper: group.isActive ? 'Active group feed' : 'Group feed',
        groupId: group.id,
      })),
    ],
    [groupSummaries]
  );
  const selectedPublishTarget =
    publishTargets.find((target) => target.id === selectedPublishTargetId) ?? publishTargets[0];
  const canSubmit = Boolean(selectedGoal && caption.trim() && selectedImageUri && selectedPublishTarget);
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
      if (currentProgram?.id !== onlyGoalId) {
        setPrimaryProgram(onlyGoalId);
      }
      return;
    }

    setSelectedGoalId((prev) => (prev && activePrograms.some((program) => program.id === prev) ? prev : null));
  }, [activePrograms, currentProgram?.id, params.goalId, setPrimaryProgram]);

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

  useEffect(() => {
    setSelectedPublishTargetId(selectedGoal?.groupId ?? 'private');
  }, [selectedGoal?.groupId, selectedGoal?.id]);

  function handleSelectGoal(goalId: string) {
    setSelectedGoalId(goalId);
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
      await submitTodayCheckIn(selectedGoal.id, caption, selectedImageUri, selectedPublishTarget.groupId);
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
