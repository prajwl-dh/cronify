import { Database } from "bun:sqlite";
import indexHtml from "../../ui/index.html" with { type: "text" };
import { logger } from "../utils/logger";
import { getHealth } from "./handler/common/getHealth";
import { getAppVersion } from "./handler/common/getVersion";
import { shutdownDaemon } from "./handler/common/shutdownDaemon";
import { clearLogs } from "./handler/logs/clearLogs";
import { getLog } from "./handler/logs/getLog";
import { getLogs } from "./handler/logs/getLogs";
import { addTask } from "./handler/tasks/addTask";
import { deleteTask } from "./handler/tasks/deleteTask";
import { editTask } from "./handler/tasks/editTask";
import { getTasks } from "./handler/tasks/getTasks";
import { runTask } from "./handler/tasks/runTask";
import { toggleTask } from "./handler/tasks/toggleTask";

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
          response.headers.set("Access-Control-Allow-Origin", "*");
          response.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
          );
          response.headers.set("Access-Control-Allow-Headers", "Content-Type");
          return response;
        }

        // Handle preflight OPTIONS requests
        if (req.method === "OPTIONS") {
          return withCors(new Response(null, { status: 204 }));
        }

        // Serve UI at root
        if (url.pathname === "/" || url.pathname === "/index.html") {
          return withCors(
            new Response(indexHtml.toString(), {
              headers: { "Content-Type": "text/html" },
            }),
          );
        }

        // GET /api/tasks
        if (url.pathname === "/api/tasks" && req.method === "GET") {
          return withCors(await getTasks(url, db));
        }

        // POST /api/tasks/edit or /api/tasks/:id/edit or /api/tasks/:id (when editing)
        if (
          req.method === "POST" &&
          (url.pathname === "/api/tasks/edit" ||
            (url.pathname.startsWith("/api/tasks/") &&
              url.pathname.endsWith("/edit")))
        ) {
          return withCors(await editTask(req, url, db));
        }

        // POST /api/tasks/:id/run or /api/tasks/run
        if (
          req.method === "POST" &&
          (url.pathname === "/api/tasks/run" ||
            (url.pathname.startsWith("/api/tasks/") &&
              url.pathname.endsWith("/run")))
        ) {
          return withCors(await runTask(req, url, db));
        }

        // POST /api/tasks/:id/toggle or /api/tasks/toggle
        if (
          req.method === "POST" &&
          (url.pathname === "/api/tasks/toggle" ||
            (url.pathname.startsWith("/api/tasks/") &&
              url.pathname.endsWith("/toggle")))
        ) {
          return withCors(await toggleTask(req, url, db));
        }

        // POST /api/tasks (add task or edit task if body contains id or if route is /api/tasks/:id)
        if (req.method === "POST" && url.pathname === "/api/tasks") {
          return withCors(await addTask(req, db));
        }

        if (
          req.method === "POST" &&
          url.pathname.startsWith("/api/tasks/") &&
          !url.pathname.endsWith("/run") &&
          !url.pathname.endsWith("/toggle") &&
          !url.pathname.endsWith("/edit")
        ) {
          return withCors(await editTask(req, url, db));
        }

        // GET /api/logs
        if (url.pathname === "/api/logs" && req.method === "GET") {
          return withCors(await getLogs(url, db));
        }

        // GET /api/logs/:task_id
        if (url.pathname.startsWith("/api/logs/") && req.method === "GET") {
          return withCors(await getLog(url, db));
        }

        // DELETE /api/logs or /api/logs/:task_id
        if (
          (url.pathname === "/api/logs" ||
            url.pathname.startsWith("/api/logs/")) &&
          req.method === "DELETE"
        ) {
          return withCors(await clearLogs(url, db));
        }

        // DELETE /api/tasks/:id
        if (url.pathname.startsWith("/api/tasks/") && req.method === "DELETE") {
          return withCors(await deleteTask(url, db));
        }

        // POST /api/shutdown
        if (url.pathname === "/api/shutdown" && req.method === "POST") {
          return withCors(await shutdownDaemon());
        }

        // Get /api/version
        if (url.pathname === "/api/version" && req.method === "GET") {
          return withCors(await getAppVersion());
        }

        // Get /api/health
        if (url.pathname === "/api/health" && req.method === "GET") {
          return withCors(await getHealth());
        }

        return withCors(new Response("Not Found", { status: 404 }));
      },
    });
  } catch (error: any) {
    if (error.code === "EADDRINUSE") {
      console.error(
        `
❌ ERROR: Cronify Daemon is already running on port ${port}.`,
      );
      console.error(
        `If you need to restart it, kill the existing process first.
`,
      );
      process.exit(1);
    } else {
      throw error;
    }
  }

  logger.info(`🌐 Cronify API now listening on http://127.0.0.1:${port}
`);
}
