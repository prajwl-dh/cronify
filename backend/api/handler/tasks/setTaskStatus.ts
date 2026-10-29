import { Database } from "bun:sqlite";
import type { Task } from "../../../types/taskType";
import { parseSchedule } from "../../../utils/schedule";
import { error, json, notFound, taskIdFromPath } from "../../lib/http";

/**
 * Sets a task to paused or scheduled without toggling. Used by the CLI
 * (`cronify pause` / `cronify resume`) and bulk actions, where the
 * caller knows the desired state.
 */
export async function setTaskStatus(
  url: URL,
  db: Database,
  desired: "paused" | "inactive",
) {
  const taskId = taskIdFromPath(url.pathname);

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

  let nextRun = task.next_run;

  if (desired === "inactive" && nextRun <= Date.now()) {
    const parsed = parseSchedule(task.cron_string);
    if (parsed.ok) nextRun = parsed.nextRun;
  }

  db.query(
    "UPDATE tasks SET status = ?, next_run = ?, updated_at = ? WHERE id = ?",
  ).run(desired, nextRun, Date.now(), taskId);

  return json({
    success: true,
    status: desired,
    message: desired === "paused" ? "Task paused" : "Task resumed",
  });
}
