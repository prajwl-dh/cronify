import { Database } from "bun:sqlite";
import type { Log } from "../../../types/logType";
import { logger } from "../../../utils/logger";
import { json } from "../../lib/http";

const PREVIEW_LENGTH = 400;

function compactLog(
  log: Log,
  compact: boolean,
): Log & { has_output?: boolean } {
  const hasOutput = Boolean(log.stdout || log.stderr);

  if (!compact) return { ...log, has_output: hasOutput };

  return {
    ...log,
    stdout: log.stdout ? log.stdout.slice(0, PREVIEW_LENGTH) : log.stdout,
    stderr: log.stderr ? log.stderr.slice(0, PREVIEW_LENGTH) : log.stderr,
    has_output: hasOutput,
  };
}

/**
 * Handles GET /api/logs
 * Retrieves logs with pagination, date range filtering, status
 * filtering, task filtering, keyword search and a filtered summary.
 */
export async function getLogs(url: URL, db: Database) {
  logger.info(`GET /api/logs called with params: ${url.search}`);

  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const taskIdParam = url.searchParams.get("task_id");
  const statusFilter = url.searchParams.get("status");
  const timeRange = url.searchParams.get("timeRange");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const searchQuery = url.searchParams.get("search");
  const compact = url.searchParams.get("compact") === "1";

  const isPaginated = pageParam !== null || limitParam !== null;

  const conditions: string[] = [];
  const params: any[] = [];

  if (taskIdParam && !isNaN(Number(taskIdParam))) {
    conditions.push("logs.task_id = ?");
    params.push(Number(taskIdParam));
  }

  if (statusFilter === "success") {
    conditions.push("logs.exit_code = 0");
  } else if (statusFilter === "error") {
    conditions.push("(logs.exit_code IS NULL OR logs.exit_code != 0)");
  }

  const now = Date.now();

  if (timeRange === "1h") {
    conditions.push("logs.executed_at >= ?");
    params.push(now - 60 * 60 * 1000);
  } else if (timeRange === "24h") {
    conditions.push("logs.executed_at >= ?");
    params.push(now - 24 * 60 * 60 * 1000);
  } else if (timeRange === "7d") {
    conditions.push("logs.executed_at >= ?");
    params.push(now - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "30d") {
    conditions.push("logs.executed_at >= ?");
    params.push(now - 30 * 24 * 60 * 60 * 1000);
  }

  if (startDate) {
    const startMs = Date.parse(startDate);
    if (!isNaN(startMs)) {
      conditions.push("logs.executed_at >= ?");
      params.push(startMs);
    }
  }

  if (endDate) {
    const endMs = Date.parse(endDate);
    if (!isNaN(endMs)) {
      conditions.push("logs.executed_at <= ?");
      params.push(endMs);
    }
  }

  if (searchQuery && searchQuery.trim() !== "") {
    conditions.push(
      "(LOWER(logs.stdout) LIKE ? OR LOWER(logs.stderr) LIKE ? OR LOWER(tasks.name) LIKE ? OR LOWER(tasks.command) LIKE ?)",
    );
    const term = `%${searchQuery.trim().toLowerCase()}%`;
    params.push(term, term, term, term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const baseJoin = "FROM logs LEFT JOIN tasks ON logs.task_id = tasks.id";

  const summaryRow = db
    .query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN logs.exit_code = 0 THEN 1 ELSE 0 END) as success,
        SUM(CASE WHEN logs.exit_code IS NULL OR logs.exit_code != 0 THEN 1 ELSE 0 END) as failure,
        AVG(logs.duration_ms) as average_duration
      ${baseJoin} ${whereClause}
      `,
    )
    .get(...params) as {
    total: number;
    success: number | null;
    failure: number | null;
    average_duration: number | null;
  };

  const summary = {
    total: summaryRow?.total ?? 0,
    success: summaryRow?.success ?? 0,
    failure: summaryRow?.failure ?? 0,
    averageDurationMs: summaryRow?.average_duration ?? null,
  };

  if (isPaginated) {
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(limitParam || "20", 10) || 20),
    );
    const offset = (page - 1) * limit;

    const logs = db
      .query(
        `SELECT logs.*, tasks.name as task_name, tasks.command as task_command ${baseJoin} ${whereClause} ORDER BY logs.executed_at DESC, logs.id DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Log[];

    const totalPages = Math.ceil(summary.total / limit) || 1;

    return json({
      logs: logs.map((log) => compactLog(log, compact)),
      summary,
      total: summary.total,
      page,
      totalPages,
      hasMore: page < totalPages,
    });
  }

  const logs = db
    .query(
      `SELECT logs.*, tasks.name as task_name, tasks.command as task_command ${baseJoin} ${whereClause} ORDER BY logs.executed_at DESC, logs.id DESC`,
    )
    .all(...params) as Log[];

  return json(logs.map((log) => compactLog(log, compact)));
}
