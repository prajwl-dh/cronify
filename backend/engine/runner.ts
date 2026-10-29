import { Database } from "bun:sqlite";
import { initConfig } from "../config/config";
import type { LogTrigger } from "../types/logType";
import type { Task } from "../types/taskType";
import { logger } from "../utils/logger";

/** Tasks currently executing, used to prevent overlapping runs. */
const runningTasks = new Set<number>();

export function getRunningTaskIds(): number[] {
  return [...runningTasks];
}

export function isTaskRunning(taskId: number): boolean {
  return runningTasks.has(taskId);
}

type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a command in the user's shell, optionally killing it after a
 * timeout. A killed process is reported with exit code 124.
 */
async function runCommand(
  command: string,
  timeoutMs: number,
): Promise<CommandResult> {
  const isWindows = process.platform === "win32";
  const shell = isWindows ? "cmd.exe" : process.env.SHELL || "/bin/zsh";
  const shellArgs = isWindows ? ["/c"] : ["-ilc"];

  let stdoutText = "";
  let stderrText = "";
  let exitCode: number | null = null;
  let timedOut = false;

  try {
    const proc = Bun.spawn([shell, ...shellArgs, command], {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        TERM: "xterm-256color",
      },
    });

    const timeout =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            proc.kill();
          }, timeoutMs)
        : null;

    const [out, err, code] = await Promise.all([
      proc.stdout ? new Response(proc.stdout).text() : Promise.resolve(""),
      proc.stderr ? new Response(proc.stderr).text() : Promise.resolve(""),
      proc.exited,
    ]);

    if (timeout) clearTimeout(timeout);

    stdoutText = out;
    stderrText = err;
    exitCode = code;

    if (timedOut) {
      exitCode = 124;
      stderrText =
        `${stderrText}\n[cronify] Command timed out after ${timeoutMs} ms and was terminated.`.trim();
    }
  } catch (error: any) {
    stderrText = error?.message || "Unknown spawn error";
    exitCode = -1;
  }

  return {
    stdout: stdoutText.trim(),
    stderr: stderrText.trim(),
    exitCode: exitCode ?? -1,
  };
}

/**
 * Executes a task command, retrying when configured, then stores the
 * execution result and updates the task's denormalized statistics.
 *
 * A task never runs twice at the same time; a second trigger while it
 * is already running is skipped.
 */
export async function executeTask(
  db: Database,
  task: Task,
  trigger: LogTrigger = "schedule",
): Promise<boolean> {
  if (runningTasks.has(task.id)) {
    logger.warn(
      `Task ${task.id} is already running; skipped another ${trigger} trigger.`,
    );
    return false;
  }

  runningTasks.add(task.id);

  const startedAt = Date.now();
  const config = initConfig();
  const timeoutMs = task.timeout_ms ?? config.defaultTimeoutMs ?? 0;
  const maxRetries = Math.max(0, task.max_retries ?? 0);

  let result: CommandResult = { stdout: "", stderr: "", exitCode: -1 };
  let attempt = 0;

  try {
    for (attempt = 1; attempt <= maxRetries + 1; attempt++) {
      result = await runCommand(task.command, timeoutMs);

      if (result.exitCode === 0 || attempt > maxRetries) break;

      logger.warn(
        `Task ${task.id} failed with exit code ${result.exitCode}; retrying (${attempt}/${maxRetries}).`,
      );

      await sleep(500 * attempt);
    }
  } finally {
    const finishedAt = Date.now();
    const durationMs = finishedAt - startedAt;
    const succeeded = result.exitCode === 0;

    try {
      db.transaction(() => {
        db.query(
          `
          INSERT INTO logs (
            task_id, executed_at, duration_ms, attempt, trigger, stdout, stderr, exit_code
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
        ).run(
          task.id,
          startedAt,
          durationMs,
          attempt,
          trigger,
          result.stdout,
          result.stderr,
          result.exitCode,
        );

        db.query(
          `
          UPDATE tasks
          SET
            status = CASE WHEN status = 'active' THEN 'inactive' ELSE status END,
            last_run_at = ?,
            last_exit_code = ?,
            last_duration_ms = ?,
            run_count = run_count + 1,
            success_count = success_count + ?,
            failure_count = failure_count + ?,
            updated_at = ?
          WHERE id = ?
          `,
        ).run(
          startedAt,
          result.exitCode,
          durationMs,
          succeeded ? 1 : 0,
          succeeded ? 0 : 1,
          finishedAt,
          task.id,
        );
      })();
    } catch (dbError) {
      logger.error(
        `❌ Failed to save log for task ${task.id}. Error: ${dbError}`,
      );
    }

    runningTasks.delete(task.id);

    if (succeeded) {
      logger.info(
        `✅ Task ${task.id} (${task.name}) finished in ${durationMs} ms with exit code 0\n` +
          (result.stdout
            ? `--- STDOUT ---\n${result.stdout}`
            : "--- STDOUT ---\n<empty>"),
      );
    } else {
      logger.error(
        `❌ Task ${task.id} (${task.name}) failed in ${durationMs} ms with exit code ${result.exitCode}\n` +
          (result.stdout ? `--- STDOUT ---\n${result.stdout}\n` : "") +
          (result.stderr
            ? `--- STDERR ---\n${result.stderr}`
            : "--- STDERR ---\n<no stderr>"),
      );
    }
  }

  return true;
}
