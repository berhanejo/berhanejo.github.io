import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/constants/tokens';

type EmptyStateProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, text, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={26} color={colors.primary.dark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{text}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.button} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary.lighter,
    borderRadius: radii.pill,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 56,
  },
  title: {
    ...typography.cardTitle,
    color: colors.ink,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: colors.slate[500],
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
});
