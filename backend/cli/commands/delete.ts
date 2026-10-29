import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";

/**
 * CLI command: delete
 * Deletes a scheduled task by ID via the API.
 */
export async function deleteCommand(values: { id?: string }) {
  requireFlag(values.id, "Missing --id");
  const id = requireNumber(values.id, "Id must be a number");

  const data = await apiFetch(`${getApiUrl()}/api/tasks/${id}`, {
    method: "DELETE",
  });

  console.info(`Task ${data.deletedId ?? id} deleted.`);
}
