import { parseArgs } from "util";

import { updateCronify } from "../os/update";
import { addCommand } from "./commands/add";
import { changeCommand } from "./commands/change";
import { configCommand } from "./commands/config";
import { deleteCommand } from "./commands/delete";
import { editCommand } from "./commands/edit";
import { healthCommand } from "./commands/health";
import { installCommand } from "./commands/install";
import { listCommand } from "./commands/list";
import { logCommand } from "./commands/log";
import { logsCommand } from "./commands/logs";
import { pauseCommand } from "./commands/pause";
import { resumeCommand } from "./commands/resume";
import { runCommand } from "./commands/run";
import { startCommand } from "./commands/start";
import { statsCommand } from "./commands/stats";
import { stopCommand } from "./commands/stop";
import { uninstallCommand } from "./commands/uninstall";
import { validateCommand } from "./commands/validate";
import { versionCommand } from "./commands/version";
import { getConfig } from "./lib/config";

/**
 * CLI entry handler
 * Parses arguments and routes execution to the correct command module.
 */
export async function runCli(args: string[]) {
  const { positionals, values: rawValues } = parseArgs({
    args,
    options: {
      name: { type: "string", short: "n" },
      cmd: { type: "string", short: "c" },
      command: { type: "string" },
      schedule: { type: "string", short: "s" },
      id: { type: "string", short: "i" },
      port: { type: "string", short: "p" },
      timeout: { type: "string", short: "t" },
      retries: { type: "string", short: "r" },
      retention: { type: "string" },
      status: { type: "string" },
      search: { type: "string" },
      limit: { type: "string" },
      json: { type: "boolean" },
      all: { type: "boolean" },
      confirm: { type: "boolean" },
      full: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
    allowPositionals: true,
    strict: false,
  });

  // parseArgs with `strict: false` widens values to `string | boolean | undefined`.
  // Each command validates the fields it actually needs, so narrow once here.
  const values = rawValues as any;
  const command = positionals[0];

  try {
    switch (command) {
      case "web": {
        startCommand();
        console.info(`Dashboard: http://127.0.0.1:${getConfig().port}`);
        return;
      }

      case "add":
        return await addCommand(values);

      case "edit":
        return await editCommand(values);

      case "run":
        return await runCommand(values);

      case "pause":
        return await pauseCommand(values);

      case "resume":
        return await resumeCommand(values);

      case "delete":
        return await deleteCommand(values);

      case "list":
        return await listCommand(values);

      case "logs":
        return await logsCommand(values);

      case "log":
        return await logCommand(values);

      case "stats":
        return await statsCommand(values);

      case "validate":
        return await validateCommand(values);

      case "config":
        return await configCommand(values);

      case "install":
        return installCommand();

      case "uninstall":
        return await uninstallCommand(values);

      case "start":
        return startCommand();

      case "stop":
        return stopCommand();

      case "change":
        return changeCommand(values);

      case "health":
        return await healthCommand(values);

      case "version":
        return versionCommand();

      case "update":
        return updateCronify();

      default:
        printHelp();
    }
  } catch (error: any) {
    if (error?.cause?.code === "ECONNREFUSED") {
      console.error(
        "Looks like the daemon is not running. Start it first by running: cronify start",
      );
    } else {
      console.error(
        `Error message: ${error.message}

Looks like the daemon is not running. Start it first by running: cronify start
`,
      );
    }
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`
Cronify — a local task scheduler with a web dashboard.

Tasks
  cronify add --name "<name>" --cmd "<command>" --schedule "<cron|@once|ISO>"
      [--timeout <seconds>] [--retries <0-10>]
  cronify list [--status <status>] [--search <text>] [--limit <n>] [--json]
  cronify edit --id <id> [--name …] [--cmd …] [--schedule …] [--timeout …] [--retries …]
  cronify run --id <id> | --all
  cronify pause --id <id>
  cronify resume --id <id>
  cronify delete --id <id>
  cronify validate --schedule "<cron|@once|ISO>"

History
  cronify logs [--id <task_id>] [--status success|error] [--limit <n>] [--json]
  cronify log --id <task_id>              Logs for one task (alias)
  cronify stats [--json]                  Daemon health and last 24 hours

Daemon
  cronify web                             Start the daemon and print the dashboard URL
  cronify start                           Start the background daemon
  cronify stop                            Stop the background daemon
  cronify health [--json]                 Check daemon, database and scheduler
  cronify config [--timeout <s>] [--retention <days>] [--port <port>] [--json]
  cronify change --port <port>            Change the port and restart the daemon
  cronify version                         Show the installed version

Maintenance
  cronify install                         Install the OS service hook
  cronify update                          Update from the latest GitHub release
  cronify uninstall --confirm [--full]    Remove Cronify (--full deletes user data)
`);
}
