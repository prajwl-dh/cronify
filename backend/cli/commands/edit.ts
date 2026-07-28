import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";

/**
 * CLI command: edit
 * Updates an existing task's name, command, or schedule by ID.
 */
export async function editCommand(values: any) {
  requireFlag(values.id, "Missing --id");
  const id = requireNumber(values.id, "Id must be a number");

  const payload: Record<string, any> = { id };
  if (values.name) payload.name = values.name;
  if (values.cmd || values.command)
    payload.command = values.cmd || values.command;
  if (values.schedule) payload.schedule = values.schedule;

  if (!values.name && !values.cmd && !values.command && !values.schedule) {
    console.error(
      "Nothing to update. Provide at least one of --name, --cmd, or --schedule.",
    );
    return;
  }

  try {
    const res = await apiFetch(`${getApiUrl()}/api/tasks/edit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.info(`Task ${id} updated successfully.`);
    console.info(JSON.stringify(res.task || res));
  } catch (err: any) {
    console.error(`Failed to edit task ${id}:`, err.message || err);
  }
}
