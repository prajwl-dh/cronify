import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../utils/logger';

export type Task = {
  id: number;
  command: string;
  cron_string: string;
  next_run: number;
  status: 'active' | 'inactive' | 'obsolete';
  created_at: number;
  updated_at: number;
};

export type Log = {
  id: number;
  task_id: number;
  executed_at: number;
  stdout: string | null;
  stderr: string | null;
  exit_code: number | null;
};

export function initDatabase(): Database {
  // Create .cronify directory at home directory
  const dir = join(homedir(), '.cronify');
  mkdirSync(dir, { recursive: true });

  // Create cronify.sqlite database inside the .cronify directory
  const dbPath = join(dir, 'cronify.sqlite');
  const db = new Database(dbPath);

  console.log('💾 Initializing Database ...');
  logger.info('💾 Initializing Database ...');
  // Create necessary tables and indexes
  db.run(`
        CREATE TABLE IF NOT EXISTS tasks(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

        CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
    `);

  return db;
}
