import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/constants/tokens';

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, placeholderTextColor = colors.slate[400], ...props }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={placeholderTextColor} style={[styles.input, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.slate[700],
  },
  input: {
    backgroundColor: colors.slate[50],
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
