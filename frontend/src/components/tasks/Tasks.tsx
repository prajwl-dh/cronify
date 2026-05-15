import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { APP_PORT } from '../../config/config';
import FilterTask from './FilterTask';

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { isPending, error, data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () =>
      fetch(`http://localhost:${APP_PORT}/api/tasks`).then((res) => res.json()),
  });

  if (isPending) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-(--background) text-(--primaryText)'>
        <div className='text-center'>
          <div className='animate-spin h-10 w-10 border-4 border-(--primaryText) border-t-transparent rounded-full mx-auto mb-4' />
          <p>Trying to connect to the server...</p>
          <p className='text-sm opacity-80 pt-4'>
            Make sure the cronify daemon is running!
          </p>

          <button
            onClick={() => window.location.reload()}
            className='mt-6 px-4 py-2 bg-white text-black rounded-2xl hover:bg-gray-200 transition shadow-md cursor-pointer select-none'
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='fixed inset-0 flex items-center justify-center bg-(--background) text-(--primaryText)'>
        <div className='text-center max-w-md'>
          <h2 className='text-xl font-semibold mb-2'>Server unavailable</h2>
          <p className='text-sm opacity-80 mb-4'>
            Unable to connect to the backend. Make sure the cronify daemon is
            running!
          </p>

          <p className='text-xs opacity-60 mb-4'>{error.message}</p>

          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-white text-black rounded-2xl hover:bg-gray-200 transition cursor-pointer select-none'
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex flex-col justify-between'>
      <FilterTask
        tasks={data}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      {JSON.stringify(data)}
    </div>
  );
}
