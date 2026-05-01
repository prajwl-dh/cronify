import { Database } from 'bun:sqlite';

export function startServer(db: Database, port: number) {
  Bun.serve({
    port: port,
    fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        const tasks = db.query('SELECT * FROM tasks').all();
        return new Response(JSON.stringify(tasks), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  console.log(`🌐 Cronify API listening on http://localhost:${port}\n`);
}
