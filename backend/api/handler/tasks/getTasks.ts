import { Database } from 'bun:sqlite';
import { logger } from '../../../utils/logger';

/**
 * Handles GET /api/tasks
 * Retrieves all scheduled tasks from the database
 * and returns them as a JSON response.
 */
export async function getTasks(db: Database) {
  logger.info('GET /api/tasks endpoint called\n');

  // Fetch all tasks from the database
  const tasks = db.query('SELECT * FROM tasks').all();

  return new Response(JSON.stringify(tasks), {
    headers: { 'Content-Type': 'application/json' },
  });
}
