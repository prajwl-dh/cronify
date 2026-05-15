import type { Task } from '../../types/taskType';
import { apiFetch } from '../lib/api';
import { getApiUrl } from '../lib/config';

/**
 * CLI command: list
 * Fetches and displays all scheduled tasks from the API.
 * Shows a message if no tasks are found.
 */
export async function listCommand() {
  // Fetch all scheduled tasks from backend
  const tasks = (await apiFetch(`${getApiUrl()}/api/tasks`)) as Task[];

  // Handle empty state
  if (tasks.length === 0) {
    console.info('No tasks scheduled\n');
  } else {
    // Output task list as JSON
    console.info(JSON.stringify(tasks) + '\n');
  }
}
