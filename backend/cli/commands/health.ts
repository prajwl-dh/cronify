import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { color, formatDuration } from "../lib/render";

type Health = {
  daemonStatus: string;
  version: string;
  uptimeMs: number;
  port: number;
  database: string;
  taskCount: number;
  runningTasks: number;
  timestamp: string;
};

/**
 * CLI command: health
 * Checks the daemon, database and scheduler state.
 */
export async function healthCommand(values: { json?: boolean } = {}) {
  const data = (await apiFetch(`${getApiUrl()}/api/health`)) as Health;

  if (values.json) {
    console.info(JSON.stringify(data, null, 2));
    return;
  }

  console.info(color.green("● daemon running"));
  console.info(`  version      ${data.version}`);
  console.info(`  uptime       ${formatDuration(data.uptimeMs)}`);
  console.info(`  dashboard    http://127.0.0.1:${data.port}`);
  console.info(`  database     ${data.database}`);
  console.info(
    `  tasks        ${data.taskCount} (${data.runningTasks} running)`,
  );
  console.info(`  checked      ${new Date(data.timestamp).toLocaleString()}`);
}
