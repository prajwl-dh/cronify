import { Activity, CheckCircle2, Clock } from 'lucide-react';
import type { Task } from '../../types/taskType';

type FilterTaskType = {
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  tasks: Task[];
};

export default function FilterTask({
  tasks,
  statusFilter,
  setStatusFilter,
}: FilterTaskType) {
  return (
    <div className='shrink-0 grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8 mt-10'>
      {/* Total */}
      <div
        onClick={() => setStatusFilter('all')}
        className={`bg-(--foreground) border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === 'all' ? 'border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
      >
        <div className='p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl'>
          <Activity className='w-6 h-6' />
        </div>
        <div>
          <p className='text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-sans mb-0.5'>
            Total Tasks
          </p>
          <h3 className='text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none'>
            {tasks.length}
          </h3>
        </div>
      </div>

      {/* Scheduled */}
      <div
        onClick={() => setStatusFilter('inactive')}
        className={`bg-(--foreground) border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === 'inactive' ? 'border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-400 dark:ring-emerald-400' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800'}`}
      >
        <div className='p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl'>
          <Clock className='w-6 h-6' />
        </div>
        <div>
          <p className='text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-sans mb-0.5'>
            Scheduled
          </p>
          <h3 className='text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none'>
            {tasks.filter((task) => task.status === 'inactive').length}
          </h3>
        </div>
      </div>

      {/* Completed */}
      <div
        onClick={() => setStatusFilter('obsolete')}
        className={`bg-(--foreground) border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === 'obsolete' ? 'border-slate-500 ring-1 ring-slate-500 dark:border-slate-400 dark:ring-slate-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
      >
        <div className='p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl'>
          <CheckCircle2 className='w-6 h-6' />
        </div>
        <div>
          <p className='text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider font-sans mb-0.5'>
            Completed
          </p>
          <h3 className='text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none'>
            {tasks.filter((task) => task.status === 'obsolete').length}
          </h3>
        </div>
      </div>
    </div>
  );
}
