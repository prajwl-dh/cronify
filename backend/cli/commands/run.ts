import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";

/**
 * CLI command: run
 * Immediately triggers execution of a task by ID.
 */
export async function runCommand(values: any) {
  requireFlag(values.id, "Missing --id");
  const id = requireNumber(values.id, "Id must be a number");

  try {
    const res = await apiFetch(`${getApiUrl()}/api/tasks/${id}/run`, {
      method: "POST",
    });

    console.info(`Task ${id} triggered successfully. ${res.message || ""}`);
  } catch (err: any) {
    console.error(`Failed to run task ${id}:`, err.message || err);
  }
}
