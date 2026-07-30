import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { colors, spacing } from '@/constants/tokens';

type StatTileProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <Card style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  value: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  copy: {
    gap: 2,
  },
  label: {
    color: colors.slate[700],
    fontSize: 13,
    fontWeight: '800',
  },
  hint: {
    color: colors.slate[500],
    fontSize: 12,
    fontWeight: '600',
  },
});
