import { initConfig } from './backend/api/config';
import { startServer } from './backend/api/server';
import { initDatabase } from './backend/db/schema';
import { startScheduler } from './backend/engine/scheduler';

function main() {
  // Load configuration
  const config = initConfig();

  // Initialize database
  const db = initDatabase();

  // Start the daemon services
  startScheduler(db);
  startServer(db, config.port);
}

main();
