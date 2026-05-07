import { parseArgs } from 'util';
import { initConfig } from '../config/config';

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
          "❌ Missing required flags.\nUsage: cronify add --cmd 'echo hi' --schedule '@once'",
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
        `✅ Task scheduled successfully! ID: ${JSON.stringify(data)}`,
      );
    } else if (command === 'delete') {
      // Delete a task
      if (!values.id) {
        console.error(
          '❌ Missing required flags.\nUsage: cronify delete --id 1',
        );
        process.exit(1);
      }

      if (isNaN(Number(values.id))) {
        console.error('❌ Id must be a number.\nUsage: cronify delete --id 1');
        process.exit(1);
      }
      const res = await fetch(`${API_URL}/api/tasks/${values.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      console.info(`✅ Task deleted successfully! ID: ${JSON.stringify(data)}`);
    } else if (command === 'list') {
      // List all tasks
      const res = await fetch(`${API_URL}/api/tasks`);

      const tasks = (await res.json()) as [];

      if (tasks.length === 0) {
        console.info('No tasks scheduled');
      } else {
        console.info(JSON.stringify(tasks));
      }
    } else if (command === 'logs') {
      // List all logs
      const res = await fetch(`${API_URL}/api/logs`);

      const logs = (await res.json()) as [];

      if (logs.length === 0) {
        console.info('No logs available');
      } else {
        console.info(JSON.stringify(logs));
      }
    } else {
      console.log(`
        Cronify CLI Usage:
        cronify add --cmd "<command>" --schedule "<cron-schedule || ISO-8601-date || @once>"
        cronify delete --cmd <id>
        cronify list
        cronify logs
        cronify daemon   (Starts the background process)
        `);
    }
  } catch (error: any) {
    if (error?.cause?.code === 'ECONNREFUSED') {
      console.error(
        `❌ Could not connect to Cronify daemon at ${API_URL}. Is it running?`,
      );
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}
