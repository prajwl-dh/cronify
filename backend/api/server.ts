import { Database } from 'bun:sqlite';
import indexHtml from '../../ui/index.html' with { type: 'text' };
import { logger } from '../utils/logger';
import { getHealth } from './handler/common/getHealth';
import { getAppVersion } from './handler/common/getVersion';
import { shutdownDaemon } from './handler/common/shutdownDaemon';
import { getLog } from './handler/logs/getLog';
import { getLogs } from './handler/logs/getLogs';
import { addTask } from './handler/tasks/addTask';
import { deleteTask } from './handler/tasks/deleteTask';
import { getTasks } from './handler/tasks/getTasks';

let activeServer: any = null;

/**
 * Starts the Cronify API server and registers
 * all task, log, and daemon control endpoints.
 */
export function startServer(db: Database, port: number) {
  try {
    activeServer = Bun.serve({
      port: port,

      async fetch(req) {
        const url = new URL(req.url);

        // Helper to add CORS headers
        function withCors(response: Response) {
          response.headers.set('Access-Control-Allow-Origin', '*');
          response.headers.set(
            'Access-Control-Allow-Methods',
            'GET, POST, DELETE, OPTIONS',
          );
          response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
          return response;
        }

        // Handle preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
          return withCors(new Response(null, { status: 204 }));
        }

        // Serve UI at root
        if (url.pathname === '/' || url.pathname === '/index.html') {
          return withCors(
            new Response(indexHtml.toString(), {
              headers: { 'Content-Type': 'text/html' },
            }),
          );
        }

        // GET /api/tasks
        if (url.pathname === '/api/tasks' && req.method === 'GET') {
          return withCors(await getTasks(db));
        }

        // POST /api/tasks
        if (url.pathname === '/api/tasks' && req.method === 'POST') {
          return withCors(await addTask(req, db));
        }

        // GET /api/logs
        if (url.pathname === '/api/logs' && req.method === 'GET') {
          return withCors(await getLogs(db));
        }

        // GET /api/logs/:task_id
        if (url.pathname.startsWith('/api/logs') && req.method === 'GET') {
          return withCors(await getLog(url, db));
        }

        // DELETE /api/tasks/:id
        if (url.pathname.startsWith('/api/tasks/') && req.method === 'DELETE') {
          return withCors(await deleteTask(url, db));
        }

        // POST /api/shutdown
        if (url.pathname === '/api/shutdown' && req.method === 'POST') {
          return withCors(await shutdownDaemon());
        }

        // Get /api/version
        if (url.pathname === '/api/version' && req.method === 'GET') {
          return withCors(await getAppVersion());
        }

        // Get /api/health
        if (url.pathname === '/api/health' && req.method === 'GET') {
          return withCors(await getHealth());
        }

        return withCors(new Response('Not Found', { status: 404 }));
      },
    });
  } catch (error: any) {
    // Handle port conflicts when the daemon is already running
    if (error.code === 'EADDRINUSE') {
      console.error(
        `\n❌ ERROR: Cronify Daemon is already running on port ${port}.`,
      );

      console.error(
        `If you need to restart it, kill the existing process first.\n`,
      );

      process.exit(1);
    } else {
      throw error;
    }
  }

  logger.info(`🌐 Cronify API now listening on http://localhost:${port}\n`);
}
