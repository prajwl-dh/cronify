import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { APP_PORT } from '../../config/config';
import Error from '../common/Error';
import Loading from '../common/Loading';
import FilterTask from './FilterTask';
import TasksTable from './TasksTable';

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { isPending, error, data } = useQuery({
    queryKey: ['tasks'],
    queryFn: () =>
      fetch(`http://localhost:${APP_PORT}/api/tasks`).then((res) => res.json()),
    refetchInterval: 30000,
  });

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className='h-full w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex flex-col gap-6 lg:gap-10 justify-between'>
      <FilterTask
        tasks={data}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <TasksTable statusFilter={statusFilter} tasks={data} />
    </div>
  );
}
