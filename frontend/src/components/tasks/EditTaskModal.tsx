import { Dialog, DialogPanel } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Edit3, Repeat, X, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { APP_PORT } from "../../config/config";
import { useToast } from "../../store/toast/useToast";
import type { Task } from "../../types/taskType";
import { formatDateTimeLocal } from "../../utils/converter";
import cronValidator from "../../utils/validator";
import Button from "../common/Button";

type EditTaskModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  task: Task | null;
};

const CRON_PRESETS = [
  { label: "Every min", cron: "* * * * *" },
  { label: "Every 5 mins", cron: "*/5 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Mon at 9 AM", cron: "0 9 * * 1" },
];

export default function EditTaskModal({
  isOpen,
  setIsOpen,
  task,
}: EditTaskModalProps) {
  const [name, setName] = useState("");
  const [command, setCommand] = useState("");
  const [scheduleType, setScheduleType] = useState("once");
  const [scheduleValue, setScheduleValue] = useState("");
  const [cronError, setCronError] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (task) {
      setName(task.name || "");
      setCommand(task.command || "");

      const cronStr = task.cron_string || "@once";

      if (cronStr === "@once") {
        setScheduleType("once");
        setScheduleValue("");
      } else if (!isNaN(Date.parse(cronStr))) {
        setScheduleType("date");
        try {
          const d = new Date(cronStr);
          const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setScheduleValue(isoStr);
        } catch {
          setScheduleValue("");
        }
      } else {
        setScheduleType("cron");
        setScheduleValue(cronStr);
      }
      setCronError("");
    }
  }, [task]);

  const editTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(`http://127.0.0.1:${APP_PORT}/api/tasks/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Task updated successfully");
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred while updating task");
    },
  });

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!task) return;

    if (name.trim().length === 0 || command.trim().length === 0) {
      toast.error("Name and command cannot be empty");
      return;
    }

    if (scheduleType === "cron") {
      const error = cronValidator(scheduleValue);
      if (scheduleValue.trim().length === 0 || error.length > 0) {
        setCronError(error || "Invalid cron expression");
        toast.error("Please enter a valid cron expression");
        return;
      }
    }

    let finalSchedule = scheduleValue;
    if (scheduleType === "once") {
      finalSchedule = "@once";
    } else if (scheduleType === "date") {
      finalSchedule = formatDateTimeLocal(scheduleValue);
    }

    const payload = {
      id: task.id,
      name: name.trim(),
      command: command.trim(),
      schedule: finalSchedule,
    };

    editTaskMutation.mutate(payload);
  };

  if (!task) return null;

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-50 focus:outline-none font-mono"
      onClose={() => setIsOpen(false)}
    >
      <div className="flex fixed inset-0 z-50 overflow-y-auto items-center justify-center bg-transparent backdrop-blur-xl p-2">
        <DialogPanel className="flex flex-col gap-4 p-6 w-full max-w-lg rounded-2xl bg-(--foreground) border border-(--border) shadow-xl">
          {/* Title */}
          <div className="flex items-center justify-between mb-1 text-(--primaryText)">
            <div className="flex items-center gap-2">
              <div className="bg-(--bgActive) p-1.5 rounded-2xl text-(--themeAccent)">
                <Edit3 className="h-5 w-5 font-bold" />
              </div>
              <span className="font-bold text-lg">Edit Task #{task.id}</span>
            </div>

            <button
              disabled={editTaskMutation.isPending}
              className="cursor-pointer text-slate-400 hover:text-slate-200"
              title="Close"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5 font-bold" />
            </button>
          </div>

          <form onSubmit={handleUpdateTask} className="flex flex-col gap-4 text-(--primaryText)">
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                Task Name
              </span>
              <input
                disabled={editTaskMutation.isPending}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-(--background) border-[1.5px] border-(--border) rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-(--borderActive)"
                type="text"
                placeholder="Task Name"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                Command to Execute
              </span>
              <input
                disabled={editTaskMutation.isPending}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full bg-(--background) border-[1.5px] border-(--border) rounded-xl px-4 py-2 text-sm font-mono text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-(--borderActive)"
                type="text"
                placeholder="Command"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                Schedule Type (Convert / Update)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "once", icon: Zap, label: "Immediate" },
                  { id: "date", icon: CalendarDays, label: "Specific Time" },
                  { id: "cron", icon: Repeat, label: "Recurring" },
                ].map((type) => (
                  <button
                    disabled={editTaskMutation.isPending}
                    key={type.id}
                    type="button"
                    onClick={() => {
                      if (scheduleType !== type.id) {
                        setScheduleValue("");
                      }
                      setScheduleType(type.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                      scheduleType === type.id
                        ? "bg-(--bgActive) border-(--borderActive) text-(--themeAccent) shadow-sm"
                        : "bg-(--foreground) border-(--border) hover:bg-(--bgActive)"
                    }`}
                  >
                    <type.icon className="w-4 h-4 mb-1" />
                    <span className="text-xs font-semibold">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {scheduleType === "date" && (
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                  Select Date & Time
                </span>
                <input
                  disabled={editTaskMutation.isPending}
                  type="datetime-local"
                  required
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(e.target.value)}
                  className="w-full bg-(--background) border-[1.5px] border-(--border) rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-(--borderActive) dark:scheme-dark"
                />
              </div>
            )}

            {scheduleType === "cron" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-xs uppercase tracking-wider text-slate-400">
                  Cron Expression
                </span>
                <input
                  disabled={editTaskMutation.isPending}
                  type="text"
                  required
                  value={scheduleValue}
                  onChange={(e) => {
                    setScheduleValue(e.target.value);
                    if (e.target.value.trim().length === 0) {
                      setCronError("");
                    } else {
                      setCronError(cronValidator(e.target.value));
                    }
                  }}
                  placeholder="* * * * *"
                  className={`w-full bg-(--background) border-[1.5px] rounded-xl px-4 py-2 text-sm focus:outline-none ${
                    cronError.length > 0
                      ? "border-red-500 focus:border-red-500"
                      : "border-(--border) focus:border-(--borderActive)"
                  }`}
                />
                {cronError.length > 0 && (
                  <span className="text-xs text-red-500">{cronError}</span>
                )}

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[10px] text-slate-500 font-bold self-center mr-1">
                    Presets:
                  </span>
                  {CRON_PRESETS.map((p) => (
                    <button
                      key={p.cron}
                      type="button"
                      onClick={() => {
                        setScheduleValue(p.cron);
                        setCronError(cronValidator(p.cron));
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {task.status === "obsolete" && (
              <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                ⚡ Note: Updating schedule will re-activate this completed task!
              </p>
            )}

            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                disabled={editTaskMutation.isPending}
                title="Cancel"
                onClick={() => setIsOpen(false)}
                className="text-xs px-4 py-2 border border-(--border) bg-(--background) text-(--primaryText) rounded-xl cursor-pointer hover:brightness-90 font-bold"
              >
                Cancel
              </Button>
              <Button
                disabled={editTaskMutation.isPending}
                type="submit"
                title="Save Changes"
                className="text-xs px-4 py-2 bg-(--themeAccent) text-white rounded-xl cursor-pointer hover:brightness-125 font-bold"
              >
                {editTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
