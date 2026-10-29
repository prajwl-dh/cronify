# Cronify

<p align="center">
  <img src="https://raw.githubusercontent.com/prajwl-dh/cronify/main/assets/tasks.png" alt="Tasks" width="49%" />
  <img src="https://raw.githubusercontent.com/prajwl-dh/cronify/main/assets/logs.png" alt="Logs" width="49%" />
</p>

Cronify is a modern standalone task scheduler built with Bun for Windows, macOS, and Linux.

It runs as a lightweight background daemon with a built-in Web UI, persistent execution logging, and a fast CLI interface all bundled into a single compiled binary with zero external dependencies after installation.

## Notable Features

- Single binary installation (no runtime dependencies)
- Cross-platform support
  - macOS (ARM64 + x64)
  - Linux (ARM64 + x64)
  - Windows (x64)

- Background daemon scheduler
- CLI commands as well as built-in Web UI
- SQLite-based persistent storage
- Persistent stdout/stderr logging for all executions
- Auto-start on system boot/login
- Self-update support

## Web Dashboard

Cronify ships a built-in monitoring dashboard served by the daemon at `http://127.0.0.1:2207` (or your configured port). It is a single-file app embedded in the binary, so there is nothing extra to install.

Screens:

- **Overview** — daemon health, 24-hour execution chart, success/failure counts, average duration, next-up countdown, and the most recent failures.
- **Tasks** — searchable, filterable, sortable task table with status tabs, bulk actions (run / pause / resume / delete), create/edit dialogs with a live schedule preview, run-now, and pause/resume toggles.
- **Logs** — paginated execution history with task, trigger, attempt, exit code, duration and output, plus filters and clear-all.
- **Settings** — daemon configuration (port, default timeout, log retention) with the same controls as `cronify config`.

The dashboard and CLI talk to the same daemon API, so every change made in one is reflected in the other.

# Installation

## macOS / Linux

Open **Terminal** and run:

```bash
curl -fsSL https://raw.githubusercontent.com/prajwl-dh/cronify/main/scripts/install.sh | bash
```

The installer will:

- Detect OS and architecture
- Download the correct binary from GitHub releases
- Install Cronify into `~/.local/bin`
- Add Cronify to your PATH
- Initialize the daemon automatically

## Windows

> ⚠️ Requires Administrator privileges

Open **Windows PowerShell as Administrator** and run:

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/prajwl-dh/cronify/main/scripts/install.ps1 | iex"
```

The installer will:

- Download latest Windows release
- Install Cronify into `%LOCALAPPDATA%\Cronify`
- Add Cronify to system PATH (user scope)
- Initialize daemon and startup hooks
  <br />
  <br />

# CLI Documentation

## Web

Returns the localhost url for cronify web dashboard.

| Command       | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `cronify web` | Returns the localhost url with port for cronify web dashboard |

```bash
cronify web
```

## Change Port

**Note:** Cronify’s default port is `2207`

This option changes the daemon’s port, including the web UI.

| Argument | Description     |
| -------- | --------------- |
| `--port` | New port number |

```bash
cronify change --port 2208
```

## Add Task

Creates a new scheduled task.

### Usage

| Argument     | Required | Description                                     |
| ------------ | -------- | ----------------------------------------------- |
| `--name`     | required | Name for the task                               |
| `--cmd`      | required | Command to execute                              |
| `--schedule` | required | Cron expression, `@once`, or ISO 8601 timestamp |

### Supported Schedule Formats

| Type                 | Example                     | Description                   |
| -------------------- | --------------------------- | ----------------------------- |
| Cron expression      | `*/5 * * * *`               | Repeating schedule            |
| One-time immediate   | `@once`                     | Executes immediately          |
| ISO 8601 with offset | `2026-05-20T15:30:00+05:30` | Executes at local time offset |

### Command

```bash
cronify add --name "Backup" --cmd "tar -czf backup.tar.gz ./data" --schedule "0 2 * * *"

cronify add --name "Run Once" --cmd "echo "Run Once"" --schedule "@once"

cronify add --name "Run Once At A Date" --cmd "echo "Run once at a date"" --schedule "2026-05-20T15:30:00+05:30"
```

## List Tasks

Lists all scheduled tasks.

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `cronify list` | Displays all tasks with status and next run time |

```bash
cronify list
```

## Delete Task

Deletes a task by ID.

| Argument | Description |
| -------- | ----------- |
| `--id`   | Task ID     |

```bash
cronify delete --id 1
```

## Logs (All Tasks)

Displays execution logs for all tasks.

| Command        | Description                  |
| -------------- | ---------------------------- |
| `cronify logs` | Shows full execution history |

```bash
cronify logs
```

## Logs (Single Task)

Displays logs for a specific task.

| Argument | Description |
| -------- | ----------- |
| `--id`   | Task ID     |

```bash
cronify log --id 1
```

## Edit Task

Updates an existing task's name, command, schedule, timeout or retries.

| Argument     | Description                                         |
| ------------ | --------------------------------------------------- |
| `--id`       | Task ID (required)                                  |
| `--name`     | New name                                            |
| `--cmd`      | New command                                         |
| `--schedule` | New cron expression, `@once`, or ISO 8601 timestamp |
| `--timeout`  | New timeout in seconds (`0` disables)               |
| `--retries`  | New retry count (0–10)                              |

```bash
cronify edit --id 1 --schedule "0 3 * * *"
cronify edit --id 1 --cmd "echo updated" --retries 3
```

## Pause Task

Pauses a scheduled task without deleting it.

| Argument | Description |
| -------- | ----------- |
| `--id`   | Task ID     |

```bash
cronify pause --id 1
```

## Resume Task

Resumes a paused task and recomputes its next run.

| Argument | Description |
| -------- | ----------- |
| `--id`   | Task ID     |

```bash
cronify resume --id 1
```

## Stats

Prints daemon health and the last 24 hours of execution (runs, success rate, failures, upcoming tasks).

| Argument | Description                    |
| -------- | ------------------------------ |
| `--json` | Print the raw overview as JSON |

```bash
cronify stats
cronify stats --json
```

## Validate Schedule

Checks a cron expression, `@once`, or ISO 8601 date and previews its next runs.

| Argument     | Description                     |
| ------------ | ------------------------------- |
| `--schedule` | Schedule to validate (required) |

```bash
cronify validate --schedule "0 2 * * *"
cronify validate --schedule "2026-05-20T15:30:00+05:30"
```

## Config

Shows or updates daemon preferences. Port changes need a daemon restart.

| Argument      | Description                           |
| ------------- | ------------------------------------- |
| `--port`      | Daemon port (1–65535)                 |
| `--timeout`   | Default task timeout in seconds       |
| `--retention` | Log retention in days (`0` = forever) |
| `--json`      | Print the raw config as JSON          |

```bash
cronify config
cronify config --timeout 120 --retention 30
```

## Health Check

Checks if the daemon is running properly.

```bash
cronify health
```

## Version

Shows installed Cronify version.

```bash
cronify version
```

## Start Daemon

Starts background scheduler.

```bash
cronify start
```

## Stop Daemon

Stops background scheduler.

```bash
cronify stop
```

## Update Cronify

Updates to latest GitHub release.

```bash
cronify update
```

## Uninstall (Keep Data)

Removes Cronify but preserves database, tasks and logs.

```bash
cronify uninstall --confirm
```

## Full Uninstall (Delete Everything)

Removes:

- Binary
- Database
- Logs
- Configs
- All tasks

```bash
cronify uninstall --confirm --full
```

## Help

Displays all available Cronify commands and usage information.

```bash
cronify help
```
