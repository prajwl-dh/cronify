import { parseArgs } from 'util';

import { addCommand } from './commands/add';
import { changeCommand } from './commands/change';
import { deleteCommand } from './commands/delete';
import { healthCommand } from './commands/health';
import { installCommand } from './commands/install';
import { listCommand } from './commands/list';
import { logCommand } from './commands/log';
import { logsCommand } from './commands/logs';
import { startCommand } from './commands/start';
import { stopCommand } from './commands/stop';
import { uninstallCommand } from './commands/uninstall';
import { versionCommand } from './commands/version';

/**
 * CLI entry handler
 * Parses arguments and routes execution to the correct command module.
 */
export async function runCli(args: string[]) {
  // Parse CLI arguments into positional commands and flags
  const { positionals, values } = parseArgs({
    args,
    options: {
      name: { type: 'string', short: 'n' },
      cmd: { type: 'string', short: 'c' },
      schedule: { type: 'string', short: 's' },
      id: { type: 'string', short: 'i' },
      port: { type: 'string', short: 'p' },
      confirm: { type: 'boolean' },
      full: { type: 'boolean' },
    },
    allowPositionals: true,
    strict: false,
  });

  // First positional argument defines the command
  const command = positionals[0];

  try {
    // Route command to corresponding handler
    switch (command) {
      case 'add':
        return await addCommand(values);

      case 'delete':
        return await deleteCommand(values);

      case 'list':
        return await listCommand();

      case 'logs':
        return await logsCommand();

      case 'log':
        return await logCommand(values);

      case 'install':
        return installCommand();

      case 'uninstall':
        return await uninstallCommand(values);

      case 'start':
        return startCommand();

      case 'stop':
        return stopCommand();

      case 'change':
        return changeCommand(values);

      case 'health':
        return await healthCommand();

      case 'version':
        return versionCommand();

      default:
        // Fallback help output when command is unknown
        console.log(`
          Cronify CLI Usage:

          cronify add --cmd "<command>" --schedule "<schedule>"
            Adds a new scheduled task

          cronify delete --id <id>
            Deletes a task with the specified id

          cronify list
            Lists all scheduled tasks

          cronify logs
            Lists logs for all tasks

          cronify log --id <task_id>
            Shows logs for a specific task by id

          cronify change --port <port>
            Changes the running port number to a new port

          cronify health
            Gets the health status of the daemon

          cronify version
            Returns the current version of the cronify binary

          cronify start
            Starts the Cronify background daemon (if stopped)

          cronify stop
            Stops the Cronify background daemon

          cronify uninstall --confirm
            Removes background daemon and binary but preserves user data

          cronify uninstall --confirm --full
            Removes Cronify INCLUDING all user data, logs, and configs
        `);
    }
  } catch (error: any) {
    // Handle connection-level failures separately from runtime errors
    if (error?.cause?.code === 'ECONNREFUSED') {
      console.error('Could not connect to daemon. Is it running?');
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}
