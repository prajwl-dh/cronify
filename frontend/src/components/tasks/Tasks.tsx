import { useState } from "react";
import type { Task } from "../../types/taskType";
import FilterTask from "./FilterTask";
import TasksTable from "./TasksTable";

type TasksType = {
  showLog: number;
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
  tasks: Task[];
};

export default function Tasks({ showLog, setShowLog, tasks }: TasksType) {
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div
      className={`h-full w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex flex-col gap-6 lg:gap-10 justify-between ${showLog !== -1 && "hidden"}`}
    >
      <FilterTask
        tasks={tasks}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <TasksTable
        statusFilter={statusFilter}
        tasks={tasks}
        setShowLog={setShowLog}
      />
    </div>
  );
}
