import { logger } from "../../../utils/logger";

/**
 * Handles POST /api/shutdown
 * Gracefully shuts down the daemon process
 * after sending a success response to the client.
 */
export async function shutdownDaemon() {
  logger.warn("🛑 Received shutdown command from CLI. Exiting...");

  // Delay shutdown slightly to allow the response to be sent
  setTimeout(() => process.exit(0), 500);

  return new Response(
    JSON.stringify({ message: "Daemon shut down gracefully" }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
}
