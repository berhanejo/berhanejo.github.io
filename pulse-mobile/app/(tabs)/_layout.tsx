import { Redirect, Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useAppSession } from '@/contexts/app-session';
import { useAuthSession } from '@/contexts/auth-session';

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

function CheckInIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="add-circle" size={size} color={color} />;
}

function ProgressIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="show-chart" size={size} color={color} />;
}

function ProfileIcon({ color, size }: { color: string; size: number }) {
  return <MaterialIcons name="person" size={size} color={color} />;
}

export default function TabLayout() {
  const { session, isLoading } = useAuthSession();
  const { hasCompletedOnboarding } = useAppSession();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;
  const tabBarHeight = 60 + bottomInset;
  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#64748b',
      headerShown: false,
      tabBarButton: HapticTab,
      tabBarLabelStyle,
      tabBarItemStyle,
      tabBarStyle: {
        height: tabBarHeight,
        paddingBottom: bottomInset,
        paddingTop: 8,
        backgroundColor: '#ffffff',
        borderTopColor: '#e5e7eb',
        borderTopWidth: 1,
      },
    }),
    [bottomInset, tabBarHeight]
  );

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.loadingText}>Loading Pulse…</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  if (!hasCompletedOnboarding) {
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
          tabBarIcon: CheckInIcon,
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
    backgroundColor: '#f7f7fb',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
