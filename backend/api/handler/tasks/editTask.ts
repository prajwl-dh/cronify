import { Database } from "bun:sqlite";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";
import { parseSchedule, describeSchedule } from "../../../utils/schedule";
import { error, json, readJson, taskIdFromPath } from "../../lib/http";

type EditTaskBody = {
  id?: number;
  name?: string;
  command?: string;
  schedule?: string;
  status?: Task["status"];
  timeoutMs?: number | null;
  maxRetries?: number;
};

/**
 * Handles POST /api/tasks/edit (or POST /api/tasks/:id/edit)
 * Updates task details, schedule, execution limits and status.
 */
export async function editTask(req: Request, url: URL, db: Database) {
  try {
    const body = await readJson<EditTaskBody>(req);
    const taskId = body.id || taskIdFromPath(url.pathname);

    if (!taskId) return error("Missing task ID");

    const existingTask = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task | null;

    if (!existingTask) return error("Task not found", 404);

    const newName =
      body.name !== undefined ? body.name.trim() : existingTask.name;
    const newCommand =
      body.command !== undefined ? body.command.trim() : existingTask.command;
    const newSchedule =
      body.schedule !== undefined
        ? body.schedule.trim()
        : existingTask.cron_string;

    if (!newName || !newCommand || !newSchedule) {
      return error("Name, command and schedule cannot be empty");
    }

    if (newName.length > 200) {
      return error("Task name must be 200 characters or fewer");
    }

    let newStatus: Task["status"] =
      body.status !== undefined ? body.status : existingTask.status;
    let nextRunMs = existingTask.next_run;

    // Recalculate when the schedule changed, or when a completed task
    // is being reactivated by an edit.
    if (body.schedule !== undefined || existingTask.status === "obsolete") {
      const parsed = parseSchedule(newSchedule);

      if (!parsed.ok) return error(parsed.error);

      nextRunMs = parsed.nextRun;

      if (existingTask.status === "obsolete" && body.status === undefined) {
        newStatus = "inactive";
      }
    }

    const timeoutMs =
      body.timeoutMs === undefined
        ? existingTask.timeout_ms
        : body.timeoutMs === null
          ? null
          : Math.max(0, Math.floor(Number(body.timeoutMs)));

    if (timeoutMs !== null && !Number.isFinite(timeoutMs as number)) {
      return error("Timeout must be zero or a positive number of milliseconds");
    }

    const maxRetries =
      body.maxRetries === undefined
        ? existingTask.max_retries
        : Math.max(0, Math.floor(Number(body.maxRetries)));

    if (!Number.isFinite(maxRetries) || maxRetries > 10) {
      return error("Retries must be between 0 and 10");
    }

    db.query(
      `
      UPDATE tasks
      SET name = ?, command = ?, cron_string = ?, next_run = ?, status = ?,
          timeout_ms = ?, max_retries = ?, updated_at = ?
      WHERE id = ?
      `,
    ).run(
      newName,
      newCommand,
      newSchedule,
      nextRunMs,
      newStatus,
      timeoutMs,
      maxRetries,
      Date.now(),
      taskId,
    );

    const updatedTask = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task;

    logger.info(`Task ${taskId} updated successfully.`);

    return json({
      success: true,
      task: {
        ...updatedTask,
        schedule_description: describeSchedule(updatedTask.cron_string),
      },
    });
  } catch (err) {
    logger.error(`POST /api/tasks/edit error: ${err}`);
    return error("Internal Server Error", 500);
  }
}
