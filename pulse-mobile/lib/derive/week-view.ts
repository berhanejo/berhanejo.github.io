import { formatDateKey, getStartOfWeekMonday } from '@/lib/derive/date';
import { DailyStatus } from '@/lib/derive/streaks';

export type WeekDayItem = {
  dateKey: string;
  isToday: boolean;
  status: DailyStatus;
  label: string;
};

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function computeWeekView(params: {
  today: Date;
  totalActiveGoals: number;
  isDateFullyDone: (dateKey: string) => boolean;
}): WeekDayItem[] {
  const startOfWeek = getStartOfWeekMonday(params.today);
  const todayDateKey = formatDateKey(params.today);

  return WEEK_LABELS.map((label, index) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + index);
    const dateKey = formatDateKey(dayDate);
    const dayIsFullyDone = params.totalActiveGoals > 0 && params.isDateFullyDone(dateKey);
    const status: DailyStatus =
      dateKey > todayDateKey ? 'pending' : dayIsFullyDone ? 'done' : dateKey === todayDateKey ? 'pending' : 'missed';

    return {
      dateKey,
      isToday: dateKey === todayDateKey,
      status,
      label,
    };
  });
}
