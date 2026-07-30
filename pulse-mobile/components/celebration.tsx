import { ReactNode, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Wraps content in a one-shot pop-in (scale + fade) animation, played once
 * whenever it first mounts. Used for small "reward" moments like a
 * completed check-in — cheap way to make success feel like an event
 * instead of just a text swap.
 */
export function Celebration({ children }: { children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}
