import { useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { api, type LogQuery } from "../api/client";
import type { Log } from "../api/types";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Pill,
  Select,
  Skeleton,
} from "../components/ui";
import { CopyButton } from "../components/CopyButton";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  logResult,
  triggerLabel,
} from "../lib/format";
import { navigate, useDebounced, useNow } from "../lib/route";
import { useToast } from "../lib/toast";

function LoadingLogs() {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Execution log</h1>
          <Skeleton className="skeleton-sub" />
        </div>
        <Skeleton className="skeleton-button" />
      </div>
      <div className="panel log-summary">
        {[0, 1, 2, 3].map((item) => (
          <div className="fact" key={item}>
            <Skeleton className="skeleton-label" />
            <Skeleton className="skeleton-value" />
          </div>
        ))}
      </div>
      <div className="panel log-panel">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div className="log-row log-row-skeleton" key={row}>
            <Skeleton className="skeleton-line short" />
            <Skeleton className="skeleton-task-name" />
            <Skeleton className="skeleton-pill" />
            <Skeleton className="skeleton-line short" />
            <Skeleton className="skeleton-line short" />
            <Skeleton className="skeleton-line short" />
          </div>
        ))}
      </div>
    </>
  );
}

function LogDetail({ log }: { log: Log }) {
  const detail = useQuery({
    queryKey: ["log", log.id],
    queryFn: () => api.logDetail(log.id),
    staleTime: 30_000,
  });

  if (detail.isPending) {
    return (
      <div className="log-detail">
        <div className="log-detail-meta">
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line short" />
        </div>
        <Skeleton className="skeleton-code" />
      </div>
    );
  }

  if (detail.isError) {
    return (
      <div className="log-detail">
        <ErrorState
          message={detail.error.message}
          onRetry={() => detail.refetch()}
        />
      </div>
    );
  }

  const full = detail.data;

  return (
    <div className="log-detail">
      <div className="log-detail-meta">
        <span>
          Log <span className="mono">#{full.id}</span>
        </span>
        <span>
          Task <span className="mono">#{full.task_id}</span>
        </span>
        <span>
          Started{" "}
          <span className="mono">{formatDateTime(full.executed_at)}</span>
        </span>
        <span>
          Duration{" "}
          <span className="mono">{formatDuration(full.duration_ms)}</span>
        </span>
        <span>
          Attempt <span className="mono">{full.attempt}</span>
        </span>
        <span className="log-detail-result">
          {full.exit_code === 0 ? <Check size={13} aria-hidden="true" /> : null}
          <span className="mono">exit {full.exit_code ?? "—"}</span>
        </span>
      </div>

      <div className="output-block">
        <div className="output-head">
          <span>stdout</span>
          {full.stdout ? (
            <CopyButton text={full.stdout} label="Stdout" />
          ) : null}
        </div>
        {full.stdout ? (
          <pre className="output">{full.stdout}</pre>
        ) : (
          <p className="output-empty">No standard output recorded.</p>
        )}
      </div>

      <div className="output-block">
        <div className="output-head">
          <span>stderr</span>
          {full.stderr ? (
            <CopyButton text={full.stderr} label="Stderr" />
          ) : null}
        </div>
        {full.stderr ? (
          <pre className="output output-error">{full.stderr}</pre>
        ) : (
          <p className="output-empty">No standard error recorded.</p>
        )}
      </div>
    </div>
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
  now,
}: {
  log: Log;
  expanded: boolean;
  onToggle: () => void;
  now: number;
}) {
  const success = log.exit_code === 0;

  return (
    <div className={`log-entry${expanded ? " log-entry-open" : ""}`}>
      <div className="log-row">
        <span className="log-time" role="cell">
          <span className="mono">{formatTime(log.executed_at)}</span>
          <span className="cell-sub">
            {formatRelative(log.executed_at, now)}
          </span>
        </span>

        <span className="log-task" role="cell">
          <span className="log-task-name">
            {log.task_name || `Task ${log.task_id}`}
          </span>
          <span className="cell-sub mono" title={log.task_command}>
            {log.task_command || `task #${log.task_id}`}
          </span>
        </span>

        <span role="cell">
          <Pill tone={success ? "positive" : "negative"}>{logResult(log)}</Pill>
        </span>

        <span className="log-number" role="cell">
          <span className="mono">{formatDuration(log.duration_ms)}</span>
        </span>

        <span className="log-trigger" role="cell">
          {triggerLabel(log.trigger)}
        </span>

        <span className="log-number" role="cell">
          <span className="mono">{log.attempt}</span>
          <span className="cell-sub">attempt</span>
        </span>

        <span className="log-expand" role="cell">
          <IconButton
            label={expanded ? "Hide execution output" : "Show execution output"}
            aria-expanded={expanded}
            onClick={onToggle}
          >
            <ChevronDown
              size={15}
              className={expanded ? "rotate-180" : undefined}
            />
          </IconButton>
        </span>
      </div>

      {expanded ? <LogDetail log={log} /> : null}
    </div>
  );
}

