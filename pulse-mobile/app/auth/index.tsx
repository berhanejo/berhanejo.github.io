import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenContainer } from '@/components/screen-container';
import { useAuthSession } from '@/contexts/auth-session';

export default function AuthScreen() {
  const { session, signIn, signUp } = useAuthSession();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
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

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setMessage('Please enter email and password.');
      return;
    }
    if (mode === 'signUp' && !displayName.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const result =
      mode === 'signIn'
        ? await signIn(email, password)
        : await signUp(email, password, displayName);

    if (result.error) {
      setMessage(result.error);
    } else if (mode === 'signUp') {
      setMessage('Account created. Check your email if confirmation is enabled.');
    }

    setIsSubmitting(false);
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Pulse</Text>
        <Text style={styles.title}>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>Sign in to sync goals, check-ins, and progress with Supabase.</Text>
      </View>

      <View style={styles.formCard}>
        {mode === 'signUp' ? (
          <>
            <Text style={styles.label}>Name</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={displayName}
            />
          </>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={email}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          style={styles.input}
          value={password}
        />

        <Pressable disabled={isSubmitting} onPress={handleSubmit} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Sign Up'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
            setDisplayName('');
            setPassword('');
            setMessage(null);
          }}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {mode === 'signIn' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </Text>
        </Pressable>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </ScreenContainer>
  );
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
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    gap: 12,
    padding: 20,
  },
  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#1e293b',
    fontSize: 13,
    lineHeight: 18,
  },
});
