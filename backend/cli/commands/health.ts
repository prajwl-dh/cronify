import { apiFetch } from '../lib/api';
import { getApiUrl } from '../lib/config';

export async function healthCommand() {
  const data = await apiFetch(`${getApiUrl()}/api/health`, {
    method: 'GET',
  });

  console.info(JSON.stringify(data));
}
