import { Database } from "bun:sqlite";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";
import { parseSchedule } from "../../../utils/schedule";
import {
  error,
  json,
  notFound,
  readJson,
  taskIdFromPath,
} from "../../lib/http";

type ToggleBody = { id?: number };

/**
 * Handles POST /api/tasks/:id/toggle
 * Flips a task between paused and scheduled. Resuming recomputes the
 * next run when the stored one is already in the past.
 */
export async function toggleTask(req: Request, url: URL, db: Database) {
  try {
    const body = await readJson<ToggleBody>(req);
    const taskId = body.id || taskIdFromPath(url.pathname);

    if (!taskId) return error("Missing task ID");

    const task = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task | null;

    if (!task) return notFound("Task not found");

    if (task.status === "obsolete") {
      return error(
        "Completed tasks cannot be paused. Edit the schedule to reactivate.",
      );
    }

    const nextStatus = task.status === "paused" ? "inactive" : "paused";
    let nextRun = task.next_run;

    if (nextStatus === "inactive" && nextRun <= Date.now()) {
      const parsed = parseSchedule(task.cron_string);
      if (parsed.ok) nextRun = parsed.nextRun;
    }

    db.query(
      "UPDATE tasks SET status = ?, next_run = ?, updated_at = ? WHERE id = ?",
    ).run(nextStatus, nextRun, Date.now(), taskId);

    logger.info(`Task ${taskId} status toggled to ${nextStatus}`);

    return json({
      success: true,
      status: nextStatus,
      message: nextStatus === "paused" ? "Task paused" : "Task resumed",
    });
  } catch (err) {
    logger.error(`POST /api/tasks/toggle error: ${err}`);
    return error("Internal Server Error", 500);
  }
}
