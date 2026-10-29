import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock3,
  Plus,
  RefreshCw,
} from "lucide-react";
import { api } from "../api/client";
import type { Log, Task } from "../api/types";
import { ActivityChart } from "../components/ActivityChart";
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  Pill,
  Skeleton,
} from "../components/ui";
import {
  formatCountdown,
  formatDateTime,
  formatDuration,
  formatPercent,
  formatRelative,
  formatTime,
  logResult,
} from "../lib/format";
import { useNow } from "../lib/route";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <span className="fact-label">{label}</span>
      <span className="fact-value num">{value}</span>
    </div>
  );
}

function TaskRow({ task, now }: { task: Task; now: number }) {
  return (
    <a className="list-row" href={`#/logs?task=${task.id}`}>
      <span className="list-row-main">
        <span className="list-row-title">{task.name}</span>
        <span className="list-row-sub mono">{task.cron_string}</span>
      </span>
      <span className="list-row-side">
        <span className="mono">{formatRelative(task.next_run, now)}</span>
        <span className="list-row-sub">{formatDateTime(task.next_run)}</span>
      </span>
    </a>
  );
}

function RunRow({ log, now }: { log: Log; now: number }) {
  const success = log.exit_code === 0;

  return (
    <a className="run-row" href={`#/logs?task=${log.task_id}`}>
      <span className="run-mark" aria-hidden="true">
        {success ? <Check size={13} /> : <AlertTriangle size={13} />}
      </span>
      <span className="run-main">
        <span className="run-title">
          {log.task_name || `Task ${log.task_id}`}
        </span>
        <span className="run-sub">
          <span className="mono">{formatTime(log.executed_at)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatRelative(log.executed_at, now)}</span>
          <span aria-hidden="true">·</span>
          <span>{log.trigger}</span>
        </span>
      </span>
      <span className="run-side">
        <Pill tone={success ? "positive" : "negative"}>{logResult(log)}</Pill>
        <span className="run-duration mono">
          {formatDuration(log.duration_ms)}
        </span>
      </span>
    </a>
  );
}

function LoadingOverview() {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Overview</h1>
          <Skeleton className="skeleton-sub" />
        </div>
      </div>
      <section className="panel lead lead-skeleton">
        <div className="lead-main">
          <Skeleton className="skeleton-label" />
          <Skeleton className="skeleton-countdown" />
          <Skeleton className="skeleton-task" />
        </div>
        <div className="lead-facts">
          {[0, 1, 2, 3].map((item) => (
            <div className="fact" key={item}>
              <Skeleton className="skeleton-label" />
              <Skeleton className="skeleton-value" />
            </div>
          ))}
        </div>
      </section>
      <section className="overview-grid">
        <div className="panel span-8 chart-panel">
          <div className="panel-head">
            <Skeleton className="skeleton-title" />
          </div>
          <Skeleton className="skeleton-chart" />
        </div>
        <div className="panel span-4">
          <div className="panel-head">
            <Skeleton className="skeleton-title" />
          </div>
          <Skeleton className="skeleton-list" />
        </div>
      </section>
    </>
  );
}

