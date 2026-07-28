import { Database } from "bun:sqlite";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";

/**
 * Handles POST /api/tasks/:id/toggle (or POST /api/tasks/toggle)
 * Toggles status between 'inactive' (active/scheduled) and 'paused'.
 */
export async function toggleTask(req: Request, url: URL, db: Database) {
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

    const nextStatus = task.status === "paused" ? "inactive" : "paused";

    db.query("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?").run(
      nextStatus,
      Date.now(),
      taskId,
    );

    logger.info(`Task ${taskId} status toggled to ${nextStatus}`);

    return new Response(
      JSON.stringify({
        success: true,
        status: nextStatus,
        message: `Task status changed to ${nextStatus}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logger.error(`POST /api/tasks/toggle error: ${error}`);
    return new Response("Internal Server Error", { status: 500 });
  }
}
