import { Database } from 'bun:sqlite';
import type { Task } from '../db/schema';
import { logger } from '../utils/logger';

export async function executeTask(db: Database, task: Task) {
  const executedAt = Date.now();

  // Check platform and shell
  const isWindows = process.platform === 'win32';

  const shell = isWindows ? 'cmd.exe' : process.env.SHELL || '/bin/zsh';

  const shellArgs = isWindows ? ['/c'] : ['-ilc'];

  let stdoutText = '';
  let stderrText = '';
  let exitCode: number | null = null;

  try {
    // Run the command
    const proc = Bun.spawn([shell, ...shellArgs, task.command], {
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
    });

    if (proc.stdout) stdoutText = await new Response(proc.stdout).text();
    if (proc.stderr) stderrText = await new Response(proc.stderr).text();

    exitCode = await proc.exited;
  } catch (error: any) {
    stderrText = error.message || 'Unknown spawn error';
    exitCode = -1;
  } finally {
    // Mark the task as inactive so that it can re-run again
    db.query(
      `
              UPDATE tasks
              SET status = 'inactive'
              WHERE id = ? AND status = 'active'`,
    ).run(task.id);

    // Log the result into logs table
    try {
      db.query(
        `
                INSERT INTO logs (task_id, executed_at, stdout, stderr, exit_code)
                VALUES (?, ?, ?, ?, ?)
            `,
      ).run(
        task.id,
        executedAt,
        stdoutText.trim(),
        stderrText.trim(),
        exitCode,
      );

      logger.info(`Executing task ${task.id}: ${task.command}`);
      if (exitCode === 0) {
        logger.info(
          `✅ Task ${task.id}: ${task.command} , finished successfully (exit code ${exitCode})\n` +
            (stdoutText
              ? `--- STDOUT ---\n${stdoutText}`
              : '--- STDOUT ---\n<empty>'),
        );
      } else {
        logger.error(
          `❌ Task ${task.id}: ${task.command} , failed (exit code ${exitCode})\n` +
            (stdoutText ? `--- STDOUT ---\n${stdoutText}\n` : '') +
            (stderrText ? `--- STDERR ---\n${stderrText}` : '<no stderr>'),
        );
      }
    } catch (dbError) {
      logger.error(
        `❌ Failed to save log for task ${task.id}. Error: ${dbError}`,
      );
    }
  }
}
