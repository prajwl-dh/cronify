import type { Log } from '../../../shared/types/logType';
import { apiFetch } from '../lib/api';
import { getApiUrl } from '../lib/config';
import { requireFlag, requireNumber } from '../lib/errors';

/**
 * CLI command: log
 * Fetches execution logs for a specific task by ID.
 *
 * Requires:
 * - id: numeric task identifier
 */
export async function logCommand(values: any) {
  // Validate required task ID
  requireFlag(values.id, 'Missing --id');

  // Ensure ID is a valid number
  const id = requireNumber(values.id, 'Id must be a number');

  // Fetch logs for the specified task
  const logs = (await apiFetch(`${getApiUrl()}/api/logs/${id}`)) as Log[];

  // Handle empty log history
  if (logs.length === 0) {
    console.info('No logs available for this task\n');
  } else {
    // Output logs as JSON
    console.info(JSON.stringify(logs) + '\n');
  }
}
