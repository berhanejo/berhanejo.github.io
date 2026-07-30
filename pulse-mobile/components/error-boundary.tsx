import { Component, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/constants/tokens';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Unhandled error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.kicker}>Pulse</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error stopped the app. You can try again — if it keeps happening, restarting the app
            usually helps.
          </Text>
          {__DEV__ ? <Text style={styles.debug}>{this.state.error.message}</Text> : null}
          <Button label="Try again" onPress={this.handleReset} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  kicker: {
    ...typography.kicker,
    color: colors.primary.dark,
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    ...typography.subtitle,
    color: colors.slate[500],
    textAlign: 'center',
  },
  debug: {
    color: colors.danger.text,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});
