import { ArrowLeft, FileText } from 'lucide-react';
import type { Task } from '../../types/taskType';
import { formatReadableDateTime } from '../../utils/converter';
import DeleteTask from '../tasks/DeleteTask';
import ScheduleBadge from '../tasks/ScheduleBadge';
import StatusBadge from '../tasks/StatusBadge';
import ExecutionLogs from './ExecutionLogs';

type LogsType = {
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
  showLog: number;
  tasks: Task[];
};

export default function Logs({ showLog, setShowLog, tasks }: LogsType) {
  const task = tasks.find((task) => task.id === showLog);

  if (!task) return;

  return (
    <div
      className={`h-full w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex flex-col gap-10 justify-between ${showLog === -1 && 'hidden'}`}
    >
      {/* Logs header */}
      <div className='md:mt-4 w-full bg-(--foreground) rounded-2xl px-4 py-4 flex flex-col gap-2 shadow-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div
              onClick={() => setShowLog(-1)}
              className='flex items-center gap-1 text-(--themeAccent) text-xs font-semibold hover:underline w-fit cursor-pointer underline-offset-4'
            >
              <ArrowLeft className='h-4 w-4' />
              Go Back
            </div>
            <div className='w-px h-3 bg-slate-400'></div>
            <StatusBadge taskStatus={task?.status || 'active'} />
          </div>
          <div>
            <DeleteTask id={task?.id || -1} setShowLog={setShowLog} />
          </div>
        </div>

        <span className='text-lg font-bold text-(--primaryText) mb-2 wrap-break-word'>
          {task?.name}
        </span>

        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-16'>
          <code className='w-full text-xs md:text-sm font-bold block whitespace-nowrap overflow-x-auto custom-scrollbar text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-white/10 dark:border-white/5'>
            {task?.command}
          </code>
          <div className='flex flex-row items-start gap-5 md:gap-8'>
            <div>
              <p className='text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1'>
                Schedule
              </p>
              <ScheduleBadge schedule={task?.cron_string} />
            </div>
            <div className='w-max'>
              <p className='text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1'>
                Created
              </p>
              <span className='text-xs text-(--primaryText) font-bold block'>
                {formatReadableDateTime(task?.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className='h-full flex flex-col justify-between gap-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2'>
            <FileText className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
            Execution Logs
          </div>
        </div>

        <div className='bg-(--foreground) rounded-2xl h-full shadow-sm max-h-[calc(100dvh-340px)] overflow-x-hidden overflow-y-auto'>
          <ExecutionLogs task={task} />
        </div>
      </div>
    </div>
  );
}
