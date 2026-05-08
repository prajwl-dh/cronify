import { writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parseArgs } from 'util';
import { initConfig } from '../config/config';
import { installDaemon } from '../os/install';
import { startDaemonService, stopDaemonService } from '../os/service';
import { uninstallDaemon } from '../os/uninstall';
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
      confirm: { type: 'boolean' },
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
    } else if (command === 'log') {
      // List log for specific task
      if (!values.id) {
        console.error(
          '❌ Missing required flags.\nUsage: cronify log --id 1\n',
        );
        process.exit(1);
      }

      if (isNaN(Number(values.id))) {
        console.error('❌ Id must be a number.\nUsage: cronify log --id 1\n');
        process.exit(1);
      }

      const res = await fetch(`${API_URL}/api/logs/${values.id}`);

      const logs = (await res.json()) as [];

      if (logs.length === 0) {
        console.info('No logs available for this task\n');
      } else {
        console.info(JSON.stringify(logs) + '\n');
      }
    } else if (command === 'install') {
      installDaemon();
    } else if (command === 'uninstall') {
      console.log(
        '⚠️ WARNING: This will completely delete Cronify, your scheduled tasks, and all logs.',
      );
      if (values.confirm) {
        stopDaemonService(); // Ensure it stops before we delete files
        await uninstallDaemon();
      } else {
        console.log('To confirm, run: cronify uninstall --confirm');
      }
    } else if (command === 'start') {
      startDaemonService();
    } else if (command === 'stop') {
      stopDaemonService();
    } else if (command === 'change') {
      if (values.port) {
        const newPort = Number(values.port);
        if (isNaN(newPort) || newPort < 1 || newPort > 65535) {
          console.error('❌ Invalid port number. Must be between 1 and 65535.');
          process.exit(1);
        }

        const configPath = join(homedir(), '.cronify', 'config.json');
        const updatedConfig = { ...config, port: newPort };
        writeFileSync(
          configPath,
          JSON.stringify(updatedConfig, null, 2),
          'utf-8',
        );

        logger.info(`✅ Config updated! Port changed to ${newPort}.`);
        console.info(`🔄 Bouncing the OS service to apply changes...`);

        stopDaemonService();
        startDaemonService();
      } else {
        console.error(
          '❌ Missing required flags.\nUsage: cronify change --port 3000',
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
        cronify log --id <task_id>
        cronify change --port <new-port-number>
        cronify install
        cronify uninstall --confirm
        cronify start
        cronify stop
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
