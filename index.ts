import { startServer } from './backend/api/server';
import { initDatabase } from './backend/db/schema';
import { startScheduler } from './backend/engine/scheduler';

function main() {
  // Initialize database
  const db = initDatabase();

  // Load configuration
  const port = 2207;

  // Start the daemon services
  startScheduler(db);
  startServer(db, port || 2207);
}

main();
