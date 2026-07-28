import { Database } from "bun:sqlite";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";

/**
 * Handles GET /api/tasks
 * Supports pagination, status filtering, and keyword search.
 */
export async function getTasks(url: URL, db: Database) {
  logger.info(
    `GET /api/tasks endpoint called with searchParams: ${url.search}`,
  );

  const pageParam = url.searchParams.get("page");
  const limitParam = url.searchParams.get("limit");
  const statusFilter = url.searchParams.get("status");
  const searchQuery = url.searchParams.get("search");

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

  if (isPaginated) {
    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.max(1, parseInt(limitParam || "15", 10) || 15);
    const offset = (page - 1) * limit;

    const countResult = db
      .query(`SELECT COUNT(*) as total FROM tasks ${whereClause}`)
      .get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    const tasks = db
      .query(
        `SELECT * FROM tasks ${whereClause} ORDER BY CASE status WHEN 'inactive' THEN 0 WHEN 'active' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END, id DESC LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Task[];

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    return new Response(
      JSON.stringify({
        tasks,
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

  // Non-paginated fallback for legacy/CLI calls
  const tasks = db
    .query(
      `SELECT * FROM tasks ${whereClause} ORDER BY CASE status WHEN 'inactive' THEN 0 WHEN 'active' THEN 1 WHEN 'paused' THEN 2 ELSE 3 END, id DESC`,
    )
    .all(...params) as Task[];

  return new Response(JSON.stringify(tasks), {
    headers: { "Content-Type": "application/json" },
  });
}
