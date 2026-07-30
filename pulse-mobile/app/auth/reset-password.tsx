import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { Button, Card, SectionHeader, TextField } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/tokens';
import { useAuthSession } from '@/contexts/auth-session';

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuthSession();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit() {
    setMessage(null);

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer>
      <SectionHeader eyebrow="Pulse" title="Set a new password" subtitle="Choose a new password for your account." />

      <Card style={styles.formCard}>
        <TextField
          label="New password"
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry
          value={password}
        />

        <TextField
          label="Confirm password"
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your new password"
          secureTextEntry
          value={confirmPassword}
        />

        <Button loading={isSubmitting} label="Update password" onPress={handleSubmit} />

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.slate[700],
  },
});
