import { Database } from "bun:sqlite";
import pkg from "../../../../package.json";
import { initConfig } from "../../../config/config";
import { getRunningTaskIds } from "../../../engine/runner";
import { json } from "../../lib/http";

/**
 * Handles GET /api/health
 * Reports daemon uptime, task counts and the database connection.
 */
export async function getHealth(db?: Database) {
  const config = initConfig();
  let database = "unavailable";

  try {
    if (db) {
      db.query("SELECT 1").get();
      database = "connected";
    }
  } catch {
    database = "error";
  }

  let taskCount = 0;

  try {
    if (db) {
      const row = db.query("SELECT COUNT(*) as count FROM tasks").get() as {
        count: number;
      };
      taskCount = row.count;
    }
  } catch {
    taskCount = 0;
  }

  return json({
    daemonStatus: "running",
    version: pkg.version,
    timestamp: new Date().toISOString(),
    uptimeMs: Math.floor(process.uptime() * 1000),
    port: config.port,
    pid: process.pid,
    database,
    taskCount,
    runningTasks: getRunningTaskIds().length,
  });
}
