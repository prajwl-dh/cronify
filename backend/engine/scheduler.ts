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
        WHERE status = 'active' AND next_run <= ?
        `);

    const dueTasks = getDueTasks.all(now) as Task[];

    if (dueTasks.length === 0) return;

    // Process tasks inside a transaction
    const processDueTasks = db.transaction((tasks: Task[]) => {
      for (const task of tasks) {
        try {
          const isOneTime =
            task.cron_string === '@once' ||
            !isNaN(Date.parse(task.cron_string));

          if (isOneTime) {
            db.query(
              `
              UPDATE tasks 
              SET status = 'completed', updated_at = ? 
              WHERE id = ?
            `,
            ).run(Date.now(), task.id);

            console.log(`🏁 Task ${task.id} marked as completed.`);
          } else {
            const updateTaskNextRun = db.query(`
              UPDATE tasks
              SET next_run = ?, updated_at = ?
              WHERE id = ?`);

            // Calculate the next execution time based on the cron string
            const interval = CronExpressionParser.parse(task.cron_string);
            const nextRunMs = interval.next().getTime();

            // Immediately update the DB so the task isn't accidentally fired twice
            updateTaskNextRun.run(nextRunMs, Date.now(), task.id);
          }

          // Fire off the execution engine
          executeTask(db, task);
        } catch (error) {
          console.error(
            `[Scheduler Error] Task ${task.id}: Invalid cron string.`,
            error,
          );
        }
      }
    });

    //Execute the transaction
    processDueTasks(dueTasks);
  }, 10000);
}
