import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/tokens';

type StreakBadgeProps = {
  days: number;
  size?: 'small' | 'medium' | 'large';
};

const SIZE_STYLES = {
  small: { fontSize: 12, emojiSize: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 3 },
  medium: { fontSize: 14, emojiSize: 14, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  large: { fontSize: 20, emojiSize: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
} as const;

/**
 * A Snapchat-style "streak flame" — the single most recognizable habit-app
 * motivator. Days === 0 renders a neutral (unlit) version so it reads as
 * "no streak yet" rather than looking broken.
 */
export function StreakBadge({ days, size = 'medium' }: StreakBadgeProps) {
  const isLit = days > 0;
  const sizing = SIZE_STYLES[size];

  return (
    <View
      style={[
        styles.badge,
        isLit ? styles.badgeLit : styles.badgeUnlit,
        { paddingHorizontal: sizing.paddingHorizontal, paddingVertical: sizing.paddingVertical, gap: sizing.gap },
      ]}>
      <Text style={{ fontSize: sizing.emojiSize }}>{isLit ? '🔥' : '💤'}</Text>
      <Text style={[styles.text, isLit ? styles.textLit : styles.textUnlit, { fontSize: sizing.fontSize }]}>
        {days} {days === 1 ? 'day' : 'days'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
  },
  badgeLit: {
    backgroundColor: '#fef9c3',
  },
  badgeUnlit: {
    backgroundColor: colors.slate[100],
  },
  text: {
    fontWeight: '700',
  },
  textLit: {
    color: '#854d0e',
  },
  textUnlit: {
    color: colors.slate[400],
  },
});
