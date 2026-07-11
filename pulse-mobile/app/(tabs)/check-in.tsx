import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { useAppSession } from '@/contexts/app-session';
import { checkInByCategory } from '@/data/mock-data';

export default function CheckInScreen() {
  const params = useLocalSearchParams<{ goalId?: string }>();
  const {
    currentUser,
    activePrograms,
    ownActiveGoalStatuses,
    ownGoalLatestCheckIns,
    currentProgram,
    todayCheckIn,
    setPrimaryProgram,
    submitTodayCheckIn,
  } =
    useAppSession();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const requiresGoalSelection = activePrograms.length > 1;
  const selectedGoal =
    activePrograms.find((program) => program.id === selectedGoalId) ??
    (requiresGoalSelection ? null : activePrograms[0] ?? null);
  const displayProgram = selectedGoal ?? currentProgram;
  const selectedGoalStatus =
    ownActiveGoalStatuses.find((item) => item.goalId === selectedGoal?.id) ??
    ownActiveGoalStatuses.find((item) => item.goalId === currentProgram.id) ??
    null;
  const selectedGoalLatest =
    ownGoalLatestCheckIns.find((item) => item.goalId === selectedGoal?.id) ??
    ownGoalLatestCheckIns.find((item) => item.goalId === currentProgram.id) ??
    null;
  const hasCheckedInToday = selectedGoalStatus?.status === 'done';
  const latestCheckInCaption = selectedGoalLatest?.caption ?? null;
  const latestCheckInImageUri = selectedGoalLatest?.imageUri ?? null;
  const latestCheckInDate = selectedGoalLatest?.date ?? null;
  const displayCheckIn = selectedGoal ? todayCheckIn : checkInByCategory[displayProgram.category];
  const canSubmit = Boolean(selectedGoal && caption.trim() && selectedImageUri);
  const categoryContent = {
    fitness: {
      icon: 'directions-run' as const,
      proofTitle: 'Show today’s movement proof',
      proofDescription:
        'Upload something that clearly shows you completed the session or movement goal.',
      captionTitle: 'Session note',
      captionHint: 'Add a short note about the session, effort, or what you completed.',
    },
    learning: {
      icon: 'school' as const,
      proofTitle: 'Show today’s learning proof',
      proofDescription:
        'Upload something that clearly shows you completed the study block or lesson.',
      captionTitle: 'Learning note',
      captionHint: 'Add a short note about what you learned, finished, or reviewed.',
    },
    reading: {
      icon: 'menu-book' as const,
      proofTitle: 'Show today’s reading proof',
      proofDescription:
        'Upload something that clearly shows your reading progress or reflection.',
      captionTitle: 'Reading note',
      captionHint: 'Add a short note about the chapter, page range, or one idea that stood out.',
    },
    mindset: {
      icon: 'self-improvement' as const,
      proofTitle: 'Show today’s reset proof',
      proofDescription:
        'Upload something that clearly shows you completed the reset, reflection, or journal step.',
      captionTitle: 'Reflection note',
      captionHint: 'Add a short note about your reset, reflection, or how you showed up today.',
    },
  }[displayProgram.category];

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
      if (currentProgram.id !== onlyGoalId) {
        setPrimaryProgram(onlyGoalId);
      }
      return;
    }

    setSelectedGoalId((prev) => (prev && activePrograms.some((program) => program.id === prev) ? prev : null));
  }, [activePrograms, currentProgram.id, params.goalId, setPrimaryProgram]);

  useEffect(() => {
    if (!hasCheckedInToday) {
      return;
    }

    setCaption('');
    setSelectedImageUri(null);
  }, [hasCheckedInToday]);

  useEffect(() => {
    setCaption('');
    setSelectedImageUri(null);
  }, [selectedGoalId]);

  function handleSelectGoal(goalId: string) {
    setSelectedGoalId(goalId);
  }

  async function handlePickImage() {
    if (hasCheckedInToday || !selectedGoal) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
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

    setSelectedImageUri(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!selectedGoal || !selectedImageUri || !caption.trim()) {
      return;
    }

    submitTodayCheckIn(selectedGoal.id, caption, selectedImageUri);
  }

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Check-in</Text>
          <Text style={styles.title}>Post proof for today</Text>
          <Text style={styles.subtitle}>
            {currentUser?.name ? `${currentUser.name}, ` : ''}keep it simple. Share one clear piece of proof for your{' '}
            {displayProgram.categoryLabel.toLowerCase()} goal and mark today as done.
          </Text>
        </View>

        <View style={styles.goalSelectorCard}>
          <View style={styles.goalSelectorHeader}>
            <Text style={styles.cardLabel}>Goal / Challenge</Text>
            <Text style={styles.goalSelectorMeta}>
              {activePrograms.length <= 1 ? 'Auto-selected' : 'Select one to post'}
            </Text>
          </View>
          {activePrograms.length > 0 ? (
            <View style={styles.goalSelectorList}>
              {activePrograms.map((program) => {
                const isSelected = selectedGoal?.id === program.id;
                const goalStatus = ownActiveGoalStatuses.find((item) => item.goalId === program.id)?.status ?? 'pending';
                const isDone = goalStatus === 'done';
                const isPending = goalStatus === 'pending';

                return (
                  <Pressable
                    key={program.id}
                    onPress={() => handleSelectGoal(program.id)}
                    style={({ pressed }) => [
                      styles.goalChip,
                      isSelected && styles.goalChipSelected,
                      pressed && styles.buttonPressed,
                    ]}>
                    <View style={styles.goalChipTopRow}>
                      <Text style={[styles.goalChipTitle, isSelected && styles.goalChipTitleSelected]}>{program.title}</Text>
                      {isSelected ? (
                        <View style={styles.goalChipSelectedBadge}>
                          <View style={styles.goalChipCheckWrap}>
                            <MaterialIcons name="check" size={12} color="#2563eb" />
                          </View>
                          <Text style={styles.goalChipSelectedBadgeText}>Selected</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.goalChipMeta, isSelected && styles.goalChipMetaSelected]}>{program.categoryLabel}</Text>
                    <View
                      style={[
                        styles.goalChipStatusBadge,
                        isDone
                          ? styles.goalChipStatusBadgeDone
                          : isPending
                            ? styles.goalChipStatusBadgePending
                            : styles.goalChipStatusBadgeMissed,
                      ]}>
                      <Text
                        style={[
                          styles.goalChipStatusBadgeText,
                          isDone
                            ? styles.goalChipStatusBadgeTextDone
                            : isPending
                              ? styles.goalChipStatusBadgeTextPending
                              : styles.goalChipStatusBadgeTextMissed,
                        ]}>
                        {goalStatus}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.goalMissingText}>No active goals. Activate one goal first.</Text>
          )}
          {requiresGoalSelection && !selectedGoal ? (
            <Text style={styles.goalRequiredText}>Choose a goal before posting today&apos;s check-in.</Text>
          ) : null}
        </View>

        <View style={styles.contextCard}>
          <View style={styles.contextMain}>
            <Text style={styles.cardLabel}>Today&apos;s task</Text>
            <Text style={styles.contextTitle}>
              {selectedGoal ? todayCheckIn.prompt : 'Choose one goal above to unlock today’s check-in.'}
            </Text>
            <Text style={styles.contextHint}>
              {selectedGoal ? todayCheckIn.instructions : 'Each check-in is tied to exactly one goal/challenge.'}
            </Text>
          </View>
          <View style={[styles.statusBadge, selectedGoal && hasCheckedInToday && styles.statusBadgeDone]}>
            <Text style={[styles.statusBadgeText, selectedGoal && hasCheckedInToday && styles.statusBadgeTextDone]}>
              {selectedGoal ? todayCheckIn.status : 'choose goal'}
            </Text>
          </View>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <Text style={styles.uploadTitle}>{displayProgram.proofLabel}</Text>
            <Text style={styles.uploadMeta}>{displayProgram.categoryLabel}</Text>
          </View>

          <Pressable
            disabled={hasCheckedInToday || !selectedGoal}
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.uploadArea,
              (!selectedGoal || hasCheckedInToday) && styles.uploadAreaDisabled,
              pressed && !hasCheckedInToday && selectedGoal && styles.pressedSurface,
            ]}>
            <View style={styles.uploadIconWrap}>
              <MaterialIcons name={categoryContent.icon} size={26} color="#0f172a" />
            </View>
            <Text style={styles.uploadAreaTitle}>{categoryContent.proofTitle}</Text>
            <Text style={styles.uploadAreaText}>{categoryContent.proofDescription}</Text>
            {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            ) : latestCheckInImageUri ? (
              <Image source={{ uri: latestCheckInImageUri }} style={styles.previewImage} />
            ) : null}
            <View style={styles.exampleList}>
              {displayProgram.proofExamples.map((example) => (
                <View key={example} style={styles.exampleChip}>
                  <Text style={styles.exampleChipText}>{example}</Text>
                </View>
              ))}
            </View>
            <View style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>
                {hasCheckedInToday
                  ? 'Uploaded today'
                  : !selectedGoal
                    ? 'Choose goal first'
                    : selectedImageUri
                      ? 'Change image'
                      : 'Select image'}
              </Text>
            </View>
            <Text style={styles.uploadHint}>Stored locally only. No cloud upload yet.</Text>
          </Pressable>
        </View>

        <View style={styles.captionCard}>
          <Text style={styles.uploadTitle}>{categoryContent.captionTitle}</Text>
          <Text style={styles.captionHint}>{categoryContent.captionHint}</Text>
          <TextInput
            editable={!hasCheckedInToday && Boolean(selectedGoal)}
            multiline
            placeholder={displayCheckIn.captionPlaceholder}
            placeholderTextColor="#94a3b8"
            style={styles.captionInput}
            value={selectedGoal && hasCheckedInToday ? latestCheckInCaption ?? '' : caption}
            onChangeText={setCaption}
          />
        </View>

        <Pressable
          disabled={hasCheckedInToday || !canSubmit || !selectedGoal}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            hasCheckedInToday && styles.primaryButtonDone,
            (!hasCheckedInToday && !canSubmit) || !selectedGoal ? styles.primaryButtonDisabled : null,
            pressed && canSubmit && !hasCheckedInToday && selectedGoal && styles.buttonPressed,
          ]}>
          <Text style={styles.primaryButtonText}>
            {hasCheckedInToday ? 'Checked in today' : displayCheckIn.ctaLabel}
          </Text>
          <Text style={styles.primaryButtonHint}>
            {!selectedGoal
              ? 'Choose one active goal to continue'
              : hasCheckedInToday
              ? 'Done. Your status is updated for today.'
              : canSubmit
                ? 'Creates a local check-in for the selected goal'
                : 'Select an image and add a caption to post today'}
          </Text>
        </Pressable>

        {selectedGoal && hasCheckedInToday ? (
          <View style={styles.successCard}>
            <MaterialIcons name="check-circle" size={18} color="#15803d" />
            <Text style={styles.successText}>Check-in submitted. You are marked as done for today.</Text>
          </View>
        ) : null}

        {selectedGoal && (latestCheckInCaption || latestCheckInImageUri) ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Latest check-in</Text>
            {latestCheckInDate ? <Text style={styles.latestMeta}>{latestCheckInDate}</Text> : null}
            {latestCheckInImageUri ? <Image source={{ uri: latestCheckInImageUri }} style={styles.previewImage} /> : null}
            {latestCheckInCaption ? <Text style={styles.latestText}>{latestCheckInCaption}</Text> : null}
          </View>
        ) : selectedGoal ? (
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Latest check-in</Text>
            <Text style={styles.emptyTitle}>Nothing posted yet</Text>
            <Text style={styles.latestText}>Select an image, add a short caption, and post your first check-in.</Text>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Latest check-in</Text>
            <Text style={styles.latestText}>Choose a goal above to see its latest check-in.</Text>
          </View>
        )}

        <View style={styles.noteCard}>
          <MaterialIcons name="lock" size={18} color="#475569" />
          <Text style={styles.noteText}>
            Your check-in is shared only with your private group, not publicly.
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  header: {
    gap: 8,
    paddingHorizontal: 4,
    width: '100%',
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
    maxWidth: '100%',
  },
  goalSelectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 12,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  goalSelectorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  goalSelectorMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalSelectorList: {
    gap: 8,
  },
  goalChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  goalChipSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  goalChipTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalChipSelectedBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  goalChipCheckWrap: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#93c5fd',
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  goalChipSelectedBadgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalChipTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  goalChipTitleSelected: {
    color: '#1e40af',
  },
  goalChipMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  goalChipMetaSelected: {
    color: '#1e40af',
    fontWeight: '700',
  },
  goalChipStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  goalChipStatusBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  goalChipStatusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  goalChipStatusBadgeMissed: {
    backgroundColor: '#fee2e2',
  },
  goalChipStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalChipStatusBadgeTextDone: {
    color: '#166534',
  },
  goalChipStatusBadgeTextPending: {
    color: '#92400e',
  },
  goalChipStatusBadgeTextMissed: {
    color: '#991b1b',
  },
  goalMissingText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  goalRequiredText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  contextCard: {
    alignItems: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 16,
    width: '100%',
  },
  contextMain: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  contextTitle: {
    color: '#1e1b4b',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: 6,
    maxWidth: '100%',
    flexShrink: 1,
  },
  contextHint: {
    color: '#4338ca',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: '100%',
    flexShrink: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexShrink: 0,
  },
  statusBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    color: '#3730a3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadgeTextDone: {
    color: '#166534',
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  uploadHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  uploadTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  uploadMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  uploadArea: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 22,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    minHeight: 280,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 12,
    width: '100%',
  },
  uploadAreaDisabled: {
    opacity: 0.7,
  },
  pressedSurface: {
    opacity: 0.9,
  },
  previewImage: {
    borderRadius: 14,
    height: 180,
    width: '100%',
  },
  uploadIconWrap: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  uploadAreaTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    maxWidth: '100%',
    textAlign: 'center',
  },
  uploadAreaText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: '100%',
    textAlign: 'center',
  },
  exampleList: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  exampleChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  exampleChipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  uploadButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadHint: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  captionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 12,
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  captionHint: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '100%',
  },
  captionInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    color: '#0f172a',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 16,
    textAlignVertical: 'top',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
  },
  primaryButtonDone: {
    backgroundColor: '#15803d',
  },
  primaryButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButtonHint: {
    color: '#dbeafe',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  successText: {
    color: '#166534',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  latestMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
  },
  latestText: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
    width: '100%',
  },
  noteText: {
    color: '#475569',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
