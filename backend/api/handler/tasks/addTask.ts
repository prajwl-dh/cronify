import { Database } from 'bun:sqlite';
import { CronExpressionParser } from 'cron-parser';
import { logger } from '../../../utils/logger';

/**
 * Handles POST /api/tasks
 * Creates a new scheduled task by validating the request body,
 * parsing the schedule format, and storing the task in the database.
 */
export async function addTask(req: Request, db: Database) {
  try {
    const body = (await req.json()) as {
      name: string;
      command: string;
      schedule: string;
    };
    const { name, command, schedule } = body;

    logger.info(
      `POST /api/tasks endpoint called. Request body: ${JSON.stringify(body)}`,
    );

    // Validate required fields
    if (!command || !schedule || !name) {
      logger.error(
        `POST /api/tasks endpoint. Missing name, command or schedule.\n`,
      );
      return new Response('Missing name, command or schedule', {
        status: 400,
      });
    }

    let nextRunMs: number;
    let isCron = false;

    // Handle one-time immediate execution
    if (schedule === '@once') {
      nextRunMs = Date.now();
    } else {
      try {
        // Try parsing the schedule as a cron expression
        logger.info('Schedule : ' + schedule);

        const interval = CronExpressionParser.parse(schedule);
        nextRunMs = interval.next().getTime();
        isCron = true;
      } catch (err) {
        // Fallback: check if the schedule is a valid date string
        const parsedDate = Date.parse(schedule);

        if (!isNaN(parsedDate)) {
          nextRunMs = parsedDate;
        } else {
          logger.error(
            `POST /api/tasks endpoint. Invalid cron string or date format : ${schedule}\n`,
          );

          return new Response('Invalid cron string or date format', {
            status: 400,
          });
        }
      }
    }

    // Insert the new task into the database
    db.query(
      `
              INSERT INTO tasks (name, command, cron_string, next_run, status)
              VALUES (?, ?, ?, ?, 'inactive')
            `,
    ).run(name, command, schedule, nextRunMs);

    // Retrieve the ID of the newly created task
    const row = db.query('SELECT last_insert_rowid() as id').get() as {
      id: number;
    };

    logger.info(
      `POST /api/tasks endpoint. Inserted into tasks table - id: ${row.id} , body: ${JSON.stringify(body)}\n`,
    );

    return new Response(JSON.stringify({ success: true, id: row.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('POST /api/tasks endpoint. Error: ' + error + '\n');

    return new Response('Internal Server Error', { status: 500 });
  }
}
