import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";
import { json, taskIdFromPath } from "../../lib/http";

/**
 * Handles DELETE /api/logs or DELETE /api/logs/:task_id
 * Clears execution logs for a specific task or all tasks.
 */
export async function clearLogs(url: URL, db: Database) {
  try {
    const taskId = taskIdFromPath(url.pathname);

    if (taskId) {
      const result = db.query("DELETE FROM logs WHERE task_id = ?").run(taskId);
      logger.info(`Cleared ${result.changes} log(s) for task_id ${taskId}`);
      return json({
        success: true,
        deleted: result.changes,
        message: `Logs for task ${taskId} cleared`,
      });
    }

    const result = db.query("DELETE FROM logs").run();
    logger.info(`Cleared all ${result.changes} execution logs`);

    return json({
      success: true,
      deleted: result.changes,
      message: "All logs cleared",
    });
  } catch (err) {
    logger.error(`DELETE /api/logs error: ${err}`);
    return json({ error: "Internal Server Error" }, 500);
  }
}
