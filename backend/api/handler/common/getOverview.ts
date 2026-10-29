import { Database } from "bun:sqlite";
import pkg from "../../../../package.json";
import { initConfig } from "../../../config/config";
import { getRunningTaskIds } from "../../../engine/runner";
import type { Log } from "../../../types/logType";
import type { Task } from "../../../types/taskType";
import { describeSchedule } from "../../../utils/schedule";
import { json } from "../../lib/http";

const HOUR = 60 * 60 * 1000;

function hourLabel(timestamp: number) {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

/**
 * Handles GET /api/overview
 * One payload for the dashboard: task counts, the last 24 hours of
 * executions, upcoming tasks and recent failures.
 */
export async function getOverview(db: Database) {
  const now = Date.now();
  const windowStart = Math.floor(now / HOUR) * HOUR - 23 * HOUR;
  const config = initConfig();

  const statusRows = db
    .query("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
    .all() as { status: string; count: number }[];

  const counts = {
    total: 0,
    scheduled: 0,
    paused: 0,
    completed: 0,
    running: 0,
  };

  for (const row of statusRows) {
    counts.total += row.count;
    if (row.status === "inactive") counts.scheduled += row.count;
    else if (row.status === "paused") counts.paused += row.count;
    else if (row.status === "obsolete") counts.completed += row.count;
    else if (row.status === "active") counts.running += row.count;
  }

  const runningTaskIds = getRunningTaskIds();

  const summary = db
    .query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN exit_code = 0 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN exit_code IS NULL OR exit_code != 0 THEN 1 ELSE 0 END) as failure,
        AVG(duration_ms) as average_duration
      FROM logs
      WHERE executed_at >= ?
      `,
    )
    .get(windowStart) as {
    total: number;
    success: number | null;
    failure: number | null;
    average_duration: number | null;
  };

  const runRows = db
    .query(
      "SELECT executed_at, exit_code, duration_ms FROM logs WHERE executed_at >= ? ORDER BY executed_at ASC",
    )
    .all(windowStart) as {
    executed_at: number;
    exit_code: number | null;
    duration_ms: number | null;
  }[];

  const buckets = Array.from({ length: 24 }, (_, index) => {
    const start = windowStart + index * HOUR;
    return {
      start,
      label: hourLabel(start),
      runs: 0,
      failures: 0,
    };
  });

  for (const row of runRows) {
    const index = Math.floor((row.executed_at - windowStart) / HOUR);
    const bucket = buckets[index];
    if (!bucket) continue;
    bucket.runs += 1;
    if (row.exit_code === null || row.exit_code !== 0) bucket.failures += 1;
  }

  const upcoming = (
    db
      .query(
        `
      SELECT * FROM tasks
      WHERE status = 'inactive' AND next_run >= ?
      ORDER BY next_run ASC
      LIMIT 6
      `,
      )
      .all(now - 60_000) as Task[]
  ).map((task) => ({
    ...task,
    schedule_description: describeSchedule(task.cron_string),
  }));

  const recent = db
    .query(
      `
      SELECT logs.*, tasks.name as task_name, tasks.command as task_command
      FROM logs LEFT JOIN tasks ON logs.task_id = tasks.id
      ORDER BY logs.executed_at DESC, logs.id DESC
      LIMIT 6
      `,
    )
    .all() as Log[];

  const failures = db
    .query(
      `
      SELECT logs.*, tasks.name as task_name, tasks.command as task_command
      FROM logs LEFT JOIN tasks ON logs.task_id = tasks.id
      WHERE logs.executed_at >= ? AND (logs.exit_code IS NULL OR logs.exit_code != 0)
      ORDER BY logs.executed_at DESC, logs.id DESC
      LIMIT 5
      `,
    )
    .all(windowStart) as Log[];

  const runs = summary?.total ?? 0;
  const successes = summary?.success ?? 0;

  return json({
    generatedAt: now,
    windowStart,
    windowHours: 24,
    counts: {
      ...counts,
      running: Math.max(counts.running, runningTaskIds.length),
    },
    runningTaskIds,
    runs: {
      total: runs,
      success: successes,
      failure: summary?.failure ?? 0,
      successRate: runs > 0 ? (successes / runs) * 100 : null,
      averageDurationMs: summary?.average_duration ?? null,
    },
    hourly: buckets,
    nextRun: upcoming[0] ?? null,
    upcoming,
    recent,
    failures,
    daemon: {
      version: pkg.version,
      port: config.port,
      uptimeMs: Math.floor(process.uptime() * 1000),
      startedAt: Date.now() - Math.floor(process.uptime() * 1000),
      pid: process.pid,
      dataDir: "~/.cronify",
      defaultTimeoutMs: config.defaultTimeoutMs,
      logRetentionDays: config.logRetentionDays,
    },
  });
}
