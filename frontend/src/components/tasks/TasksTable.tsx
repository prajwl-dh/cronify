import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Edit3,
  Loader2,
  PauseCircle,
  Play,
  PlayCircle,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { APP_PORT } from "../../config/config";
import { useToast } from "../../store/toast/useToast";
import type { Task } from "../../types/taskType";
import { formatReadableDateTime } from "../../utils/converter";
import DeleteTask from "./DeleteTask";
import EditTaskModal from "./EditTaskModal";
import ScheduleBadge from "./ScheduleBadge";
import StatusBadge from "./StatusBadge";

type TasksTableProps = {
  statusFilter: string;
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
};

export default function TasksTable({
  statusFilter,
  setShowLog,
}: TasksTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Infinite Query for Tasks Pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["tasks", statusFilter, searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "15",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      });

      const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/tasks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.page + 1 : undefined,
    refetchInterval: 10000,
  });

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Mutation to Run Task Immediately
  const runTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/tasks/${id}/run`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to trigger task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Task execution triggered!");
    },
    onError: () => {
      toast.error("Failed to run task");
    },
  });

  // Mutation to Toggle Pause/Resume
  const toggleTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        `http://127.0.0.1:${APP_PORT}/api/tasks/${id}/toggle`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("Failed to toggle status");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(data.message || "Status updated");
    },
    onError: () => {
      toast.error("Failed to toggle status");
    },
  });

  const allTasks: Task[] =
    data?.pages.flatMap((page) => (Array.isArray(page) ? page : page.tasks || [])) ||
    [];

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
            className="pl-10 pr-8 py-2 w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
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
              <th className="sticky right-0 top-0 z-30 bg-slate-50 dark:bg-slate-950 px-4 py-4 font-bold text-center shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.05),0_1px_0_0_#e2e8f0] dark:shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.5),0_1px_0_0_#1e293b] w-36">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                    <p className="text-sm font-medium">Loading tasks...</p>
                  </div>
                </td>
              </tr>
            ) : allTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-mono">
                  <div className="flex flex-col items-center justify-center">
                    <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                      No tasks scheduled
                    </p>
                    <p className="text-sm mt-1">
                      {searchQuery
                        ? "No tasks match your search."
                        : "Click 'Add Task' to create your first background job."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              allTasks.map((task) => {
                const taskId = task.id ?? -1;
                return (
                  <tr
                    onClick={() => setShowLog(taskId)}
                    key={taskId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/60">
                      <StatusBadge taskStatus={task.status || "obsolete"} />
                    </td>

                    <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 font-mono border-b border-slate-100 dark:border-slate-800/60">
                      <div className="max-w-30 sm:max-w-40 md:max-w-50 truncate" title={task.name}>
                        {task.name}
                      </div>
                    </td>

                    <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60">
                      <div className="max-w-30 sm:max-w-45 md:max-w-55 lg:max-w-xs py-1">
                        <code
                          className="block truncate font-bold px-2.5 py-1 text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-xs"
                          title={task.command}
                        >
                          {task.command}
                        </code>
                      </div>
                    </td>

                    <td className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/60">
                      <ScheduleBadge schedule={task.cron_string || "@once"} />
                    </td>

                    <td className="px-6 py-3 text-(--primaryText) whitespace-nowrap pr-12 border-b border-slate-100 dark:border-slate-800/60 text-xs">
                      {task.status === "obsolete" ? (
                        <span className="italic text-slate-400">Ended</span>
                      ) : (
                        formatReadableDateTime(task.next_run || Date.now())
                      )}
                    </td>

                    {/* Action Buttons Column */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="border-b border-slate-100 dark:border-slate-800/60 sticky right-0 z-10 px-3 py-2 bg-(--foreground) group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 transition-colors text-center shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.02)] dark:shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.3)] w-36"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Run Now Button */}
                        <button
                          onClick={() => runTaskMutation.mutate(taskId)}
                          disabled={runTaskMutation.isPending || taskId === -1}
                          title="Run Immediately"
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>

                        {/* Pause / Resume Toggle */}
                        {task.status !== "obsolete" && (
                          <button
                            onClick={() => toggleTaskMutation.mutate(taskId)}
                            disabled={toggleTaskMutation.isPending || taskId === -1}
                            title={task.status === "paused" ? "Resume Task" : "Pause Task"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              task.status === "paused"
                                ? "text-amber-500 hover:bg-amber-500/10"
                                : "text-slate-400 hover:bg-slate-500/10"
                            }`}
                          >
                            {task.status === "paused" ? (
                              <PlayCircle className="w-4 h-4" />
                            ) : (
                              <PauseCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingTask(task)}
                          title="Edit Task Details & Schedule"
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <DeleteTask id={taskId} setShowLog={setShowLog} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Infinite Scroll Sentinel / Loading Indicator */}
        <div ref={observerTarget} className="py-4 text-center">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-500 font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading more tasks...
            </div>
          ) : hasNextPage ? (
            <span className="text-xs text-slate-400 font-mono">
              Scroll to load more tasks
            </span>
          ) : (
            allTasks.length > 0 && (
              <span className="text-xs text-slate-400 font-mono italic">
                All tasks loaded
              </span>
            )
          )}
        </div>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          setIsOpen={(open) => !open && setEditingTask(null)}
          task={editingTask}
        />
      )}
    </div>
  );
}
