import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { APP_PORT } from '../../config/config';
import type { Log } from '../../types/logType';
import type { Task } from '../../types/taskType';
import ExpandableLog from './ExpandableLog';

export default function ExecutionLogs({ task }: { task: Task }) {
  const [openedLog, setOpenedLog] = useState(-1);

  const { data } = useQuery<Log[]>({
    queryKey: ['logs'],
    queryFn: () =>
      fetch(`http://localhost:${APP_PORT}/api/logs/${task?.id}`).then((res) =>
        res.json(),
      ),
    refetchInterval: 30000,
  });

  if (!data) {
    return;
  }

  return (
    <>
      {data.length === 0 ? (
        <div className='p-16 text-center text-slate-500 flex flex-col items-center justify-center h-full'>
          <FileText className='w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4' />
          <p className='text-lg font-medium text-slate-600 dark:text-slate-300'>
            No logs found
          </p>
          <p className='text-sm mt-1'>
            This task hasn't generated any logs yet.
          </p>
        </div>
      ) : (
        <div className='flex flex-col'>
          {data.map((log, index) => (
            <ExpandableLog
              log={log}
              index={index}
              openedLog={openedLog}
              setOpenedLog={setOpenedLog}
            />
          ))}
        </div>
      )}
    </>
  );
}
