import { startServer } from "./backend/api/server";
import { runCli } from "./backend/cli/runCli";
import { initConfig } from "./backend/config/config";
import { initDatabase } from "./backend/db/schema";
import { startScheduler } from "./backend/engine/scheduler";
import { logger } from "./backend/utils/logger";

/**
 * Application entry point
 * Decides whether to run in daemon mode (server + scheduler)
 * or CLI mode based on provided arguments.
 */
async function main() {
  // Extract CLI arguments (excluding Bun runtime args)
  const args = Bun.argv.slice(2);

  // Internal daemon mode (used by system/service runner)
  if (args[0] === "daemon" && args.includes("--internal")) {
    logger.info("Internal daemon worker started");

    // Load application configuration (port, env, etc.)
    const config = initConfig();

    // Initialize database connection and schema
    const db = initDatabase();

    // Start background job scheduler
    startScheduler(db);

    // Start HTTP API server
    startServer(db, config.port);
  } else {
    // Default mode: execute CLI commands
    await runCli(args);
  }
}

// Boot application
main();
