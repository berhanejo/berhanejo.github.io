import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Celebration } from '@/components/celebration';
import { ScreenContainer } from '@/components/screen-container';
import { CATEGORY_COLORS } from '@/constants/category-colors';
import { useCheckInFlow } from '@/lib/check-in/use-check-in-flow';

export default function CheckInScreen() {
  const {
    currentUser,
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
  } = useCheckInFlow();

  if (!displayProgram || !categoryContent || !displayCheckIn) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.kicker}>Check-in</Text>
          <Text style={styles.title}>No active goals yet</Text>
          <Text style={styles.subtitle}>
            Add a goal from Goal Management to unlock your first check-in.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const categoryColor = CATEGORY_COLORS[displayProgram.category];
  const isMultiGroupPublish = Boolean(selectedPublishTarget?.matchingGoalIds?.length);

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
            <Text style={styles.cardLabel}>Publish proof to</Text>
            <Text style={styles.goalSelectorMeta}>
              {isMultiGroupPublish ? 'Multiple groups' : selectedPublishTarget?.groupId ? 'Group visible' : 'Private'}
            </Text>
          </View>
          <View style={styles.publishTargetList}>
            {publishTargets.map((target) => {
              const isSelected = selectedPublishTargetId === target.id;

              return (
                <Pressable
                  key={target.id}
                  disabled={hasCheckedInToday}
                  onPress={() => setSelectedPublishTargetId(target.id)}
                  style={({ pressed }) => [
                    styles.publishTargetChip,
                    isSelected && styles.publishTargetChipSelected,
                    hasCheckedInToday && styles.publishTargetChipDisabled,
                    pressed && !hasCheckedInToday && styles.buttonPressed,
                  ]}>
                  <View style={styles.publishTargetTopRow}>
                    <MaterialIcons
                      name={target.groupId ? 'groups' : target.id.startsWith('matching:') ? 'hub' : 'lock'}
                      size={17}
                      color={isSelected ? '#ffffff' : '#475569'}
                    />
                    <Text style={[styles.publishTargetTitle, isSelected && styles.publishTargetTitleSelected]}>
                      {target.label}
                    </Text>
                  </View>
                  <Text style={[styles.publishTargetHelper, isSelected && styles.publishTargetHelperSelected]}>
                    {target.helper}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.goalSelectorCard}>
          <View style={styles.goalSelectorHeader}>
            <Text style={styles.cardLabel}>Goal / Challenge</Text>
            <Text style={styles.goalSelectorMeta}>
              {filteredActivePrograms.length <= 1 ? 'Auto-selected' : `${filteredActivePrograms.length} available`}
            </Text>
          </View>
          {filteredActivePrograms.length > 0 ? (
            <View style={styles.goalSelectorList}>
              {filteredActivePrograms.map((program) => {
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
                            <MaterialIcons name="check" size={12} color="#16a34a" />
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
            <Text style={styles.goalMissingText}>No active goals for this destination. Add or copy a goal to use it here.</Text>
          )}
          {requiresGoalSelection && !selectedGoal ? (
            <Text style={styles.goalRequiredText}>Choose a goal before posting today&apos;s check-in.</Text>
          ) : null}
        </View>

        <View style={styles.contextCard}>
          <View style={styles.contextMain}>
            <Text style={styles.cardLabel}>Today&apos;s task</Text>
            <Text style={styles.contextTitle}>
              {selectedGoal ? displayCheckIn.prompt : 'Choose one goal above to unlock today’s check-in.'}
            </Text>
            <Text style={styles.contextHint}>
              {selectedGoal ? displayCheckIn.instructions : 'Each check-in is tied to exactly one goal/challenge.'}
            </Text>
          </View>
          <View style={[styles.statusBadge, selectedGoal && hasCheckedInToday && styles.statusBadgeDone]}>
            <Text style={[styles.statusBadgeText, selectedGoal && hasCheckedInToday && styles.statusBadgeTextDone]}>
              {selectedGoal ? displayCheckIn.status : 'choose goal'}
            </Text>
          </View>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <Text style={styles.uploadTitle}>{displayProgram.proofLabel}</Text>
            <Text style={styles.uploadMeta}>{displayProgram.categoryLabel}</Text>
          </View>

          <View style={[styles.uploadArea, (!selectedGoal || hasCheckedInToday) && styles.uploadAreaDisabled]}>
            <View style={[styles.uploadIconWrap, { backgroundColor: categoryColor.background }]}>
              <MaterialIcons name={categoryContent.icon} size={26} color={categoryColor.accent} />
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

            <View style={styles.photoActionRow}>
              <Pressable
                disabled={hasCheckedInToday || !selectedGoal}
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.photoActionButton,
                  styles.photoActionButtonPrimary,
                  pressed && !hasCheckedInToday && selectedGoal && styles.pressedSurface,
                ]}>
                <MaterialIcons name="photo-camera" size={18} color="#ffffff" />
                <Text style={styles.photoActionButtonPrimaryText}>Take photo</Text>
              </Pressable>
              <Pressable
                disabled={hasCheckedInToday || !selectedGoal}
                onPress={handlePickImage}
                style={({ pressed }) => [
                  styles.photoActionButton,
                  styles.photoActionButtonSecondary,
                  pressed && !hasCheckedInToday && selectedGoal && styles.pressedSurface,
                ]}>
                <MaterialIcons name="photo-library" size={18} color="#102a19" />
                <Text style={styles.photoActionButtonSecondaryText}>
                  {selectedImageUri ? 'Change from library' : 'Choose from library'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.uploadHint}>
              {hasCheckedInToday
                ? 'Uploaded today.'
                : !selectedGoal
                  ? 'Choose a goal above first.'
                  : isMultiGroupPublish
                    ? `This proof will appear in ${selectedPublishTarget.label}.`
                    : selectedPublishTarget?.groupId
                    ? `This proof will appear in ${selectedPublishTarget.label}.`
                    : 'This proof stays private in your own progress.'}
            </Text>
          </View>
        </View>

        <View style={styles.captionCard}>
          <Text style={styles.uploadTitle}>{categoryContent.captionTitle}</Text>
          <Text style={styles.captionHint}>{categoryContent.captionHint}</Text>
          <TextInput
            editable={Boolean(selectedGoal)}
            multiline
            placeholder={displayCheckIn.captionPlaceholder}
            placeholderTextColor="#94a3b8"
            style={styles.captionInput}
            value={selectedGoal && hasCheckedInToday ? editCaption : caption}
            onChangeText={selectedGoal && hasCheckedInToday ? setEditCaption : setCaption}
          />
          {hasCheckedInToday && latestCheckInId ? (
            <View style={styles.editActionsRow}>
              <Pressable
                disabled={isSubmitting || !editCaption.trim() || editCaption === (latestCheckInCaption ?? '')}
                onPress={handleUpdateLatestCheckIn}
                style={({ pressed }) => [
                  styles.editSaveButton,
                  (isSubmitting || !editCaption.trim() || editCaption === (latestCheckInCaption ?? '')) && styles.primaryButtonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.editSaveButtonText}>{isSubmitting ? 'Saving…' : 'Save edit'}</Text>
              </Pressable>
              <Pressable
                disabled={isSubmitting}
                onPress={handleDeleteLatestCheckIn}
                style={({ pressed }) => [styles.editDeleteButton, pressed && styles.buttonPressed]}>
                <Text style={styles.editDeleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Pressable
          disabled={hasCheckedInToday || !canSubmit || !selectedGoal || isSubmitting}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            hasCheckedInToday && styles.primaryButtonDone,
            (!hasCheckedInToday && !canSubmit) || !selectedGoal || isSubmitting ? styles.primaryButtonDisabled : null,
            pressed && canSubmit && !hasCheckedInToday && selectedGoal && !isSubmitting && styles.buttonPressed,
          ]}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Posting…' : hasCheckedInToday ? 'Checked in today' : displayCheckIn.ctaLabel}
          </Text>
          <Text style={styles.primaryButtonHint}>
            {!selectedGoal
              ? 'Choose one active goal to continue'
              : hasCheckedInToday
              ? 'Done. Your status is updated for today.'
              : isSubmitting
                ? 'Uploading your photo and saving the check-in…'
                : canSubmit
                  ? selectedPublishTarget?.groupId
                    ? `Shares this check-in with ${selectedPublishTarget.label}`
                    : isMultiGroupPublish
                      ? `Shares this check-in with ${selectedPublishTarget.label}`
                    : 'Saves this check-in privately'
                  : 'Select an image and add a caption to post today'}
          </Text>
        </Pressable>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        {selectedGoal && hasCheckedInToday ? (
          <Celebration>
            <View style={styles.successCard}>
              <MaterialIcons name="celebration" size={22} color="#15803d" />
              <View style={styles.successTextWrap}>
                <Text style={styles.successTitle}>Nice work — day complete!</Text>
                <Text style={styles.successText}>Your proof is posted and you&apos;re marked done for today.</Text>
              </View>
            </View>
          </Celebration>
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
            {selectedPublishTarget?.groupId
              ? `Your check-in appears only in ${selectedPublishTarget.label}, not publicly.`
              : isMultiGroupPublish
                ? `Your check-in appears in each matching private group, not publicly.`
              : 'Your check-in stays private and does not appear in a group feed.'}
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
    color: '#102a19',
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
    shadowColor: '#102a19',
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
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
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
    borderColor: '#86efac',
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  goalChipSelectedBadgeText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  goalChipTitle: {
    color: '#102a19',
    fontSize: 15,
    fontWeight: '700',
  },
  goalChipTitleSelected: {
    color: '#166534',
  },
  goalChipMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  goalChipMetaSelected: {
    color: '#166534',
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
    color: '#15803d',
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
  publishCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 12,
    padding: 18,
    shadowColor: '#102a19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  publishTargetList: {
    gap: 8,
  },
  publishTargetChip: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  publishTargetChipSelected: {
    backgroundColor: '#102a19',
    borderColor: '#102a19',
  },
  publishTargetChipDisabled: {
    opacity: 0.65,
  },
  publishTargetTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  publishTargetTitle: {
    color: '#102a19',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  publishTargetTitleSelected: {
    color: '#ffffff',
  },
  publishTargetHelper: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  publishTargetHelperSelected: {
    color: '#cbd5e1',
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    width: '100%',
    shadowColor: '#102a19',
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
    color: '#102a19',
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
    color: '#102a19',
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
    color: '#2f5f3b',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  photoActionButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  photoActionButtonPrimary: {
    backgroundColor: '#102a19',
  },
  photoActionButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  photoActionButtonSecondary: {
    backgroundColor: '#e2e8f0',
  },
  photoActionButtonSecondaryText: {
    color: '#102a19',
    fontSize: 13,
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
    shadowColor: '#102a19',
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
    color: '#102a19',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 16,
    textAlignVertical: 'top',
    width: '100%',
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editSaveButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editSaveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  editDeleteButton: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editDeleteButtonText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#16a34a',
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
    color: '#dcfce7',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
  },
  successTextWrap: {
    flex: 1,
    gap: 2,
  },
  successTitle: {
    color: '#14532d',
    fontSize: 15,
    fontWeight: '700',
  },
  successText: {
    color: '#166534',
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
    color: '#102a19',
    fontSize: 17,
    fontWeight: '700',
  },
  latestText: {
    color: '#102a19',
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
