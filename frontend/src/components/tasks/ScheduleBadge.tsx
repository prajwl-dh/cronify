import { CalendarDays, Repeat, Zap } from 'lucide-react';
import { validateIsoDate } from '../../utils/converter';

type ScheduleType = {
  schedule?: string;
};

export default function ScheduleBadge({ schedule }: ScheduleType) {
  if (schedule === '@once') {
    return (
      <span className='flex items-center gap-1.5 text-violet-600 dark:text-violet-400 text-sm font-bold whitespace-nowrap'>
        <Zap className='w-4 h-4' /> Immediate (@once)
      </span>
    );
  } else if (validateIsoDate(schedule || '')) {
    return (
      <span className='flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-bold whitespace-nowrap'>
        <CalendarDays className='w-4 h-4' /> Scheduled Once
      </span>
    );
  } else {
    return (
      <span className='flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-sm font-bold font-mono whitespace-nowrap'>
        <Repeat className='w-4 h-4' />
        <span className='mt-1'>{schedule}</span>
      </span>
    );
  }
}
