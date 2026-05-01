import { Database } from 'bun:sqlite';
import { CronExpressionParser } from 'cron-parser';
import type { Task } from '../db/schema';
import { executeTask } from './runner';

export function startScheduler(db: Database) {
  console.log('🕒 Cronify Scheduler started...');

  setInterval(() => {
    const now = Date.now();

    // Fetch all active tasks where the next_run timestamp is in the past or exactly now
    const getDueTasks = db.query(`
        SELECT * FROM tasks
        WHERE status = 'inactive' AND next_run <= ?
        `);

    const dueTasks = getDueTasks.all(now) as Task[];

    if (dueTasks.length === 0) return;

    // Process tasks inside a transaction
    const processDueTasks = db.transaction((tasks: Task[]) => {
      for (const task of tasks) {
        try {
          let isCron = false;
          let nextRunMs = 0;

          // Ask the Cron library to validate the string first
          if (task.cron_string !== '@once') {
            try {
              // If this succeeds, it is a valid repeating cron string
              const interval = CronExpressionParser.parse(task.cron_string);
              nextRunMs = interval.next().getTime();
              isCron = true;
            } catch (cronError) {
              // It threw an error, so it MUST be a Date timestamp or an invalid string
              isCron = false;
            }
          }

          // Route the task based on the cron validation
          if (!isCron) {
            db.query(
              `
              UPDATE tasks 
              SET status = 'obsolete', updated_at = ? 
              WHERE id = ?
            `,
            ).run(Date.now(), task.id);

            console.log(`🏁 Task ${task.id} marked as obsolete.`);
          } else {
            db.query(
              `
              UPDATE tasks
              SET status = 'active', next_run = ?, updated_at = ?
              WHERE id = ?
            `,
            ).run(nextRunMs, Date.now(), task.id);
          }

          // 3. Fire off the execution engine
          executeTask(db, task);
        } catch (error) {
          console.error(
            `[Scheduler Error] Task ${task.id} failed to process.`,
            error,
          );
        }
      }
    });

    //Execute the transaction
    processDueTasks(dueTasks);
  }, 10000);
}
