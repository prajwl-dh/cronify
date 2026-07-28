import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit3, FileText, Play } from "lucide-react";
import React, { useState } from "react";
import { APP_PORT } from "../../config/config";
import { useToast } from "../../store/toast/useToast";
import type { Task } from "../../types/taskType";
import { formatReadableDateTime } from "../../utils/converter";
import DeleteTask from "../tasks/DeleteTask";
import EditTaskModal from "../tasks/EditTaskModal";
import ScheduleBadge from "../tasks/ScheduleBadge";
import StatusBadge from "../tasks/StatusBadge";
import ExecutionLogs from "./ExecutionLogs";

type LogsType = {
  setShowLog: React.Dispatch<React.SetStateAction<number>>;
  showLog: number;
  tasks: Task[];
};

export default function Logs({ showLog, setShowLog, tasks }: LogsType) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const task = tasks.find((t) => t.id === showLog);

  const runTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`http://127.0.0.1:${APP_PORT}/api/tasks/${id}/run`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to trigger task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task triggered immediately!");
    },
    onError: () => {
      toast.error("An error occurred while running task");
    },
  });

  if (!task || task.id === undefined || showLog === -1) return null;

  const taskId = task.id;

  return (
    <div className="h-full w-full max-w-416 py-2 px-2 md:p-y4 md:px-6 flex flex-col gap-6 justify-between">
      {/* Logs header */}
      <div className="md:mt-4 w-full bg-(--foreground) rounded-2xl px-4 py-4 flex flex-col gap-2 shadow-sm border border-(--border)">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              onClick={() => setShowLog(-1)}
              className="flex items-center gap-1 text-(--themeAccent) text-xs font-semibold hover:underline w-fit cursor-pointer underline-offset-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </div>
            <div className="w-px h-3 bg-slate-400"></div>
            <StatusBadge taskStatus={task.status || "active"} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runTaskMutation.mutate(taskId)}
              disabled={runTaskMutation.isPending}
              title="Run task immediately"
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-bold transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Now
            </button>

            <button
              onClick={() => setIsEditModalOpen(true)}
              title="Edit task details"
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 font-bold transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>

            <DeleteTask id={taskId} setShowLog={setShowLog} />
          </div>
        </div>

        <span className="text-lg font-bold text-(--primaryText) mb-1 wrap-break-word">
          {task.name}
        </span>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-16">
          <code className="w-full text-xs md:text-sm font-bold block whitespace-nowrap overflow-x-auto custom-scrollbar text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-white/10 dark:border-white/5 font-mono">
            {task.command}
          </code>
          <div className="flex flex-row items-start gap-5 md:gap-8">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Schedule
              </p>
              <ScheduleBadge schedule={task.cron_string} />
            </div>
            <div className="w-max">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Created
              </p>
              <span className="text-xs text-(--primaryText) font-bold block">
                {formatReadableDateTime(task.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="h-full flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Execution Logs
          </div>
        </div>

        <div className="bg-(--foreground) rounded-2xl h-full shadow-sm max-h-[calc(100dvh-340px)] overflow-x-hidden overflow-y-auto border border-(--border)">
          <ExecutionLogs task={task} />
        </div>
      </div>

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          task={task}
        />
      )}
    </div>
  );
}
