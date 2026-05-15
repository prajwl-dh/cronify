import { Database } from 'bun:sqlite';
import { CronExpressionParser } from 'cron-parser';
import type { Task } from '../types/taskType';
import { logger } from '../utils/logger';
import { executeTask } from './runner';

/**
 * Starts the Cronify scheduler loop.
 *
 * Continuously checks for due tasks,
 * updates their status, and triggers execution.
 */
export function startScheduler(db: Database) {
  logger.info('🕒 Cronify Scheduler started ...');

  setInterval(() => {
    const now = Date.now();

    // Fetch tasks that are ready to run
    const getDueTasks = db.query(`
        SELECT * FROM tasks
        WHERE status = 'inactive' AND next_run <= ?
        `);

    const dueTasks = getDueTasks.all(now) as Task[];

    if (dueTasks.length === 0) return;

    // Process all due tasks inside a single transaction
    const processDueTasks = db.transaction((tasks: Task[]) => {
      for (const task of tasks) {
        try {
          let isCron = false;
          let nextRunMs = 0;

          // Validate and parse the cron expression
          if (task.cron_string !== '@once') {
            try {
              const interval = CronExpressionParser.parse(task.cron_string);

              nextRunMs = interval.next().getTime();
              isCron = true;
            } catch (cronError) {
              isCron = false;
            }
          }

          // Update task state based on execution type
          if (!isCron) {
            // One-time task
            db.query(
              `
              UPDATE tasks 
              SET status = 'obsolete', updated_at = ? 
              WHERE id = ?
            `,
            ).run(Date.now(), task.id);
          } else {
            // Repeating cron task
            db.query(
              `
              UPDATE tasks
              SET status = 'active', next_run = ?, updated_at = ?
              WHERE id = ?
            `,
            ).run(nextRunMs, Date.now(), task.id);
          }

          // Execute the task asynchronously
          executeTask(db, task);
        } catch (error) {
          logger.error(
            `[Scheduler Error] Task ${task.id} failed to process. Error message : ${error}`,
          );
        }
      }
    });

    processDueTasks(dueTasks);
  }, 5000);
}