export function OverviewPage({ onNewTask }: { onNewTask: () => void }) {
  const queryClient = useQueryClient();
  const now = useNow(1000);
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
    refetchInterval: 5_000,
  });

  if (overview.isPending) return <LoadingOverview />;

  if (overview.isError) {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>Overview</h1>
            <p className="sub">The daemon could not be reached.</p>
          </div>
        </div>
        <div className="panel">
          <ErrorState
            message={overview.error.message}
            onRetry={() => overview.refetch()}
          />
        </div>
      </>
    );
  }

  const data = overview.data;
  const nextRun = data.nextRun;
  const afterNext = data.upcoming.slice(1);
  const failureText =
    data.runs.failure === 0
      ? "No failed executions in the last 24 hours."
      : `${data.runs.failure} failed ${
          data.runs.failure === 1 ? "execution" : "executions"
        } in the last 24 hours.`;
  const finding =
    data.runs.total === 0
      ? "No executions recorded in the last 24 hours."
      : failureText;
  const countdown = formatCountdown(nextRun?.next_run, now);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Overview</h1>
          <p className="sub">{finding}</p>
        </div>
        <div className="title-actions">
          <span className="stamp">
            Updated <span className="mono">{formatTime(data.generatedAt)}</span>
          </span>
          <IconButton
            label="Refresh overview"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["overview"] })
            }
          >
            <RefreshCw
              size={14}
              className={overview.isFetching ? "spin" : undefined}
            />
          </IconButton>
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={onNewTask}
          >
            New task
          </Button>
        </div>
      </div>

      <section className="panel lead" aria-label="Scheduler status">
        <div className="lead-main">
          <div className="lead-label-row">
            <span className="label">Next up</span>
            {data.counts.running > 0 ? (
              <Pill tone="positive">{data.counts.running} running</Pill>
            ) : null}
          </div>
          <span className="lead-countdown num">{countdown}</span>
          {nextRun ? (
            <>
              <span className="lead-task">{nextRun.name}</span>
              <span className="lead-meta">
                <span className="mono">{nextRun.cron_string}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateTime(nextRun.next_run)}</span>
                {nextRun.schedule_description ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{nextRun.schedule_description}</span>
                  </>
                ) : null}
              </span>
            </>
          ) : (
            <span className="lead-task lead-empty">
              Nothing scheduled. Add a task to start the clock.
            </span>
          )}
        </div>

        <div className="lead-facts">
          <Fact label="Scheduled" value={String(data.counts.scheduled)} />
          <Fact label="Paused" value={String(data.counts.paused)} />
          <Fact label="Runs · 24h" value={String(data.runs.total)} />
          <Fact
            label="Success · 24h"
            value={formatPercent(data.runs.successRate)}
          />
        </div>
      </section>

      <section className="overview-grid section">
        <div className="panel span-8 chart-panel">
          <div className="panel-head">
            <div>
              <h2>Executions</h2>
              <p className="panel-sub">Per hour, last 24 hours</p>
            </div>
            <span className="panel-meta">
              avg{" "}
              <span className="mono">
                {formatDuration(data.runs.averageDurationMs)}
              </span>
            </span>
          </div>
          <ActivityChart buckets={data.hourly} />
        </div>

        <div className="panel span-4">
          <div className="panel-head">
            <div>
              <h2>Failures</h2>
              <p className="panel-sub">Last 24 hours</p>
            </div>
            <span className="panel-meta mono">{data.runs.failure}</span>
          </div>

          {data.failures.length === 0 ? (
            <EmptyState title="All work exited cleanly">
              No failed executions in this window. The next check runs with the
              daemon.
            </EmptyState>
          ) : (
            <ul className="failure-list">
              {data.failures.map((log) => (
                <li key={log.id}>
                  <a
                    href={`#/logs?task=${log.task_id}`}
                    className="failure-row"
                  >
                    <span className="failure-main">
                      <span className="failure-title">
                        {log.task_name || `Task ${log.task_id}`}
                      </span>
                      <span className="failure-sub">
                        <span className="mono">
                          exit {log.exit_code ?? "—"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelative(log.executed_at, now)}</span>
                      </span>
                    </span>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="overview-grid section">
        <div className="panel span-7">
          <div className="panel-head">
            <div>
              <h2>Recent executions</h2>
              <p className="panel-sub">Newest first</p>
            </div>
            <a className="card-link" href="#/logs">
              View logs
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>

          {data.recent.length === 0 ? (
            <EmptyState
              title="Nothing has run yet"
              action={
                <Button variant="secondary" size="sm" onClick={onNewTask}>
                  Create the first task
                </Button>
              }
            >
              The first execution will appear here with its duration and exit
              code.
            </EmptyState>
          ) : (
            <div className="run-list">
              {data.recent.map((log) => (
                <RunRow key={log.id} log={log} now={now} />
              ))}
            </div>
          )}
        </div>

        <div className="panel span-5">
          <div className="panel-head">
            <div>
              <h2>After that</h2>
              <p className="panel-sub">Next scheduled arrivals</p>
            </div>
            <a className="card-link" href="#/tasks">
              View tasks
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </div>

          {afterNext.length === 0 ? (
            <EmptyState
              title={nextRun ? "Nothing else scheduled" : "No upcoming runs"}
              action={
                <Button variant="secondary" size="sm" onClick={onNewTask}>
                  New task
                </Button>
              }
            >
              {nextRun
                ? "This is the only task waiting on the clock."
                : "Create a task to put something on the schedule."}
            </EmptyState>
          ) : (
            <div className="list-rows">
              {afterNext.map((task) => (
                <TaskRow key={task.id} task={task} now={now} />
              ))}
            </div>
          )}

          <div className="panel-foot-note">
            <Clock3 size={13} aria-hidden="true" />
            <span>
              Daemon time {formatTime(data.generatedAt)} ·{" "}
              <span className="mono">{data.daemon.dataDir}</span>
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
