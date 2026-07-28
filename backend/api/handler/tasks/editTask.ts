import { Database } from "bun:sqlite";
import { CronExpressionParser } from "cron-parser";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";

/**
 * Handles POST /api/tasks/edit (or POST /api/tasks/:id/edit)
 * Allows updating task details (name, command, schedule, status)
 * and handles converting task types (e.g., @once to cron, date to cron, vice versa).
 */
export async function editTask(req: Request, url: URL, db: Database) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Determine ID from URL parameter or request body
    const pathParts = url.pathname.split("/").filter(Boolean);
    let idFromUrl: number | null = null;
    for (const part of pathParts) {
      const num = Number(part);
      if (!isNaN(num) && num > 0) {
        idFromUrl = num;
        break;
      }
    }

    const taskId = body.id || idFromUrl;

    if (!taskId) {
      return new Response("Missing task ID", { status: 400 });
    }

    // Fetch existing task
    const existingTask = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task | null;

    if (!existingTask) {
      return new Response("Task not found", { status: 404 });
    }

    const newName =
      body.name !== undefined ? body.name.trim() : existingTask.name;
    const newCommand =
      body.command !== undefined ? body.command.trim() : existingTask.command;
    const newSchedule =
      body.schedule !== undefined
        ? body.schedule.trim()
        : existingTask.cron_string;

    let newStatus =
      body.status !== undefined ? body.status : existingTask.status;

    let nextRunMs = existingTask.next_run;

    // Recalculate schedule if modified or if task was obsolete and re-activated
    if (body.schedule !== undefined || existingTask.status === "obsolete") {
      if (newSchedule === "@once") {
        nextRunMs = Date.now();
      } else {
        try {
          const interval = CronExpressionParser.parse(newSchedule);
          nextRunMs = interval.next().getTime();
        } catch {
          const parsedDate = Date.parse(newSchedule);
          if (!isNaN(parsedDate)) {
            nextRunMs = parsedDate;
          } else {
            return new Response("Invalid cron string or date format", {
              status: 400,
            });
          }
        }
      }

      // If task was obsolete (completed one-time task) and schedule/details were edited, reset to inactive
      if (existingTask.status === "obsolete" && body.status === undefined) {
        newStatus = "inactive";
      }
    }

    const updatedAt = Date.now();

    db.query(
      `
      UPDATE tasks
      SET name = ?, command = ?, cron_string = ?, next_run = ?, status = ?, updated_at = ?
      WHERE id = ?
      `,
    ).run(
      newName,
      newCommand,
      newSchedule,
      nextRunMs,
      newStatus,
      updatedAt,
      taskId,
    );

    const updatedTask = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task;

    logger.info(`Task ${taskId} updated successfully.`);

    return new Response(JSON.stringify({ success: true, task: updatedTask }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`POST /api/tasks/edit error: ${error}`);
    return new Response("Internal Server Error", { status: 500 });
  }
}
