import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";

/**
 * CLI command: pause
 * Pauses a scheduled task without deleting it.
 */
export async function pauseCommand(values: { id?: string }) {
  requireFlag(values.id, "Missing --id");
  const id = requireNumber(values.id, "Id must be a number");

  const res = await apiFetch(`${getApiUrl()}/api/tasks/${id}/pause`, {
    method: "POST",
  });

  console.info(res.message || `Task ${id} paused.`);
}
