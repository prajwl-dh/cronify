import { requireFlag } from "../lib/errors";
import { logsCommand } from "./logs";

/**
 * CLI command: log
 * Shows execution logs for a specific task by id (alias for logs --id).
 */
export async function logCommand(values: { id?: string }) {
  requireFlag(values.id, "Missing --id");
  return logsCommand({ id: values.id });
}
