import { Activity, CheckCircle2, Clock } from "lucide-react";
import type { Task } from "../../types/taskType";

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
    <div className="shrink-0 grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-8 mt-2 md:mt-10 select-none">
      {/* Total */}
      <div
        onClick={() => setStatusFilter("all")}
        className={`bg-(--foreground) border rounded-2xl p-2 md:p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === "all" ? "border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400" : "border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"}`}
      >
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl w-min">
          <Activity className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-2 md:gap-0">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-0.5 break-all">
            Total Tasks
          </p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none text-center md:text-start">
            {tasks.length}
          </h3>
        </div>
      </div>

      {/* Scheduled */}
      <div
        onClick={() => setStatusFilter("inactive")}
        className={`bg-(--foreground) border rounded-2xl p-2 md:p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === "inactive" ? "border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-400 dark:ring-emerald-400" : "border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800"}`}
      >
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl w-min">
          <Clock className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-2 md:gap-0">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-0.5 break-all">
            Scheduled
          </p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none text-center md:text-start">
            {tasks.filter((task) => task.status === "inactive").length}
          </h3>
        </div>
      </div>

      {/* Completed */}
      <div
        onClick={() => setStatusFilter("obsolete")}
        className={`bg-(--foreground) border rounded-2xl p-2 md:p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${statusFilter === "obsolete" ? "border-slate-500 ring-1 ring-slate-500 dark:border-slate-400 dark:ring-slate-400" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}
      >
        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl w-min">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-2 md:gap-0">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-0.5 break-all">
            Completed
          </p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none text-center md:text-start">
            {tasks.filter((task) => task.status === "obsolete").length}
          </h3>
        </div>
      </div>
    </div>
  );
}
