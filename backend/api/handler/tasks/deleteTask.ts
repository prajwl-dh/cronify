import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";
import { error, json, notFound, taskIdFromPath } from "../../lib/http";

/**
 * Handles DELETE /api/tasks/:id
 * Deletes a task and, through the cascade, its execution logs.
 */
export async function deleteTask(url: URL, db: Database) {
  const id = taskIdFromPath(url.pathname);

  if (!id) return error("Invalid task id");

  const result = db.query("DELETE FROM tasks WHERE id = ?").run(id);

  if (result.changes === 0) {
    return notFound(`Task with id ${id} does not exist`);
  }

  logger.info(`Task ${id} deleted.`);

  return json({ success: true, deletedId: id });
}
