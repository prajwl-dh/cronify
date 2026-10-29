import { Database } from "bun:sqlite";
import type { Log } from "../../../types/logType";
import { json, notFound, taskIdFromPath } from "../../lib/http";

/**
 * Handles GET /api/logs/detail/:id
 * Returns the full stdout and stderr for one execution.
 */
export async function getLogDetail(url: URL, db: Database) {
  const id = taskIdFromPath(url.pathname);

  if (!id) return notFound("Log not found");

  const log = db
    .query(
      `
      SELECT logs.*, tasks.name as task_name, tasks.command as task_command
      FROM logs LEFT JOIN tasks ON logs.task_id = tasks.id
      WHERE logs.id = ?
      `,
    )
    .get(id) as Log | null;

  if (!log) return notFound("Log not found");

  return json(log);
}
