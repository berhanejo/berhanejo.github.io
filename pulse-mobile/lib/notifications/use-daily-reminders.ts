import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { CoachMessage } from '@/lib/derive/coach-message';
import type { EnrichedGoal, TodayCheckInPrompt } from '@/lib/session/types';

const REMINDER_TIMES = [
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 },
] as const;

type DailyReminderParams = {
  currentProgram: EnrichedGoal | null;
  todayCheckIn: TodayCheckInPrompt | null;
  aiCoachMessage: CoachMessage;
};

export function useDailyReminders({ currentProgram, todayCheckIn, aiCoachMessage }: DailyReminderParams) {
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const scheduledNotificationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setNotificationPermissionGranted(false);
      return;
    }

    async function setupNotifications() {
      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      const settings = await Notifications.getPermissionsAsync();
      let granted = settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

      if (!granted) {
        const request = await Notifications.requestPermissionsAsync();
        granted = request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      setNotificationPermissionGranted(granted);
    }

    setupNotifications();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    async function rescheduleDailyReminders() {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
      for (const id of scheduledNotificationIdsRef.current) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      scheduledNotificationIdsRef.current = [];

      if (!notificationPermissionGranted || !currentProgram || todayCheckIn?.status !== 'pending') {
        return;
      }

      const now = new Date();
      const newIds: string[] = [];

      for (const reminderTime of REMINDER_TIMES) {
        const triggerDate = new Date();
        triggerDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

        if (triggerDate <= now) {
          continue;
        }

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Pulse • ${aiCoachMessage.title}`,
            body: aiCoachMessage.body,
            sound: false,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });

        newIds.push(id);
      }

      scheduledNotificationIdsRef.current = newIds;
    }

    rescheduleDailyReminders();
  }, [aiCoachMessage.body, aiCoachMessage.title, currentProgram, notificationPermissionGranted, todayCheckIn?.status]);
}
