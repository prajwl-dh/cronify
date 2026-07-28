import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";
import { getLogs } from "./getLogs";

/**
 * Handles GET /api/logs/:task_id
 * Retrieves logs for a specific task ID, supporting pagination and filtering.
 */
export async function getLog(url: URL, db: Database) {
  const pathParts = url.pathname.split("/").filter(Boolean);
  const taskId = pathParts[pathParts.length - 1];

  if (taskId && !isNaN(Number(taskId))) {
    url.searchParams.set("task_id", taskId);
  }

  logger.info(`GET /api/logs/${taskId} called`);

  return getLogs(url, db);
}
