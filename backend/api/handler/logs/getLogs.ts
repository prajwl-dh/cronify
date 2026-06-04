import { Database } from "bun:sqlite";
import { logger } from "../../../utils/logger";

/**
 * Handles GET /api/logs
 * Retrieves all log entries from the database
 * and returns them as a JSON response.
 */
export async function getLogs(db: Database) {
  logger.info("GET /api/logs endpoint called\n");

  // Fetch all logs from the database
  const logs = db.query("SELECT * FROM logs").all();

  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" },
  });
}
