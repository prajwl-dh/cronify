import {
  describeSchedule,
  parseSchedule,
  previewSchedule,
} from "../../../utils/schedule";
import { error, json, readJson } from "../../lib/http";

type ValidateBody = { schedule?: string };

/**
 * Handles POST /api/schedule/validate
 * Validates a schedule and returns a description plus its next runs.
 */
export async function validateSchedule(req: Request) {
  const body = await readJson<ValidateBody>(req);
  const schedule = body.schedule?.trim();

  if (!schedule) return error("Missing schedule");

  const parsed = parseSchedule(schedule);

  if (!parsed.ok) {
    return json({
      valid: false,
      error: parsed.error,
      schedule,
      nextRuns: [],
    });
  }

  return json({
    valid: true,
    schedule,
    kind: parsed.kind,
    description: describeSchedule(schedule),
    nextRuns: previewSchedule(schedule, 5),
  });
}
