import { Redirect, Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckInTabButton } from '@/components/check-in-tab-button';
import { HapticTab } from '@/components/haptic-tab';
import { colors, shadows } from '@/constants/tokens';
import { useAuthSession } from '@/contexts/auth-session';
import { useProfile } from '@/lib/queries/profile';

const tabBarLabelStyle = {
  fontSize: 12,
  fontWeight: '600',
} as const;

const tabBarItemStyle = {
  paddingVertical: 4,
} as const;

function HomeIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="home-filled" size={size} color={color} />;
}

function GroupIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="groups" size={size} color={color} />;
}

function ProgressIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="show-chart" size={size} color={color} />;
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="person" size={size} color={color} />;
}

export default function TabLayout() {
  const { session, isLoading, isPasswordRecovery } = useAuthSession();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;
  const tabBarHeight = 60 + bottomInset;
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: colors.primary.text,
      tabBarInactiveTintColor: colors.slate[500],
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarLabelStyle,
      tabBarItemStyle,
      tabBarStyle: {
        height: tabBarHeight,
        paddingBottom: bottomInset,
        paddingTop: 8,
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        ...shadows.card,
      },
    }),
    [bottomInset, tabBarHeight]
  );

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
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tabs.Screen
        name="group"
        options={{
          title: 'Group',
          tabBarIcon: GroupIcon,
        }}
      />
      <Tabs.Screen
        name="check-in"
        options={{
          title: 'Check-in',
          tabBarButton: CheckInTabButton,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ProgressIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ProfileIcon,
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
});
