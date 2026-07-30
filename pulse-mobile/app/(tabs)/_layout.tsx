import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/tokens';
import { useAuthSession } from '@/contexts/auth-session';
import { useProfile } from '@/lib/queries/profile';

function HomeIcon({ color }: { color: string }) {
  return <MaterialIcons name="home-filled" size={18} color={color} />;
}

function GroupIcon({ color }: { color: string }) {
  return <MaterialIcons name="groups" size={18} color={color} />;
}

function CheckInIcon({ color }: { color: string }) {
  return <MaterialIcons name="add" size={19} color={color} />;
}

function ProgressIcon({ color }: { color: string }) {
  return <MaterialIcons name="show-chart" size={18} color={color} />;
}

function ProfileIcon({ color }: { color: string }) {
  return <MaterialIcons name="person" size={18} color={color} />;
}

function getTabIcon(routeName: string, color: string) {
  switch (routeName) {
    case 'index':
      return <HomeIcon color={color} />;
    case 'group':
      return <GroupIcon color={color} />;
    case 'check-in':
      return <CheckInIcon color={color} />;
    case 'progress':
      return <ProgressIcon color={color} />;
    case 'profile':
      return <ProfileIcon color={color} />;
    default:
      return null;
  }
}

function PulseTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const bottomInset =
    Platform.OS === 'android' ? Math.max(insets.bottom + 8, 14) : Math.max(insets.bottom + 6, 14);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarWrap, isWeb ? styles.tabBarWrapTop : styles.tabBarWrapBottom]}>
      <View
        style={[
          styles.tabBar,
          isWeb ? styles.tabBarWebPosition : { bottom: bottomInset },
        ]}>
        {state.routes.map((route, index) => {
          if (route.name === 'goals') {
            return null;
          }

          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? colors.ink : colors.slate[500];

          function handlePress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              accessibilityLabel={options.tabBarAccessibilityLabel}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              key={route.key}
              onPress={handlePress}
              style={({ pressed }) => [
                styles.tabButton,
                isFocused && styles.tabButtonActive,
                pressed && styles.tabButtonPressed,
              ]}>
              {getTabIcon(route.name, color)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { session, isLoading, isPasswordRecovery } = useAuthSession();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  if (isLoading || (session && isProfileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary.text} />
        <Text style={styles.loadingText}>Loading Pulse…</Text>
      </View>
    );
  }

  if (isPasswordRecovery) {
    return <Redirect href="/auth/reset-password" />;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  if (!profile?.onboardingCompleted) {
    return <Redirect href="/onboarding/welcome" />;
  }

  return (
    <Tabs tabBar={(props) => <PulseTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: 'Group',
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check-in',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.slate[500],
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    borderWidth: 1,
    elevation: 8,
    flexDirection: 'row',
    gap: 3,
    height: 36,
    justifyContent: 'center',
    maxWidth: 246,
    paddingHorizontal: 4,
    position: 'absolute',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    width: '68%',
  },
  tabBarWrap: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 0,
    justifyContent: 'center',
    left: 0,
    pointerEvents: 'box-none',
    position: 'absolute',
    right: 0,
  },
  tabBarWrapBottom: {
    bottom: 0,
  },
  tabBarWrapTop: {
    top: 0,
  },
  tabBarWebPosition: {
    top: 'calc(8px + env(safe-area-inset-top))',
  } as unknown as ViewStyle,
  tabButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 40,
  },
  tabButtonActive: {
    backgroundColor: colors.primary.light,
  },
  tabButtonPressed: {
    opacity: 0.72,
  },
});
