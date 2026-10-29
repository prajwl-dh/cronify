import { Database } from "bun:sqlite";
import { initConfig } from "../config/config";
import { purgeOldLogs } from "../db/schema";
import type { Task } from "../types/taskType";
import { logger } from "../utils/logger";
import { parseSchedule } from "../utils/schedule";
import { executeTask } from "./runner";

const TICK_MS = 1000;
const RETENTION_CHECK_MS = 60 * 60 * 1000;

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let retentionTimer: ReturnType<typeof setInterval> | null = null;

/**
 * A crash can leave a task in the internal "active" state. Reset it
 * on startup so the scheduler can pick it up again.
 */
function resetStuckTasks(db: Database) {
  const result = db
    .query("UPDATE tasks SET status = 'inactive' WHERE status = 'active'")
    .run();

  if (result.changes > 0) {
    logger.warn(
      `Recovered ${result.changes} task(s) stuck in the running state.`,
    );
  }
}

function runRetention(db: Database) {
  const config = initConfig();
  const deleted = purgeOldLogs(db, config.logRetentionDays);

  if (deleted > 0) {
    logger.info(
      `🧹 Removed ${deleted} log(s) older than ${config.logRetentionDays} days.`,
    );
  }
}

/**
 * Starts the Cronify scheduler loop.
 *
 * Every second it claims due tasks, advances their next run, and
 * triggers execution. A single-flight guard in the runner prevents
 * overlapping executions of the same task.
 */
export function startScheduler(db: Database) {
  if (schedulerTimer) return;

  logger.info("🕒 Cronify Scheduler started ...");

  resetStuckTasks(db);
  runRetention(db);

  let scanning = false;

  schedulerTimer = setInterval(() => {
    if (scanning) return;
    scanning = true;

    try {
      const now = Date.now();

      const dueTasks = db
        .query(
          `
          SELECT * FROM tasks
          WHERE status = 'inactive' AND next_run <= ?
          ORDER BY next_run ASC
          LIMIT 50
          `,
        )
        .all(now) as Task[];

      if (dueTasks.length === 0) return;

      for (const task of dueTasks) {
        try {
          const parsed = parseSchedule(task.cron_string, new Date(now));

          if (!parsed.ok || parsed.kind !== "cron") {
            // One-time task (or an unparseable legacy expression):
            // mark it complete and run it once.
            db.query(
              "UPDATE tasks SET status = 'obsolete', updated_at = ? WHERE id = ?",
            ).run(now, task.id);
          } else {
            db.query(
              "UPDATE tasks SET status = 'active', next_run = ?, updated_at = ? WHERE id = ?",
            ).run(parsed.nextRun, now, task.id);
          }

          void executeTask(db, task, "schedule");
        } catch (error) {
          logger.error(
            `[Scheduler Error] Task ${task.id} failed to process. Error message : ${error}`,
          );
        }
      }
    } catch (error) {
      logger.error(`[Scheduler Error] ${error}`);
    } finally {
      scanning = false;
    }
  }, TICK_MS);

  retentionTimer = setInterval(() => runRetention(db), RETENTION_CHECK_MS);
}

export function stopScheduler() {
  if (schedulerTimer) clearInterval(schedulerTimer);
  if (retentionTimer) clearInterval(retentionTimer);
  schedulerTimer = null;
  retentionTimer = null;
}
