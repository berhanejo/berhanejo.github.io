import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing } from '@/constants/tokens';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.slate[100],
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  selected: {
    backgroundColor: colors.primary.lighter,
  },
  pressed: {
    opacity: 0.86,
  },
  text: {
    color: colors.slate[700],
    fontSize: 12,
    fontWeight: '800',
  },
  selectedText: {
    color: colors.primary.darker,
  },
});
