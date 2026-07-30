import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { Button, Card, SectionHeader, TextField } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/tokens';
import { useAuthSession } from '@/contexts/auth-session';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const demoEmail = process.env.EXPO_PUBLIC_DEMO_EMAIL;
const demoPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD;
const isDemoLoginConfigured = Boolean(demoEmail && demoPassword);

type Mode = 'signIn' | 'signUp' | 'forgotPassword';

export default function AuthScreen() {
  const { session, signIn, signUp, requestPasswordReset } = useAuthSession();
  const [mode, setMode] = useState<Mode>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setMode('signIn');
      setPassword('');
      setMessage(null);
    }
  }, [session]);

  if (session) {
    return <Redirect href="/" />;
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setPassword('');
    setMessage(null);
  }

  async function handleSubmit() {
    const cleanedEmail = email.trim();

    if (!cleanedEmail || !EMAIL_PATTERN.test(cleanedEmail)) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (mode === 'forgotPassword') {
      setIsSubmitting(true);
      setMessage(null);
      const result = await requestPasswordReset(cleanedEmail);
      setIsSubmitting(false);
      setMessage(
        result.error ?? 'If an account exists for that email, a reset link is on its way — check your inbox.'
      );
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signUp' && !displayName.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const result =
      mode === 'signIn' ? await signIn(cleanedEmail, password) : await signUp(cleanedEmail, password, displayName);

    if (result.error) {
      setMessage(result.error);
    } else if (mode === 'signUp') {
      setMessage('Account created. Check your email if confirmation is enabled.');
    }

    setIsSubmitting(false);
  }

  async function handleDemoLogin() {
    if (!demoEmail || !demoPassword) {
      setMessage('Demo login is not configured yet.');
      return;
    }

    setMode('signIn');
    setEmail(demoEmail);
    setPassword('');
    setIsSubmitting(true);
    setMessage(null);

    const result = await signIn(demoEmail, demoPassword);

    if (result.error) {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  const titles: Record<Mode, string> = {
    signIn: 'Welcome back',
    signUp: 'Create your account',
    forgotPassword: 'Reset your password',
  };
  const ctaLabels: Record<Mode, string> = {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    forgotPassword: 'Send reset link',
  };

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Pulse"
        title={titles[mode]}
        subtitle={
          mode === 'forgotPassword'
            ? "Enter your account email and we'll send you a link to set a new password."
            : 'Sign in to keep your streaks, proof, and private group in sync.'
        }
      />

      <Card style={styles.formCard}>
        {mode === 'signUp' ? (
          <TextField autoCapitalize="words" label="Name" onChangeText={setDisplayName} placeholder="Your name" value={displayName} />
        ) : null}

        <TextField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />

        {mode !== 'forgotPassword' ? (
          <TextField
            label="Password"
            onChangeText={setPassword}
            placeholder="Minimum 6 characters"
            secureTextEntry
            value={password}
          />
        ) : null}

        {mode === 'signIn' ? (
          <Pressable onPress={() => switchMode('forgotPassword')} style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>
        ) : null}

        <Button loading={isSubmitting} label={ctaLabels[mode]} onPress={handleSubmit} />

        {mode === 'signIn' && isDemoLoginConfigured ? (
          <Button
            disabled={isSubmitting}
            label="Try demo account"
            onPress={handleDemoLogin}
            variant="secondary"
          />
        ) : null}

        {mode === 'forgotPassword' ? (
          <Button label="Back to Sign In" onPress={() => switchMode('signIn')} variant="secondary" />
        ) : (
          <Button
            label={mode === 'signIn' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
            variant="secondary"
          />
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: colors.primary.dark,
    fontSize: 13,
    fontWeight: '800',
  },
  message: {
    ...typography.body,
    color: colors.slate[700],
  },
});
