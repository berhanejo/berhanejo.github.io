import { Badge } from '@/components/ui/badge';
import type { DailyStatus } from '@/lib/derive/streaks';

type StatusPillProps = {
  status: DailyStatus | 'completed';
  label?: string;
};

export function StatusPill({ status, label }: StatusPillProps) {
  const tone = status === 'completed' ? 'brand' : status;
  return <Badge label={label ?? status} tone={tone} />;
}
