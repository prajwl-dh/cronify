import { initConfig } from '../../config/config';

/**
 * Builds and returns the base API URL using the configured port.
 * Currently assumes local development environment.
 */
export function getApiUrl() {
  const config = initConfig();
  return `http://127.0.0.1:${config.port}`;
}

/**
 * Returns the application configuration instance.
 * Useful for accessing shared runtime config values.
 */
export function getConfig() {
  return initConfig();
}
