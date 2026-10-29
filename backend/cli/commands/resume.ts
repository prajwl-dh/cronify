import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";

/**
 * CLI command: resume
 * Resumes a paused task and recomputes its next run.
 */
export async function resumeCommand(values: { id?: string }) {
  requireFlag(values.id, "Missing --id");
  const id = requireNumber(values.id, "Id must be a number");

  const res = await apiFetch(`${getApiUrl()}/api/tasks/${id}/resume`, {
    method: "POST",
  });

  console.info(res.message || `Task ${id} resumed.`);
}
