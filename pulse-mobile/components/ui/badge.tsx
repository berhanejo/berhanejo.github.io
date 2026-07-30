import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/tokens';

type BadgeProps = {
  label: string;
  tone?: 'brand' | 'purple' | 'sun' | 'neutral' | 'done' | 'pending' | 'missed';
  icon?: keyof typeof MaterialIcons.glyphMap;
};

const TONES = {
  brand: { bg: colors.primary.lighter, fg: colors.primary.darker },
  purple: { bg: colors.secondary.lighter, fg: colors.secondary.darker },
  sun: { bg: '#fef9c3', fg: '#854d0e' },
  neutral: { bg: colors.slate[100], fg: colors.slate[600] },
  done: { bg: colors.status.done.bg, fg: colors.status.done.fg },
  pending: { bg: colors.status.pending.bg, fg: colors.status.pending.fg },
  missed: { bg: colors.status.missed.bg, fg: colors.status.missed.fg },
} as const;

export function Badge({ label, tone = 'brand', icon }: BadgeProps) {
  const color = TONES[tone];

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      {icon ? <MaterialIcons name={icon} size={13} color={color.fg} /> : null}
      <Text style={[styles.text, { color: color.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
