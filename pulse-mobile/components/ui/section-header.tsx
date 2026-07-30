import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/tokens';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
};

export function SectionHeader({ eyebrow, title, subtitle, align = 'left' }: SectionHeaderProps) {
  return (
    <View style={[styles.header, align === 'center' && styles.center]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={[styles.title, align === 'center' && styles.centerText]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, align === 'center' && styles.centerText]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  center: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  eyebrow: {
    ...typography.kicker,
    color: colors.primary.dark,
  },
  title: {
    ...typography.title,
    color: colors.ink,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.slate[600],
  },
});