export function LogsPage({ initialTaskId }: { initialTaskId: number | null }) {
  const queryClient = useQueryClient();
  const now = useNow(1000);
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LogQuery["status"]>("all");
  const [taskId, setTaskId] = useState<number | null>(initialTaskId);
  const [timeRange, setTimeRange] = useState<LogQuery["timeRange"]>("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const debouncedSearch = useDebounced(search, 350);

  useEffect(() => {
    setTaskId(initialTaskId);
    setPage(1);
  }, [initialTaskId]);

  useEffect(() => {
    setPage(1);
  }, [status, taskId, timeRange, debouncedSearch]);

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: api.tasks,
    staleTime: 10_000,
  });

  const logsQuery = useQuery({
    queryKey: [
      "logs",
      { page, status, taskId, timeRange, search: debouncedSearch },
    ],
    queryFn: () =>
      api.logs({
        page,
        status,
        taskId,
        timeRange,
        search: debouncedSearch,
        limit: 20,
      }),
    placeholderData: keepPreviousData,
    refetchInterval: 8_000,
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearLogs(taskId),
    onSuccess: (result) => {
      toast(
        `${formatNumber(result.deleted)} execution ${
          result.deleted === 1 ? "log" : "logs"
        } cleared.`,
        "success",
      );
      setConfirmClear(false);
      setExpanded(null);
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      setConfirmClear(false);
      toast(error.message, "error");
    },
  });

  const data = logsQuery.data;
  const summary = data?.summary;
  const successRate =
    summary && summary.total > 0
      ? (summary.success / summary.total) * 100
      : null;
  const taskName = taskId
    ? tasksQuery.data?.find((task) => task.id === taskId)?.name
    : null;
  const filterIsActive =
    Boolean(search) ||
    status !== "all" ||
    taskId !== null ||
    timeRange !== "all";
  const rangeStart = data ? (data.page - 1) * 20 + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * 20, data.total) : 0;

  const description = useMemo(() => {
    if (!summary) return "Every execution the daemon has recorded.";
    if (summary.failure > 0) {
      return `${summary.failure} failed ${
        summary.failure === 1 ? "execution" : "executions"
      } in this view. Open a row for the full output.`;
    }
    return "No failed executions in this view. Open a row for the full output.";
  }, [summary]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setTaskId(null);
    setTimeRange("all");
    navigate("#/logs");
  }

  if (logsQuery.isPending) return <LoadingLogs />;

  if (logsQuery.isError) {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>Execution log</h1>
            <p className="sub">The execution history could not be loaded.</p>
          </div>
        </div>
        <div className="panel">
          <ErrorState
            message={logsQuery.error.message}
            onRetry={() => logsQuery.refetch()}
          />
        </div>
      </>
    );
  }

  if (!data || !summary) return <LoadingLogs />;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Execution log</h1>
          <p className="sub">{description}</p>
        </div>
        <div className="title-actions">
          <span className="stamp">
            Updated{" "}
            <span className="mono">{formatTime(logsQuery.dataUpdatedAt)}</span>
          </span>
          <IconButton
            label="Refresh execution log"
            onClick={() => logsQuery.refetch()}
          >
            <RefreshCw
              size={14}
              className={logsQuery.isFetching ? "spin" : undefined}
            />
          </IconButton>
          <Button
            variant="danger"
            size="md"
            icon={<Trash2 size={14} />}
            onClick={() => setConfirmClear(true)}
            disabled={summary.total === 0}
          >
            Clear {taskName ? "task log" : "logs"}
          </Button>
        </div>
      </div>

      <div className="panel log-summary" aria-label="Filtered log summary">
        <div className="fact">
          <span className="fact-label">Executions</span>
          <span className="fact-value num">{formatNumber(summary.total)}</span>
        </div>
        <div className="fact">
          <span className="fact-label">Succeeded</span>
          <span className="fact-value num">
            {formatNumber(summary.success)}
          </span>
        </div>
        <div className="fact">
          <span className="fact-label">Failed</span>
          <span
            className={`fact-value num${summary.failure > 0 ? " negative" : ""}`}
          >
            {formatNumber(summary.failure)}
          </span>
        </div>
        <div className="fact">
          <span className="fact-label">Success rate</span>
          <span className="fact-value num">{formatPercent(successRate)}</span>
        </div>
      </div>

      <div className="toolbar log-toolbar">
        <div className="toolbar-left">
          <div className="search-field">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search output, task or command"
              aria-label="Search execution output"
            />
          </div>
          <Select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as LogQuery["status"])
            }
            aria-label="Filter by result"
          >
            <option value="all">All results</option>
            <option value="success">Succeeded</option>
            <option value="error">Failed</option>
          </Select>
          <Select
            value={taskId ?? ""}
            onChange={(event) =>
              setTaskId(event.target.value ? Number(event.target.value) : null)
            }
            aria-label="Filter by task"
          >
            <option value="">All tasks</option>
            {(tasksQuery.data ?? []).map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </Select>
          <Select
            value={timeRange}
            onChange={(event) =>
              setTimeRange(event.target.value as LogQuery["timeRange"])
            }
            aria-label="Filter by time"
          >
            <option value="all">Any time</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        </div>
        <span className="toolbar-count">
          <span className="mono">{formatNumber(summary.total)}</span>{" "}
          {summary.total === 1 ? "execution" : "executions"}
        </span>
      </div>

      {filterIsActive ? (
        <div className="filter-note">
          <span>
            {taskName ? (
              <>
                Showing <strong>{taskName}</strong>
              </>
            ) : (
              "Showing a filtered view"
            )}
          </span>
          <button type="button" className="link-button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : null}

      <div className="panel log-panel">
        {data.logs.length === 0 ? (
          <EmptyState
            title={
              filterIsActive
                ? "No executions match these filters"
                : "No executions yet"
            }
            action={
              filterIsActive ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          >
            {filterIsActive
              ? "Try another task, result or time range."
              : "Run a task, or wait for the schedule. Output and exit codes are kept here."}
          </EmptyState>
        ) : (
          <div className="log-table" role="table" aria-label="Execution log">
            <div className="log-head" role="row">
              <span role="columnheader">Time</span>
              <span role="columnheader">Task</span>
              <span role="columnheader">Result</span>
              <span role="columnheader" className="num">
                Duration
              </span>
              <span role="columnheader">Trigger</span>
              <span role="columnheader" className="num">
                Attempt
              </span>
              <span role="columnheader" className="actions-head">
                <span className="sr-only">Output</span>
              </span>
            </div>

            {data.logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                expanded={expanded === log.id}
                onToggle={() =>
                  setExpanded(expanded === log.id ? null : log.id)
                }
                now={now}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pagination">
        <span className="pagination-range">
          {data.total === 0 ? (
            "0 executions"
          ) : (
            <>
              <span className="mono">{formatNumber(rangeStart)}</span>–
              <span className="mono">{formatNumber(rangeEnd)}</span> of{" "}
              <span className="mono">{formatNumber(data.total)}</span>
            </>
          )}
        </span>
        <div className="pagination-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<ChevronLeft size={13} />}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={data.page <= 1}
          >
            Previous
          </Button>
          <span className="pagination-page mono">
            {data.page} / {data.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((current) => current + 1)}
            disabled={!data.hasMore}
          >
            Next
            <ChevronRight size={13} />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title={
          taskName
            ? `Clear logs for “${taskName}”?`
            : "Clear all execution logs?"
        }
        description={
          <>
            <span className="mono">{formatNumber(summary.total)}</span>{" "}
            execution {summary.total === 1 ? "log" : "logs"} will be deleted
            permanently. Tasks, schedules and settings are kept.
          </>
        }
        confirmLabel="Clear logs"
        busy={clearMutation.isPending}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => clearMutation.mutate()}
      />
    </>
  );
}
