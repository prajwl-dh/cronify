import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";

/**
 * Handles DELETE /api/logs or DELETE /api/logs/:task_id
 * Clears execution logs for a specific task or all tasks.
 */
export async function clearLogs(url: URL, db: Database) {
  try {
    const pathParts = url.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const taskId = Number(lastPart);

    if (!isNaN(taskId) && taskId > 0) {
      db.query("DELETE FROM logs WHERE task_id = ?").run(taskId);
      logger.info(`Cleared logs for task_id ${taskId}`);
      return new Response(
        JSON.stringify({
          success: true,
          message: `Logs for task ${taskId} cleared`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } else {
      db.query("DELETE FROM logs").run();
      logger.info("Cleared all system execution logs");
      return new Response(
        JSON.stringify({ success: true, message: "All logs cleared" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
  } catch (error) {
    logger.error(`DELETE /api/logs error: ${error}`);
    return new Response("Internal Server Error", { status: 500 });
  }
}
