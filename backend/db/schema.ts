import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { getConfigDir } from "../config/config";
import { logger } from "../utils/logger";

const SCHEMA_VERSION = 2;

type ColumnInfo = { name: string };

function hasColumn(db: Database, table: string, column: string) {
  const columns = db.query(`PRAGMA table_info(${table})`).all() as ColumnInfo[];
  return columns.some((entry) => entry.name === column);
}

function addColumn(
  db: Database,
  table: string,
  column: string,
  definition: string,
) {
  if (!hasColumn(db, table, column)) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/**
 * Brings older databases up to the current schema without losing data.
 */
function migrate(db: Database) {
  const currentVersion = (
    db.query("PRAGMA user_version").get() as { user_version: number }
  ).user_version;

  addColumn(db, "tasks", "timeout_ms", "INTEGER");
  addColumn(db, "tasks", "max_retries", "INTEGER NOT NULL DEFAULT 0");
  addColumn(db, "tasks", "last_run_at", "INTEGER");
  addColumn(db, "tasks", "last_exit_code", "INTEGER");
  addColumn(db, "tasks", "last_duration_ms", "INTEGER");
  addColumn(db, "tasks", "run_count", "INTEGER NOT NULL DEFAULT 0");
  addColumn(db, "tasks", "success_count", "INTEGER NOT NULL DEFAULT 0");
  addColumn(db, "tasks", "failure_count", "INTEGER NOT NULL DEFAULT 0");

  addColumn(db, "logs", "duration_ms", "INTEGER");
  addColumn(db, "logs", "attempt", "INTEGER NOT NULL DEFAULT 1");
  addColumn(db, "logs", "trigger", "TEXT NOT NULL DEFAULT 'schedule'");

  if (currentVersion < 2) {
    // Backfill denormalized task stats from logs that already exist.
    db.run(`
      UPDATE tasks
      SET
        run_count = (SELECT COUNT(*) FROM logs WHERE logs.task_id = tasks.id),
        success_count = (
          SELECT COUNT(*) FROM logs WHERE logs.task_id = tasks.id AND logs.exit_code = 0
        ),
        failure_count = (
          SELECT COUNT(*) FROM logs
          WHERE logs.task_id = tasks.id AND (logs.exit_code IS NULL OR logs.exit_code != 0)
        ),
        last_run_at = (
          SELECT MAX(executed_at) FROM logs WHERE logs.task_id = tasks.id
        ),
        last_exit_code = (
          SELECT exit_code FROM logs
          WHERE logs.task_id = tasks.id
          ORDER BY executed_at DESC, id DESC
          LIMIT 1
        ),
        last_duration_ms = (
          SELECT duration_ms FROM logs
          WHERE logs.task_id = tasks.id
          ORDER BY executed_at DESC, id DESC
          LIMIT 1
        )
      WHERE EXISTS (SELECT 1 FROM logs WHERE logs.task_id = tasks.id)
    `);

    db.run(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

/**
 * Initializes the Cronify SQLite database.
 *
 * Creates the ~/.cronify directory if needed, then creates the
 * database file, tables, indexes, and applies migrations.
 */
export function initDatabase(): Database {
  const dir = getConfigDir();

  mkdirSync(dir, { recursive: true });

  const dbPath = join(dir, "cronify.sqlite");
  const db = new Database(dbPath);

  // WAL keeps reads responsive while a task is writing its log.
  db.run("PRAGMA journal_mode = WAL;");
  db.run("PRAGMA synchronous = NORMAL;");
  db.run("PRAGMA busy_timeout = 5000;");
  db.run("PRAGMA foreign_keys = ON;");

  logger.info("💾 Initializing Database ...");

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

  migrate(db);

  return db;
}

/**
 * Removes logs older than the configured retention window.
 * Returns the number of deleted rows.
 */
export function purgeOldLogs(db: Database, retentionDays: number): number {
  if (!retentionDays || retentionDays <= 0) return 0;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const result = db.query("DELETE FROM logs WHERE executed_at < ?").run(cutoff);

  return result.changes;
}
