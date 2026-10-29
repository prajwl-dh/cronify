import type { Task } from "../../types/taskType";
import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";
import { printTask } from "../lib/render";

type EditValues = {
  id?: string;
  name?: string;
  cmd?: string;
  command?: string;
  schedule?: string;
  timeout?: string;
  retries?: string;
};

/**
 * CLI command: edit
 * Updates an existing task's name, command, schedule or execution limits.
 */
export async function editCommand(values: EditValues) {
  requireFlag(values.id, "Missing --id");
  const id = requireNumber(values.id, "Id must be a number");

  const payload: Record<string, unknown> = { id };
  const command = values.cmd || values.command;

  if (values.name) payload.name = values.name;
  if (command) payload.command = command;
  if (values.schedule) payload.schedule = values.schedule;

  if (values.timeout !== undefined) {
    const timeoutMs = Math.max(0, Number(values.timeout)) * 1000;
    if (!Number.isFinite(timeoutMs)) {
      console.error("❌ --timeout must be a number of seconds");
      process.exit(1);
    }
    payload.timeoutMs = timeoutMs;
  }

  if (values.retries !== undefined) {
    const retries = Number(values.retries);
    if (!Number.isInteger(retries) || retries < 0 || retries > 10) {
      console.error("❌ --retries must be a whole number between 0 and 10");
      process.exit(1);
    }
    payload.maxRetries = retries;
  }

  if (Object.keys(payload).length === 1) {
    console.error(
      "Nothing to update. Provide at least one of --name, --cmd, --schedule, --timeout or --retries.",
    );
    return;
  }

  try {
    const res = await apiFetch(`${getApiUrl()}/api/tasks/edit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.info(`Task ${id} updated.\n`);
    if (res?.task) printTask(res.task as Task);
  } catch (err: any) {
    console.error(`Failed to edit task ${id}: ${err.message || err}`);
    process.exitCode = 1;
  }
}
