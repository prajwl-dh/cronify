import { useInfiniteQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { APP_PORT } from "../../config/config";
import type { Log } from "../../types/logType";
import type { Task } from "../../types/taskType";
import ExpandableLog from "./ExpandableLog";
import LogFilters from "./LogFilters";

export default function ExecutionLogs({ task }: { task?: Task }) {
  const [openedLog, setOpenedLog] = useState(-1);

  // Filters state
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: [
      "logs",
      task?.id,
      statusFilter,
      timeRange,
      startDate,
      endDate,
      searchFilter,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: "20",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(timeRange !== "all" && { timeRange }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(searchFilter && { search: searchFilter }),
      });

      const endpoint = task?.id
        ? `http://127.0.0.1:${APP_PORT}/api/logs/${task.id}?${params}`
        : `http://127.0.0.1:${APP_PORT}/api/logs?${params}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch logs");
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

  const handleResetFilters = () => {
    setStatusFilter("all");
    setTimeRange("all");
    setStartDate("");
    setEndDate("");
    setSearchFilter("");
  };

  const allLogs: Log[] =
    data?.pages.flatMap((page) => (Array.isArray(page) ? page : page.logs || [])) ||
    [];

  return (
    <div className="flex flex-col p-4 h-full">
      {/* Log Filtering Panel */}
      <LogFilters
        taskId={task?.id}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        onResetFilters={handleResetFilters}
      />

      {/* Logs List Container */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm font-medium">Loading execution logs...</p>
        </div>
      ) : allLogs.length === 0 ? (
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center h-full">
          <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
            No logs found
          </p>
          <p className="text-sm mt-1">
            {task
              ? "This task hasn't generated any matching logs yet."
              : "No system execution logs match your filter criteria."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {allLogs.map((log, index) => (
            <ExpandableLog
              key={`${log.id}-${index}`}
              log={log}
              index={index}
              openedLog={openedLog}
              setOpenedLog={setOpenedLog}
            />
          ))}

          {/* Infinite Scroll Sentinel / Loading Indicator */}
          <div ref={observerTarget} className="py-4 text-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 text-xs text-indigo-500 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more logs...
              </div>
            ) : hasNextPage ? (
              <span className="text-xs text-slate-400 font-mono">
                Scroll down to load more
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-mono italic">
                Reached end of execution logs
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
