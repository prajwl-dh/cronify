import { Activity, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Task } from '../../types/taskType';

type TasksTableType = {
  statusFilter: string;
  tasks: Task[];
};

export default function TasksTable({ statusFilter, tasks }: TasksTableType) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task?.name?.toLowerCase().includes(lowerQuery) ||
          task?.command?.toLowerCase().includes(lowerQuery),
      );
    }

    return result;
  }, [tasks, searchQuery, statusFilter]);

  return (
    <div className='h-full flex flex-col justify-between gap-6'>
      {/* Title and Search Bar */}
      <div className='flex justify-between items-center gap-10'>
        <h2 className='text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 select-none'>
          <Activity className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
          Tasks
        </h2>

        <div className='relative w-full sm:w-auto'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search className='h-4 w-4 text-slate-400' />
          </div>
          <input
            type='text'
            placeholder='Search name or command...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
      </div>

      <div className='h-full border border-(--border)'>
        {JSON.stringify(filteredTasks)}
      </div>
    </div>
  );
}
