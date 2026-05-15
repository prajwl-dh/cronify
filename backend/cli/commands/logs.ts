import type { Log } from '../../types/logType';
import { apiFetch } from '../lib/api';
import { getApiUrl } from '../lib/config';

/**
 * CLI command: logs
 * Fetches and displays all execution logs from the API.
 * Shows a fallback message if no logs exist.
 */
export async function logsCommand() {
  // Fetch all system logs from backend
  const logs = (await apiFetch(`${getApiUrl()}/api/logs`)) as Log[];

  // Handle empty log state
  if (logs.length === 0) {
    console.info('No logs available\n');
  } else {
    // Output logs as JSON
    console.info(JSON.stringify(logs) + '\n');
  }
}
