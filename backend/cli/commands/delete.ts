import { apiFetch } from '../lib/api';
import { getApiUrl } from '../lib/config';
import { requireFlag, requireNumber } from '../lib/errors';

/**
 * CLI command: delete
 * Deletes a scheduled task by ID via the API.
 *
 * Requires:
 * - id: numeric task identifier
 */
export async function deleteCommand(values: any) {
  // Validate required task ID
  requireFlag(values.id, 'Missing --id');

  // Ensure ID is a valid number
  const id = requireNumber(values.id, 'Id must be a number');

  // Send delete request to backend API
  const data = await apiFetch(`${getApiUrl()}/api/tasks/${id}`, {
    method: 'DELETE',
  });

  // Confirm successful deletion
  console.info(`Task deleted successfully! ID: ${JSON.stringify(data)}\n`);
}
