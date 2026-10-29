import type { Log } from "../../types/logType";
import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { printLogList } from "../lib/render";

type LogsValues = {
  id?: string;
  status?: string;
  limit?: string;
  json?: boolean;
};

type LogsResponse = {
  logs: Log[];
  summary: { total: number; success: number; failure: number };
};

/**
 * CLI command: logs
 * Lists execution logs for all tasks, or one task with --id.
 */
export async function logsCommand(values: LogsValues = {}) {
  const params = new URLSearchParams();

  if (values.status && values.status !== "all")
    params.set("status", values.status);
  if (values.limit) params.set("limit", values.limit);
  if (!values.json) params.set("compact", "1");

  const endpoint = values.id
    ? `${getApiUrl()}/api/logs/${Number(values.id)}`
    : `${getApiUrl()}/api/logs`;

  const data = (await apiFetch(
    `${endpoint}${params.toString() ? `?${params}` : ""}`,
  )) as LogsResponse | Log[];

  if (values.json) {
    console.info(JSON.stringify(data, null, 2));
    return;
  }

  const logs = Array.isArray(data) ? data : data.logs || [];
  const summary = Array.isArray(data) ? null : data.summary;

  printLogList(logs);

  if (summary) {
    console.info(
      `Summary: ${summary.total} total · ${summary.success} succeeded · ${summary.failure} failed`,
    );
  }
}
