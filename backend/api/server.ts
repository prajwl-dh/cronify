import { Database } from 'bun:sqlite';
import CronExpressionParser from 'cron-parser';
import { logger } from '../utils/logger';

export function startServer(db: Database, port: number) {
  Bun.serve({
    port: port,
    async fetch(req) {
      const url = new URL(req.url);

      // GET /api/tasks endpoint
      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        const tasks = db.query('SELECT * FROM tasks').all();
        return new Response(JSON.stringify(tasks), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // POST /api/tasks endpoint
      if (url.pathname === '/api/tasks' && req.method === 'POST') {
        try {
          // Parse incoming body
          const body = (await req.json()) as {
            command: string;
            schedule: string;
          };
          const { command, schedule } = body;

          // Body validation
          if (!command || !schedule) {
            return new Response('Missing command or schedule', { status: 400 });
          }

          let nextRunMs: number;
          let isCron = false;

          // Check if the schedule only need to run once immediately
          if (schedule === '@once') {
            nextRunMs = Date.now();
          } else {
            try {
              // Check if the schedule is a cron string
              const interval = CronExpressionParser.parse(schedule);
              nextRunMs = interval.next().getTime();
              isCron = true;
            } catch (err) {
              // Check if the schedule is a specific date. If so, run the command only once on that date
              const parsedDate = Date.parse(schedule);
              if (!isNaN(parsedDate)) {
                nextRunMs = parsedDate;
              } else {
                return new Response('Invalid cron string or date format', {
                  status: 400,
                });
              }
            }
          }

          // Finally insert everything into the tasks table
          db.query(
            `
            INSERT INTO tasks (command, cron_string, next_run, status)
            VALUES (?, ?, ?, 'inactive')
          `,
          ).run(command, schedule, nextRunMs);

          // Get id for the inserted task
          const row = db.query('SELECT last_insert_rowid() as id').get() as {
            id: number;
          };

          return new Response(JSON.stringify({ success: true, id: row.id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          logger.error('API Error: ' + error);
          return new Response('Internal Server Error', { status: 500 });
        }
      }

      // GET /api/logs endpoint
      if (url.pathname === '/api/logs' && req.method === 'GET') {
        const logs = db.query('SELECT * FROM logs').all();
        return new Response(JSON.stringify(logs), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // DELETE /api/tasks/{id} endpoint
      if (url.pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
        const id = Number(url.pathname.split('/').pop());

        if (isNaN(id)) {
          return new Response('Invalid task ID', { status: 400 });
        }

        const deleteQuery = db.query(`
          DELETE FROM tasks WHERE id = ?
        `);

        const result = deleteQuery.run(id);

        if (result.changes === 0) {
          return new Response(`Task with id ${id} does not exist`, {
            status: 404,
          });
        }

        return new Response(JSON.stringify({ success: true, deletedId: id }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  logger.info(`🌐 Cronify API listening on http://localhost:${port}\n`);
}
