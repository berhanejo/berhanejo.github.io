import { StyleSheet, Text, View } from 'react-native';

type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  centerLabel: string;
  centerSubLabel?: string;
};

const SEGMENT_COUNT = 24;

export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 9,
  centerLabel,
  centerSubLabel,
}: ProgressRingProps) {
  const safeProgress = Math.max(0, Math.min(progress, 100));
  const activeSegments = Math.round((safeProgress / 100) * SEGMENT_COUNT);
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const segmentWidth = Math.max(4, strokeWidth + 1);
  const segmentHeight = Math.max(2, Math.round(strokeWidth * 0.45));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {Array.from({ length: SEGMENT_COUNT }).map((_, index) => {
        const angle = (index / SEGMENT_COUNT) * Math.PI * 2 - Math.PI / 2;
        const angleDegrees = (angle * 180) / Math.PI;
        const x = center + radius * Math.cos(angle) - segmentWidth / 2;
        const y = center + radius * Math.sin(angle) - segmentHeight / 2;
        const isActive = index < activeSegments;

        return (
          <View
            key={`segment-${index}`}
            style={[
              styles.segment,
              {
                width: segmentWidth,
                height: segmentHeight,
                left: x,
                top: y,
                transform: [{ rotate: `${angleDegrees + 90}deg` }],
                backgroundColor: isActive ? '#2563eb' : '#dbeafe',
              },
            ]}
          />
        );
      })}
      <View style={styles.center}>
        <Text style={styles.centerLabel}>{centerLabel}</Text>
        {centerSubLabel ? <Text style={styles.centerSubLabel}>{centerSubLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segment: {
    borderRadius: 999,
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  centerSubLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
