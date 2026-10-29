import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import {
  color,
  formatDuration,
  formatRelative,
  formatTimestamp,
  table,
} from "../lib/render";

type Overview = {
  counts: {
    total: number;
    scheduled: number;
    paused: number;
    completed: number;
    running: number;
  };
  runs: {
    total: number;
    success: number;
    failure: number;
    successRate: number | null;
    averageDurationMs: number | null;
  };
  upcoming: Array<{
    id: number;
    name: string;
    cron_string: string;
    next_run: number;
  }>;
  failures: Array<{
    id: number;
    task_id: number;
    task_name: string;
    executed_at: number;
    exit_code: number | null;
  }>;
  daemon: { version: string; port: number; uptimeMs: number };
};

/**
 * CLI command: stats
 * Prints the daemon's health and the last 24 hours of execution.
 */
export async function statsCommand(values: { json?: boolean } = {}) {
  const data = (await apiFetch(`${getApiUrl()}/api/overview`)) as Overview;

  if (values.json) {
    console.info(JSON.stringify(data, null, 2));
    return;
  }

  const rate =
    data.runs.successRate === null
      ? "—"
      : `${data.runs.successRate.toFixed(1)}%`;

  console.info(color.bold("Cronify daemon"));
  console.info(
    `  v${data.daemon.version} · http://127.0.0.1:${data.daemon.port} · up ${formatDuration(data.daemon.uptimeMs)}`,
  );

  console.info("");
  console.info(
    table(
      [
        "Tasks",
        "Scheduled",
        "Paused",
        "Completed",
        "Runs 24h",
        "Success 24h",
        "Failures 24h",
        "Avg duration",
      ],
      [
        [
          String(data.counts.total),
          String(data.counts.scheduled),
          String(data.counts.paused),
          String(data.counts.completed),
          String(data.runs.total),
          rate,
          String(data.runs.failure),
          formatDuration(data.runs.averageDurationMs),
        ],
      ],
      ["right", "right", "right", "right", "right", "right", "right", "right"],
    ),
  );

  if (data.upcoming.length > 0) {
    console.info("");
    console.info(color.dim("Next up"));
    for (const task of data.upcoming.slice(0, 4)) {
      console.info(
        `  ${task.name} ${color.dim(`#${task.id}`)} · ${task.cron_string} · ${formatTimestamp(task.next_run)} (${formatRelative(task.next_run)})`,
      );
    }
  }

  if (data.failures.length > 0) {
    console.info("");
    console.info(color.dim("Recent failures"));
    for (const log of data.failures.slice(0, 4)) {
      console.info(
        `  ${log.task_name || `Task ${log.task_id}`} · ${formatTimestamp(log.executed_at)} · ${color.red(`exit ${log.exit_code ?? "?"}`)}`,
      );
    }
  }
}
