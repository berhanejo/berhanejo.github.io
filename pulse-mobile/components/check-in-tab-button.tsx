import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { colors, shadows } from '@/constants/tokens';

/**
 * The Instagram/TikTok "camera button" pattern: the primary create action
 * (posting a check-in) gets an elevated, unmissable circular button in the
 * middle of the tab bar instead of blending in as a fifth equal-weight icon.
 */
export function CheckInTabButton(props: BottomTabBarButtonProps) {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <PlatformPressable
        {...props}
        style={styles.button}
        onPressIn={(ev) => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          props.onPressIn?.(ev);
        }}>
        <MaterialIcons name="add" size={28} color={colors.surface} />
      </PlatformPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    top: -10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary.text,
    borderColor: colors.ink,
    borderRadius: 999,
    borderWidth: 4,
    height: 58,
    justifyContent: 'center',
    width: 58,
    ...shadows.floating(colors.primary.text),
  },
});
