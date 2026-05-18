# Cronify

Cronify is a modern standalone task scheduler built with Bun for Windows, macOS, and Linux.

It runs as a lightweight background daemon with a built-in Web UI, persistent execution logging, and a fast CLI interface all bundled into a single compiled binary with zero external dependencies after installation.

## Notable Features

- Single binary installation (no runtime dependencies)
- Cross-platform support
  - macOS (ARM64 + x64)
  - Linux (ARM64 + x64)
  - Windows (x64)

- Background daemon scheduler
- Built-in Web UI
- SQLite-based persistent storage
- Persistent stdout/stderr logging for all executions
- Auto-start on system boot/login
- Self-update support

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
