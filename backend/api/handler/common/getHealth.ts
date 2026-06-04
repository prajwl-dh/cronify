import pkg from "../../../../package.json";
import { logger } from "../../../utils/logger";

/**
 * Handles GET /api/health
 * Gets the health status of the API
 */
export async function getHealth() {
  logger.info("GET /api/health endpoint called");

  const health = {
    daemonStatus: "running",
    version: pkg.version,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
