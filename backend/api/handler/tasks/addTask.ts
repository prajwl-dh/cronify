import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";
import { parseSchedule, describeSchedule } from "../../../utils/schedule";
import { error, json, readJson } from "../../lib/http";
import type { Task } from "../../../types/taskType";

type AddTaskBody = {
  name?: string;
  command?: string;
  schedule?: string;
  timeoutMs?: number | null;
  maxRetries?: number;
};

/**
 * Handles POST /api/tasks
 * Creates a new scheduled task by validating the request body,
 * parsing the schedule format, and storing the task in the database.
 */
export async function addTask(req: Request, db: Database) {
  try {
    const body = await readJson<AddTaskBody>(req);
    const name = body.name?.trim();
    const command = body.command?.trim();
    const schedule = body.schedule?.trim();

    logger.info(`POST /api/tasks called for "${name ?? ""}".`);

    if (!name || !command || !schedule) {
      return error("Missing name, command or schedule");
    }

    if (name.length > 200) {
      return error("Task name must be 200 characters or fewer");
    }

    const parsed = parseSchedule(schedule);

    if (!parsed.ok) {
      logger.error(`POST /api/tasks invalid schedule: ${schedule}`);
      return error(parsed.error);
    }

    const timeoutMs =
      body.timeoutMs === undefined || body.timeoutMs === null
        ? null
        : Math.max(0, Math.floor(Number(body.timeoutMs)));

    if (timeoutMs !== null && !Number.isFinite(timeoutMs)) {
      return error("Timeout must be zero or a positive number of milliseconds");
    }

    const maxRetries = Math.max(0, Math.floor(Number(body.maxRetries ?? 0)));

    if (!Number.isFinite(maxRetries) || maxRetries > 10) {
      return error("Retries must be between 0 and 10");
    }

    const result = db
      .query(
        `
        INSERT INTO tasks (name, command, cron_string, next_run, status, timeout_ms, max_retries)
        VALUES (?, ?, ?, ?, 'inactive', ?, ?)
        `,
      )
      .run(name, command, schedule, parsed.nextRun, timeoutMs, maxRetries);

    const id = Number(result.lastInsertRowid);
    const task = db.query("SELECT * FROM tasks WHERE id = ?").get(id) as Task;
    const payload = {
      ...task,
      schedule_description: describeSchedule(task.cron_string),
    };

    logger.info(`POST /api/tasks created task ${id}.`);

    return json({ success: true, id, task: payload }, 201);
  } catch (err) {
    logger.error("POST /api/tasks error: " + err);
    return error("Internal Server Error", 500);
  }
}
