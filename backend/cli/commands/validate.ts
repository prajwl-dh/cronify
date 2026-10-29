import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { requireFlag } from "../lib/errors";
import { color, formatTimestamp } from "../lib/render";

type Validation = {
  valid: boolean;
  error?: string;
  description?: string;
  kind?: string;
  nextRuns: number[];
};

/**
 * CLI command: validate
 * Checks a cron expression or date and previews its next runs.
 */
export async function validateCommand(values: { schedule?: string }) {
  requireFlag(values.schedule, "Missing --schedule");

  const data = (await apiFetch(`${getApiUrl()}/api/schedule/validate`, {
    method: "POST",
    body: JSON.stringify({ schedule: values.schedule }),
  })) as Validation;

  if (!data.valid) {
    console.error(`❌ ${data.error || "Invalid schedule"}`);
    process.exitCode = 1;
    return;
  }

  console.info(color.green("Valid schedule"));
  console.info(`  ${data.description}`);
  console.info(`  kind: ${data.kind}`);

  if (data.nextRuns.length > 0) {
    console.info("");
    console.info(color.dim("Next runs"));
    data.nextRuns.forEach((run, index) => {
      console.info(`  ${index + 1}. ${formatTimestamp(run, true)}`);
    });
  }
}
