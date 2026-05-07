import { writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parseArgs } from 'util';
import { initConfig } from '../config/config';
import { logger } from '../utils/logger';

export async function runCli(args: string[]) {
  // Read config file to get the port
  const config = initConfig();
  const API_URL = `http://localhost:${config.port}`;

  // Parse the terminal arguments
  const { positionals, values } = parseArgs({
    args,
    options: {
      cmd: { type: 'string', short: 'c' },
      schedule: { type: 'string', short: 's' },
      id: { type: 'string', short: 'i' },
      port: { type: 'string', short: 'p' },
      stop: { type: 'boolean' },
    },
    allowPositionals: true,
    strict: false,
  });

  const command = positionals[0];

  // Now route the command to correct API endpoint
  try {
    // Add a new task
    if (command === 'add') {
      if (!values.cmd || !values.schedule) {
        console.error(
          "❌ Missing required flags.\nUsage: cronify add --cmd 'echo hi' --schedule '@once'\n",
        );
        process.exit(1);
      }

      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: values.cmd,
          schedule: values.schedule,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      console.info(
        `✅ Task scheduled successfully! ID: ${JSON.stringify(data)}\n`,
      );
    } else if (command === 'delete') {
      // Delete a task
      if (!values.id) {
        console.error(
          '❌ Missing required flags.\nUsage: cronify delete --id 1\n',
        );
        process.exit(1);
      }

      if (isNaN(Number(values.id))) {
        console.error(
          '❌ Id must be a number.\nUsage: cronify delete --id 1\n',
        );
        process.exit(1);
      }
      const res = await fetch(`${API_URL}/api/tasks/${values.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      console.info(
        `✅ Task deleted successfully! ID: ${JSON.stringify(data)}\n`,
      );
    } else if (command === 'list') {
      // List all tasks
      const res = await fetch(`${API_URL}/api/tasks`);

      const tasks = (await res.json()) as [];

      if (tasks.length === 0) {
        console.info('No tasks scheduled\n');
      } else {
        console.info(JSON.stringify(tasks) + '\n');
      }
    } else if (command === 'logs') {
      // List all logs
      const res = await fetch(`${API_URL}/api/logs`);

      const logs = (await res.json()) as [];

      if (logs.length === 0) {
        console.info('No logs available\n');
      } else {
        console.info(JSON.stringify(logs) + '\n');
      }
    } else if (command === 'daemon') {
      // Handle the stop command ping
      if (values.stop) {
        try {
          const res = await fetch(`${API_URL}/api/shutdown`, {
            method: 'POST',
          });
          if (res.ok) {
            console.info('🛑 Cronify daemon has been shut down gracefully\n');
          }
        } catch (err: any) {
          if (err?.cause?.code === 'ECONNREFUSED') {
            console.warn('Daemon is not currently running.');
          } else {
            throw err;
          }
        }
      } else {
        console.info(
          'Usage: cronify daemon --start OR cronify daemon --stop\n',
        );
      }
    } else if (command === 'change') {
      // Handle config changes
      if (values.port) {
        const newPort = Number(values.port);
        if (isNaN(newPort) || newPort < 1 || newPort > 65535) {
          console.error(
            '❌ Invalid port number. Must be between 1 and 65535\n',
          );
          process.exit(1);
        }

        const oldPort = config.port;

        // Update the config file
        const configPath = join(homedir(), '.cronify', 'config.json');
        const updatedConfig = { ...config, port: newPort };
        writeFileSync(
          configPath,
          JSON.stringify(updatedConfig, null, 2),
          'utf-8',
        );
        logger.info(`✅ Config updated! Port changed to ${newPort}`);

        // Tell the running daemon to hot-swap to the new port
        try {
          const res = await fetch(`http://localhost:${oldPort}/api/reload`, {
            method: 'POST',
          });
          if (res.ok) {
            console.info(
              `🔄 Sent reload signal. Daemon now running on http://localhost:${newPort}\n`,
            );
          }
        } catch (err: any) {
          // If fetch fails, the daemon isn't running. No big deal, it will use the new port next time it boots.
          console.info(
            `ℹ️ Daemon is not currently running. It will use port ${newPort} next time it starts\n`,
          );
        }
      } else {
        console.error(
          '❌ Missing required flags.\nUsage: cronify change --port 3000\n',
        );
      }
    } else {
      // Fallback usage guide
      console.log(`
        Cronify CLI Usage:
        cronify add --cmd "<command>" --schedule "<cron-schedule || ISO-8601-date || @once>"
        cronify delete --id <id>
        cronify list
        cronify logs
        cronify change --port <new-port-number>
        cronify daemon --start
        cronify daemon --stop
        `);
    }
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      console.error(
        `❌ Could not connect to Cronify daemon at ${API_URL}. Is it running?\n`,
      );
    } else {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }
}
