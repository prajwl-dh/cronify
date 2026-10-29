import type { Task } from "../../types/taskType";
import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { printTaskList } from "../lib/render";

type ListValues = {
  json?: boolean;
  status?: string;
  search?: string;
  limit?: string;
};

/**
 * CLI command: list
 * Fetches and displays scheduled tasks. Use --json for raw output.
 */
export async function listCommand(values: ListValues = {}) {
  const params = new URLSearchParams();

  if (values.status && values.status !== "all") {
    params.set("status", values.status);
  }
  if (values.search) params.set("search", values.search);
  if (values.limit) {
    params.set("page", "1");
    params.set("limit", values.limit);
  }

  const query = params.toString();
  const data = await apiFetch(
    `${getApiUrl()}/api/tasks${query ? `?${query}` : ""}`,
  );

  if (values.json) {
    console.info(JSON.stringify(data, null, 2));
    return;
  }

  const tasks: Task[] = Array.isArray(data)
    ? (data as Task[])
    : data.tasks || [];
  printTaskList(tasks);
}
