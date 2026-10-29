import { Database } from "bun:sqlite";
import indexHtml from "../../ui/index.html" with { type: "text" };
import { initConfig } from "../config/config";
import { logger } from "../utils/logger";
import { getConfig, updateConfig } from "./handler/common/config";
import { getHealth } from "./handler/common/getHealth";
import { getOverview } from "./handler/common/getOverview";
import { getAppVersion } from "./handler/common/getVersion";
import { shutdownDaemon } from "./handler/common/shutdownDaemon";
import { clearLogs } from "./handler/logs/clearLogs";
import { getLog } from "./handler/logs/getLog";
import { getLogDetail } from "./handler/logs/getLogDetail";
import { getLogs } from "./handler/logs/getLogs";
import { addTask } from "./handler/tasks/addTask";
import { bulkTasks } from "./handler/tasks/bulkTasks";
import { deleteTask } from "./handler/tasks/deleteTask";
import { editTask } from "./handler/tasks/editTask";
import { getTask } from "./handler/tasks/getTask";
import { getTasks } from "./handler/tasks/getTasks";
import { runTask } from "./handler/tasks/runTask";
import { setTaskStatus } from "./handler/tasks/setTaskStatus";
import { toggleTask } from "./handler/tasks/toggleTask";
import { validateSchedule } from "./handler/tasks/validateSchedule";
import { error, json } from "./lib/http";

let activeServer: ReturnType<typeof Bun.serve> | null = null;

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin);
}

/**
 * Starts the Cronify API server and registers all task, log, daemon
 * control endpoints. The daemon binds to localhost only: it controls
 * commands on this machine and must not be reachable from the network.
 */
export function startServer(db: Database, port: number) {
  try {
    activeServer = Bun.serve({
      port,
      hostname: "127.0.0.1",

      async fetch(req) {
        const url = new URL(req.url);
        const method = req.method;
        const path = url.pathname;

        // Reject cross-site requests from pages that are not Cronify's
        // own local UI. Tools and the CLI send no Origin header.
        const origin = req.headers.get("origin");
        if (origin && !isLocalOrigin(origin)) {
          return new Response("Forbidden origin", { status: 403 });
        }

        function withCors(response: Response) {
          if (origin) {
            response.headers.set("Access-Control-Allow-Origin", origin);
            response.headers.set("Vary", "Origin");
          }
          response.headers.set(
            "Access-Control-Allow-Methods",
            "GET, POST, PATCH, DELETE, OPTIONS",
          );
          response.headers.set("Access-Control-Allow-Headers", "Content-Type");
          return response;
        }

        if (method === "OPTIONS") {
          return withCors(new Response(null, { status: 204 }));
        }

        // The single-file web dashboard.
        if (path === "/" || path === "/index.html") {
          return withCors(
            new Response(indexHtml.toString(), {
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
              },
            }),
          );
        }

        if (!path.startsWith("/api/")) {
          return withCors(new Response("Not Found", { status: 404 }));
        }

        try {
          let response: Response;

          // ---------- daemon ----------
          if (path === "/api/health" && method === "GET") {
            response = await getHealth(db);
          } else if (path === "/api/version" && method === "GET") {
            response = await getAppVersion();
          } else if (path === "/api/config" && method === "GET") {
            response = await getConfig();
          } else if (
            path === "/api/config" &&
            (method === "PATCH" || method === "POST")
          ) {
            response = await updateConfig(req, db);
          } else if (path === "/api/shutdown" && method === "POST") {
            response = await shutdownDaemon();
          } else if (
            (path === "/api/overview" || path === "/api/stats") &&
            method === "GET"
          ) {
            response = await getOverview(db);
          } else if (path === "/api/schedule/validate" && method === "POST") {
            response = await validateSchedule(req);

            // ---------- tasks ----------
          } else if (path === "/api/tasks" && method === "GET") {
            response = await getTasks(url, db);
          } else if (path === "/api/tasks" && method === "POST") {
            response = await addTask(req, db);
          } else if (path === "/api/tasks/bulk" && method === "POST") {
            response = await bulkTasks(req, db);
          } else if (path === "/api/tasks/edit" && method === "POST") {
            response = await editTask(req, url, db);
          } else if (path === "/api/tasks/run" && method === "POST") {
            response = await runTask(req, url, db);
          } else if (path === "/api/tasks/toggle" && method === "POST") {
            response = await toggleTask(req, url, db);
          } else if (
            path.match(/^\/api\/tasks\/\d+\/run$/) &&
            method === "POST"
          ) {
            response = await runTask(req, url, db);
          } else if (
            path.match(/^\/api\/tasks\/\d+\/toggle$/) &&
            method === "POST"
          ) {
            response = await toggleTask(req, url, db);
          } else if (
            path.match(/^\/api\/tasks\/\d+\/pause$/) &&
            method === "POST"
          ) {
            response = await setTaskStatus(url, db, "paused");
          } else if (
            path.match(/^\/api\/tasks\/\d+\/resume$/) &&
            method === "POST"
          ) {
            response = await setTaskStatus(url, db, "inactive");
          } else if (
            path.match(/^\/api\/tasks\/\d+\/edit$/) &&
            method === "POST"
          ) {
            response = await editTask(req, url, db);
          } else if (path.match(/^\/api\/tasks\/\d+$/) && method === "GET") {
            response = await getTask(url, db);
          } else if (path.match(/^\/api\/tasks\/\d+$/) && method === "DELETE") {
            response = await deleteTask(url, db);
          } else if (path.match(/^\/api\/tasks\/\d+$/) && method === "POST") {
            response = await editTask(req, url, db);

            // ---------- logs ----------
          } else if (path === "/api/logs" && method === "GET") {
            response = await getLogs(url, db);
          } else if (path === "/api/logs" && method === "DELETE") {
            response = await clearLogs(url, db);
          } else if (
            path.match(/^\/api\/logs\/detail\/\d+$/) &&
            method === "GET"
          ) {
            response = await getLogDetail(url, db);
          } else if (path.match(/^\/api\/logs\/\d+$/) && method === "GET") {
            response = await getLog(url, db);
          } else if (path.match(/^\/api\/logs\/\d+$/) && method === "DELETE") {
            response = await clearLogs(url, db);
          } else {
            response = error("Not Found", 404);
          }

          return withCors(response);
        } catch (err) {
          logger.error(`API ${method} ${path} failed: ${err}`);
          return withCors(json({ error: "Internal Server Error" }, 500));
        }
      },
    });
  } catch (err: any) {
    if (err.code === "EADDRINUSE") {
      console.error(
        `
❌ ERROR: Cronify Daemon is already running on port ${port}.`,
      );
      console.error(
        `If you need to restart it, kill the existing process first.
`,
      );
      process.exit(1);
    }

    throw err;
  }

  const config = initConfig();
  logger.info(
    `🌐 Cronify API now listening on http://127.0.0.1:${config.port}\n`,
  );
}
