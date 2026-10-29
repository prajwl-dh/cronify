import { Database } from "bun:sqlite";
import { executeTask, isTaskRunning } from "../../../engine/runner";
import type { Task } from "../../../types/taskType";
import { logger } from "../../../utils/logger";
import { parseSchedule } from "../../../utils/schedule";
import { error, json, readJson } from "../../lib/http";

type BulkBody = {
  action?: "run" | "pause" | "resume" | "delete";
  ids?: number[];
};

/**
 * Handles POST /api/tasks/bulk
 * Applies run, pause, resume or delete to a set of task ids.
 */
export async function bulkTasks(req: Request, db: Database) {
  try {
    const body = await readJson<BulkBody>(req);
    const action = body.action;
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (!action) return error("Missing bulk action");
    if (ids.length === 0) return error("Select at least one task");
    if (ids.length > 200) return error("Too many tasks selected");

    if (action === "delete") {
      const placeholders = ids.map(() => "?").join(",");
      const result = db
        .query(`DELETE FROM tasks WHERE id IN (${placeholders})`)
        .run(...ids);

      logger.info(`Bulk deleted ${result.changes} task(s).`);

      return json({ success: true, action, affected: result.changes });
    }

    const placeholders = ids.map(() => "?").join(",");
    const tasks = db
      .query(`SELECT * FROM tasks WHERE id IN (${placeholders})`)
      .all(...ids) as Task[];

    if (action === "run") {
      let started = 0;
      let skipped = 0;

      for (const task of tasks) {
        if (isTaskRunning(task.id)) {
          skipped += 1;
          continue;
        }
        void executeTask(db, task, "bulk");
        started += 1;
      }

      return json({ success: true, action, affected: started, skipped });
    }

    const desired = action === "pause" ? "paused" : "inactive";
    let affected = 0;

    db.transaction(() => {
      for (const task of tasks) {
        if (task.status === "obsolete") continue;

        let nextRun = task.next_run;

        if (desired === "inactive" && nextRun <= Date.now()) {
          const parsed = parseSchedule(task.cron_string);
          if (parsed.ok) nextRun = parsed.nextRun;
        }

        db.query(
          "UPDATE tasks SET status = ?, next_run = ?, updated_at = ? WHERE id = ?",
        ).run(desired, nextRun, Date.now(), task.id);
        affected += 1;
      }
    })();

    logger.info(`Bulk ${action} applied to ${affected} task(s).`);

    return json({ success: true, action, affected });
  } catch (err) {
    logger.error(`POST /api/tasks/bulk error: ${err}`);
    return error("Internal Server Error", 500);
  }
}
