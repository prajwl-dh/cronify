import { Database } from "bun:sqlite";
import { isTaskRunning } from "../../../engine/runner";
import type { Log } from "../../../types/logType";
import type { Task } from "../../../types/taskType";
import { describeSchedule } from "../../../utils/schedule";
import { json, notFound, taskIdFromPath } from "../../lib/http";

/**
 * Handles GET /api/tasks/:id
 * Returns a task with its recent executions.
 */
export async function getTask(url: URL, db: Database) {
  const id = taskIdFromPath(url.pathname);

  if (!id) return notFound("Task not found");

  const task = db
    .query("SELECT * FROM tasks WHERE id = ?")
    .get(id) as Task | null;

  if (!task) return notFound("Task not found");

  const recentLogs = db
    .query(
      `
      SELECT * FROM logs
      WHERE task_id = ?
      ORDER BY executed_at DESC, id DESC
      LIMIT 10
      `,
    )
    .all(id) as Log[];

  return json({
    task: {
      ...task,
      is_running: isTaskRunning(task.id),
      schedule_description: describeSchedule(task.cron_string),
    },
    logs: recentLogs,
  });
}
