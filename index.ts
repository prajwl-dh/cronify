import { startServer } from './backend/api/server';
import { runCli } from './backend/cli/parser';
import { initConfig } from './backend/config/config';
import { initDatabase } from './backend/db/schema';
import { startScheduler } from './backend/engine/scheduler';
import { logger } from './backend/utils/logger';

async function main() {
  // Get all arguments passed
  const args = Bun.argv.slice(2);

  // If the args request for daemon, boot the background service daemon
  if (args[0] === 'daemon') {
    logger.info('💻 Daemon Started ...');

    // Load configuration
    const config = initConfig();

    // Initialize database
    const db = initDatabase();

    // Start the daemon services
    startScheduler(db);
    startServer(db, config.port);
  } else {
    // Treat args as cli commands
    await runCli(args);
  }
}

main();
