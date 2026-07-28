import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "../utils/logger";

/**
 * Initializes the Cronify SQLite database.
 *
 * Creates the ~/.cronify directory if needed,
 * then creates the database file, tables,
 * and required indexes.
 */
export function initDatabase(): Database {
  const dir = join(homedir(), ".cronify");

  // Create the config directory on first run
  mkdirSync(dir, { recursive: true });

  // Create or open the SQLite database
  const dbPath = join(dir, "cronify.sqlite");
  const db = new Database(dbPath);

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON;");

  logger.info("💾 Initializing Database ...");

  // Create application tables and indexes
  db.run(`
        CREATE TABLE IF NOT EXISTS tasks(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            command TEXT NOT NULL,
            cron_string TEXT NOT NULL,
            next_run INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'inactive',
            created_at INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5)*86400000 AS INTEGER)),
            updated_at INTEGER NOT NULL DEFAULT (CAST((julianday('now') - 2440587.5)*86400000 AS INTEGER))
        );

        CREATE TABLE IF NOT EXISTS logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            executed_at INTEGER NOT NULL,
            stdout TEXT,
            stderr TEXT,
            exit_code INTEGER,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_tasks_next_run ON tasks(next_run);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
        CREATE INDEX IF NOT EXISTS idx_logs_executed_at ON logs(executed_at);
        CREATE INDEX IF NOT EXISTS idx_logs_exit_code ON logs(exit_code);
    `);

  return db;
}
