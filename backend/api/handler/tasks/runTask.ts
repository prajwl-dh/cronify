import { Database } from "bun:sqlite";
import { executeTask, isTaskRunning } from "../../../engine/runner";
import type { LogTrigger } from "../../../types/logType";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";
import {
  error,
  json,
  notFound,
  readJson,
  taskIdFromPath,
} from "../../lib/http";

type RunBody = { id?: number };

/**
 * Handles POST /api/tasks/:id/run (or POST /api/tasks/run)
 * Triggers immediate execution of a task.
 */
export async function runTask(
  req: Request,
  url: URL,
  db: Database,
  trigger: LogTrigger = "manual",
) {
  try {
    const body = await readJson<RunBody>(req);
    const taskId = body.id || taskIdFromPath(url.pathname);

    if (!taskId) return error("Missing task ID");

    const task = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task | null;

    if (!task) return notFound("Task not found");

    if (isTaskRunning(task.id)) {
      return json({
        success: false,
        running: true,
        message: `Task ${task.id} is already running`,
      });
    }

    logger.info(`Manually triggering task ${task.id} (${task.name})...`);
    void executeTask(db, task, trigger);

    return json({
      success: true,
      running: true,
      message: `Task ${taskId} (${task.name}) triggered for immediate execution`,
    });
  } catch (err) {
    logger.error(`POST /api/tasks/run error: ${err}`);
    return error("Internal Server Error", 500);
  }
}
