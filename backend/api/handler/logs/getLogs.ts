import { Database } from "bun:sqlite";
import type { Log } from "../../../types/logType";
import { logger } from "../../../utils/logger";

/**
 * Handles GET /api/logs
 * Retrieves logs with support for pagination, date range filtering,
 * status (success/error) filtering, task filtering, and keyword search.
 */
export async function getLogs(url: URL, db: Database) {
  logger.info(`GET /api/logs endpoint called with params: ${url.search}`);

  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const taskIdParam = url.searchParams.get("task_id");
  const statusFilter = url.searchParams.get("status"); // 'all' | 'success' | 'error'
  const timeRange = url.searchParams.get("timeRange"); // 'all' | '1h' | '24h' | '7d' | '30d'
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const searchQuery = url.searchParams.get("search");

  const isPaginated = pageParam !== null || limitParam !== null;

  const conditions: string[] = [];
  const params: any[] = [];

  // Task filter
  if (taskIdParam && !isNaN(Number(taskIdParam))) {
    conditions.push("logs.task_id = ?");
    params.push(Number(taskIdParam));
  }

  // Status/Error filter
  if (statusFilter === "success") {
    conditions.push("logs.exit_code = 0");
  } else if (statusFilter === "error") {
    conditions.push("(logs.exit_code IS NULL OR logs.exit_code != 0)");
  }

  // Time Range / Date filter
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

  // Search filter (stdout, stderr, task name, task command)
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

  if (isPaginated) {
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.max(1, parseInt(limitParam || "20", 10) || 20);
    const offset = (page - 1) * limit;

    const countResult = db
      .query(`SELECT COUNT(*) as total ${baseJoin} ${whereClause}`)
      .get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    const logs = db
      .query(
        `SELECT logs.*, tasks.name as task_name, tasks.command as task_command ${baseJoin} ${whereClause} ORDER BY logs.executed_at DESC, logs.id DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Log[];

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    return new Response(
      JSON.stringify({
        logs,
        total,
        page,
        totalPages,
        hasMore,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Non-paginated fallback
  const logs = db
    .query(
      `SELECT logs.*, tasks.name as task_name, tasks.command as task_command ${baseJoin} ${whereClause} ORDER BY logs.executed_at DESC, logs.id DESC`,
    )
    .all(...params) as Log[];

  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" },
  });
}
