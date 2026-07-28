import { Database } from "bun:sqlite";
import { executeTask } from "../../../engine/runner";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";

/**
 * Handles POST /api/tasks/:id/run (or POST /api/tasks/run)
 * Triggers immediate execution of a task (whether one-time, completed/obsolete, or recurring schedule).
 */
export async function runTask(req: Request, url: URL, db: Database) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

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

    const task = db
      .query("SELECT * FROM tasks WHERE id = ?")
      .get(taskId) as Task | null;

    if (!task) {
      return new Response("Task not found", { status: 404 });
    }

    logger.info(`Manually triggering task ${task.id} (${task.name})...`);

    // Execute task asynchronously in background
    executeTask(db, task);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Task ${taskId} (${task.name}) triggered for immediate execution`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logger.error(`POST /api/tasks/run error: ${error}`);
    return new Response("Internal Server Error", { status: 500 });
  }
}
