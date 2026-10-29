import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag } from "../lib/errors";
import { printTask } from "../lib/render";
import type { Task } from "../../types/taskType";

type AddValues = {
  name?: string;
  cmd?: string;
  command?: string;
  schedule?: string;
  timeout?: string;
  retries?: string;
};

/**
 * CLI command: add
 * Schedules a new task by sending a request to the API.
 */
export async function addCommand(values: AddValues) {
  const command = values.cmd || values.command;

  requireFlag(values.name, "Missing --name");
  requireFlag(command, "Missing --cmd");
  requireFlag(values.schedule, "Missing --schedule");

  const timeoutMs =
    values.timeout !== undefined
      ? Math.max(0, Number(values.timeout)) * 1000
      : undefined;

  if (values.timeout !== undefined && !Number.isFinite(timeoutMs)) {
    console.error("❌ --timeout must be a number of seconds");
    process.exit(1);
  }

  const maxRetries = values.retries !== undefined ? Number(values.retries) : 0;

  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10) {
    console.error("❌ --retries must be a whole number between 0 and 10");
    process.exit(1);
  }

  const data = await apiFetch(`${getApiUrl()}/api/tasks`, {
    method: "POST",
    body: JSON.stringify({
      name: values.name,
      command,
      schedule: values.schedule,
      ...(timeoutMs !== undefined ? { timeoutMs } : {}),
      maxRetries,
    }),
  });

  console.info("Task scheduled.\n");
  if (data?.task) printTask(data.task as Task);
}
