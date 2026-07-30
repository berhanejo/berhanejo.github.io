import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/tokens';

type CardProps = {
  children: ReactNode;
  variant?: 'surface' | 'soft' | 'hero' | 'success' | 'dark';
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, variant = 'surface', style }: CardProps) {
  return <View style={[styles.base, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xxl,
    gap: spacing.md,
    padding: spacing.xl,
  },
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    ...shadows.card,
  },
  soft: {
    backgroundColor: colors.primary.tint,
    borderColor: colors.primary.lighter,
    borderWidth: 1,
  },
  hero: {
    backgroundColor: colors.primary.dark,
    ...shadows.hero,
  },
  success: {
    backgroundColor: colors.primary.lighter,
    borderColor: colors.primary.light,
    borderWidth: 1,
  },
  dark: {
    backgroundColor: colors.ink,
    ...shadows.hero,
  },
});
