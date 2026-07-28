import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { APP_PORT } from "../../config/config";
import { useToast } from "../../store/toast/useToast";

type LogFiltersProps = {
  taskId?: number;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  searchFilter: string;
  setSearchFilter: (search: string) => void;
  onResetFilters: () => void;
};

export default function LogFilters({
  taskId,
  statusFilter,
  setStatusFilter,
  timeRange,
  setTimeRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchFilter,
  setSearchFilter,
  onResetFilters,
}: LogFiltersProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const endpoint = taskId
        ? `http://127.0.0.1:${APP_PORT}/api/logs/${taskId}`
        : `http://127.0.0.1:${APP_PORT}/api/logs`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear logs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      toast.success("Logs cleared successfully");
      setShowClearConfirm(false);
    },
    onError: () => {
      toast.error("An error occurred while clearing logs");
    },
  });

  const hasActiveFilters =
    statusFilter !== "all" ||
    timeRange !== "all" ||
    startDate !== "" ||
    endDate !== "" ||
    searchFilter !== "";

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-4">
      {/* Header and Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Filter className="w-4 h-4 text-indigo-500" />
          Filter Logs
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all font-medium cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filters
            </button>
          )}

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all font-medium cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Clear Logs
          </button>
        </div>
      </div>

      {/* Filter Options Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs align-middle">
        {/* Status / Error Type Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Status / Execution Result
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Results</option>
            <option value="success">✅ Success Only (Exit 0)</option>
            <option value="error">❌ Errors / Failures Only</option>
          </select>
        </div>

        {/* Time Period Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Time Period
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Time</option>
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Search Output / Errors */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Search Log Output / Error Text
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search stdout, stderr, or command..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {timeRange === "custom" && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              From:
            </span>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 dark:scheme-dark"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              To:
            </span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-slate-800 dark:text-slate-200 dark:scheme-dark"
            />
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                Clear Logs?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete{" "}
              {taskId ? "logs for this task" : "all logs"}? This action cannot
              be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => clearLogsMutation.mutate()}
                disabled={clearLogsMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer"
              >
                {clearLogsMutation.isPending
                  ? "Clearing..."
                  : "Yes, Clear Logs"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
