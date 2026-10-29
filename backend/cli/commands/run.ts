import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag, requireNumber } from "../lib/errors";

type RunValues = { id?: string; all?: boolean };

/**
 * CLI command: run
 * Immediately triggers execution of one task, or every task with --all.
 */
export async function runCommand(values: RunValues) {
  if (values.all) {
    const res = await apiFetch(`${getApiUrl()}/api/tasks/bulk`, {
      method: "POST",
      body: JSON.stringify({ action: "run", ids: await allTaskIds() }),
    });

    console.info(`Triggered ${res.affected} task(s).`);
    if (res.skipped)
      console.info(`${res.skipped} task(s) were already running.`);
    return;
  }

  requireFlag(values.id, "Missing --id (or use --all)");
  const id = requireNumber(values.id, "Id must be a number");

  try {
    const res = await apiFetch(`${getApiUrl()}/api/tasks/${id}/run`, {
      method: "POST",
    });

    console.info(
      res.running ? `Task ${id} is already running.` : `Task ${id} triggered.`,
    );
  } catch (err: any) {
    console.error(`Failed to run task ${id}: ${err.message || err}`);
    process.exitCode = 1;
  }
}

async function allTaskIds(): Promise<number[]> {
  const tasks = (await apiFetch(`${getApiUrl()}/api/tasks`)) as {
    id: number;
  }[];
  return tasks.map((task) => task.id);
}
