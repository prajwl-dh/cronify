import { Database } from "bun:sqlite";
import { getRunningTaskIds } from "../../../engine/runner";
import type { Task, TaskWithRuntime } from "../../../types/taskType";
import { logger } from "../../../utils/logger";
import { describeSchedule } from "../../../utils/schedule";
import { json } from "../../lib/http";

function withRuntime(tasks: Task[]): TaskWithRuntime[] {
  const running = new Set(getRunningTaskIds());
  return tasks.map((task) => ({
    ...task,
    is_running: running.has(task.id),
    schedule_description: describeSchedule(task.cron_string),
  }));
}

/**
 * Handles GET /api/tasks
 * Supports pagination, status filtering, keyword search and sorting.
 */
export async function getTasks(url: URL, db: Database) {
  logger.info(`GET /api/tasks called with searchParams: ${url.search}`);

  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const statusFilter = url.searchParams.get("status");
  const searchQuery = url.searchParams.get("search");
  const sortParam = url.searchParams.get("sort") || "next_run";

  const isPaginated = pageParam !== null || limitParam !== null;

  const conditions: string[] = [];
  const params: any[] = [];

  if (statusFilter && statusFilter !== "all") {
    conditions.push("status = ?");
    params.push(statusFilter);
  }

  if (searchQuery && searchQuery.trim() !== "") {
    conditions.push("(LOWER(name) LIKE ? OR LOWER(command) LIKE ?)");
    const term = `%${searchQuery.trim().toLowerCase()}%`;
    params.push(term, term);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderBy =
    sortParam === "name"
      ? "name COLLATE NOCASE ASC"
      : sortParam === "last_run"
        ? "last_run_at DESC NULLS LAST"
        : sortParam === "runs"
          ? "run_count DESC"
          : "CASE status WHEN 'inactive' THEN 0 WHEN 'active' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END, next_run ASC, id DESC";

  if (isPaginated) {
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(limitParam || "15", 10) || 15),
    );
    const offset = (page - 1) * limit;

    const countResult = db
      .query(`SELECT COUNT(*) as total FROM tasks ${whereClause}`)
      .get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    const tasks = db
      .query(
        `SELECT * FROM tasks ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Task[];

    const totalPages = Math.ceil(total / limit) || 1;

    return json({
      tasks: withRuntime(tasks),
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    });
  }

  const tasks = db
    .query(`SELECT * FROM tasks ${whereClause} ORDER BY ${orderBy}`)
    .all(...params) as Task[];

  return json(withRuntime(tasks));
}
