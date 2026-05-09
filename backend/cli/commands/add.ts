import { apiFetch } from '../lib/api';
import { getApiUrl } from '../lib/config';
import { requireFlag } from '../lib/errors';

/**
 * CLI command: add
 * Schedules a new task by sending a request to the API.
 *
 * Requires:
 * - cmd: command to execute
 * - schedule: cron expression or date string
 */
export async function addCommand(values: any) {
  // Validate required CLI inputs
  requireFlag(values.cmd, 'Missing --cmd');
  requireFlag(values.schedule, 'Missing --schedule');

  // Send task creation request to backend API
  const data = await apiFetch(`${getApiUrl()}/api/tasks`, {
    method: 'POST',
    body: JSON.stringify({
      command: values.cmd,
      schedule: values.schedule,
    }),
  });

  // Confirm successful scheduling with returned task ID
  console.info(`Task scheduled successfully! ID: ${JSON.stringify(data)}\n`);
}
