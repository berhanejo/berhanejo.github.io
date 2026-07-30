import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/constants/tokens';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, disabled, loading, icon, variant = 'primary', style }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.ink : colors.surface} />
      ) : (
        <>
          {icon ? <MaterialIcons name={icon} size={18} color={variant === 'primary' || variant === 'danger' ? colors.surface : colors.ink} /> : null}
          <Text style={[styles.text, variant === 'primary' || variant === 'danger' ? styles.textOnSolid : styles.textOnSoft]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.xxl,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primary: {
    backgroundColor: colors.primary.text,
    ...shadows.playful,
  },
  secondary: {
    backgroundColor: colors.secondary.lighter,
    borderColor: colors.secondary.light,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.slate[100],
  },
  danger: {
    backgroundColor: colors.danger.text,
  },
  disabled: {
    backgroundColor: colors.slate[300],
    shadowOpacity: 0,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  textOnSolid: {
    color: colors.surface,
  },
  textOnSoft: {
    color: colors.ink,
  },
});
