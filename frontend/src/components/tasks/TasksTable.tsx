import { Activity, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Task } from "../../types/taskType";
import { formatReadableDateTime } from "../../utils/converter";
import DeleteTask from "./DeleteTask";
import ScheduleBadge from "./ScheduleBadge";
import StatusBadge from "./StatusBadge";

type TasksTableType = {
  statusFilter: string;
  tasks: Task[];
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
};

export default function TasksTable({
  statusFilter,
  tasks,
  setShowLog,
}: TasksTableType) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (statusFilter !== "all") {
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

    const priority = (status: string) => {
      if (status === "inactive") return 0;
      if (status === "obsolete") return 1;
      return 2;
    };

    return [...result].sort((a, b) => {
      return priority(a.status || "") - priority(b.status || "");
    });
  }, [tasks, searchQuery, statusFilter]);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Title and Search Bar */}
      <div className="flex justify-between items-center gap-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 select-none">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Tasks
        </h2>

        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search name or command..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="max-h-[calc(100dvh-300px)] flex-1 border border-(--border) rounded-2xl bg-(--foreground) shadow-sm overflow-auto">
        <table className="w-full min-w-full text-sm text-left">
          {/* Table Header */}
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 font-mono tracking-wider border-b border-(--border)">
            <tr>
              <th className="px-6 py-4 font-bold sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0_#e2e8f0] dark:shadow-[0_1px_0_0_#1e293b]">
                Status
              </th>
              <th className="px-6 py-4 font-bold sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0_#e2e8f0] dark:shadow-[0_1px_0_0_#1e293b]">
                Name
              </th>
              <th className="px-6 py-4 font-bold sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0_#e2e8f0] dark:shadow-[0_1px_0_0_#1e293b]">
                Command
              </th>
              <th className="px-6 py-4 font-bold sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0_#e2e8f0] dark:shadow-[0_1px_0_0_#1e293b]">
                Schedule
              </th>
              <th className="px-6 py-4 font-bold pr-12 sticky top-0 z-20 bg-slate-50 dark:bg-slate-950 shadow-[0_1px_0_0_#e2e8f0] dark:shadow-[0_1px_0_0_#1e293b]">
                Next Run
              </th>
              <th className="sticky right-0 top-0 z-30 bg-slate-50 dark:bg-slate-950 px-2 py-4 font-bold text-center shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.05),0_1px_0_0_#e2e8f0] dark:shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.5),0_1px_0_0_#1e293b] w-14"></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-slate-500 font-mono"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                      No tasks scheduled
                    </p>
                    <p className="text-sm mt-1">
                      Click "Add Task" to create your first background job.
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-slate-500 font-mono"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                      No matching tasks
                    </p>
                    <p className="text-sm mt-1">
                      Try adjusting your search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  onClick={() => setShowLog(task.id || -1)}
                  key={task.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-2 border-b border-slate-100 dark:border-slate-800/60">
                    <StatusBadge taskStatus={task.status || "obsolete"} />
                  </td>
                  <td className="px-6 py-2 font-semibold text-slate-700 dark:text-slate-200 font-mono border-b border-slate-100 dark:border-slate-800/60">
                    <div
                      className="max-w-30 sm:max-w-40 md:max-w-50 truncate"
                      title={task.name}
                    >
                      {task.name}
                    </div>
                  </td>
                  <td className="px-6 py-2 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="max-w-30 sm:max-w-45 md:max-w-55 lg:max-w-xs py-2">
                      <code
                        className="block truncate font-bold px-2.5 py-1 text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 rounded-lg"
                        title={task.command}
                      >
                        {task.command}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-2 border-b border-slate-100 dark:border-slate-800/60">
                    <ScheduleBadge schedule={task.cron_string} />
                  </td>
                  <td className="px-6 py-2 text-(--primaryText) whitespace-nowrap pr-12 border-b border-slate-100 dark:border-slate-800/60">
                    {task.status === "obsolete" ? (
                      <span className="italic">Ended</span>
                    ) : (
                      formatReadableDateTime(task.next_run)
                    )}
                  </td>
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="border-b border-slate-100 dark:border-slate-800/60 sticky right-0 z-10 px-2 py-2 bg-(--foreground) group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 transition-colors text-center shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.02)] dark:shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.3)] w-14"
                  >
                    <DeleteTask id={task.id || -1} setShowLog={setShowLog} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
