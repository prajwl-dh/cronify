import { Database } from 'bun:sqlite';
import { logger } from '../../../utils/logger';

/**
 * Handles GET /api/logs/:task_id
 * Retrieves all logs associated with a specific task ID
 * and returns them as a JSON response.
 */
export async function getLog(url: URL, db: Database) {
  const param = url.pathname.split('/').pop();
  const task_id = Number(param);

  logger.info('GET /api/logs/:task_id endpoint called\n');

  // Fetch all logs linked to the provided task ID
  const logs = db
    .query(
      `SELECT * FROM logs WHERE task_id = ? ORDER BY executed_at DESC LIMIT 200`,
    )
    .all(task_id);

  return new Response(JSON.stringify(logs), {
    headers: { 'Content-Type': 'application/json' },
  });
}
