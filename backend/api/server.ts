import { Database } from 'bun:sqlite';

export function startServer(db: Database, port: number) {
  Bun.serve({
    port: port,
    fetch(req) {
      const url = new URL(req.url);

      // GET /api/tasks endpoint
      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        const tasks = db.query('SELECT * FROM tasks').all();
        return new Response(JSON.stringify(tasks), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // GET /api/logs endpoint
      if (url.pathname === '/api/logs' && req.method === 'GET') {
        const logs = db.query('SELECT * FROM logs').all();
        return new Response(JSON.stringify(logs), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  console.log(`🌐 Cronify API listening on http://localhost:${port}\n`);
}
