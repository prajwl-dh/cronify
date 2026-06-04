import pkg from "../../../../package.json";
import { logger } from "../../../utils/logger";

/**
 * Handles GET /api/version
 * Gets the version number from package.json
 */
export async function getAppVersion() {
  logger.info("GET /api/version endpoint called\n");

  return new Response(JSON.stringify({ version: pkg.version }), {
    headers: { "Content-Type": "application/json" },
  });
}
