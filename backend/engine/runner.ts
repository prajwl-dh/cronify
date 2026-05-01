import { Database } from 'bun:sqlite';
import type { Task } from '../db/schema';

export async function executeTask(db: Database, task: Task) {
  const executedAt = Date.now();
  console.log(`Executing task ${task.id}: ${task.command}`);

  // Check platform and shell
  const isWindows = process.platform === 'win32';
  const shell = isWindows ? 'cmd.exe' : process.env.SHELL || 'bash';
  const shellArgs = isWindows ? ['/c'] : ['-i', '-c'];

  let stdoutText = '';
  let stderrText = '';
  let exitCode: number | null = null;

  try {
    // Run the command
    const proc = Bun.spawn([shell, ...shellArgs, task.command], {
      stdout: 'pipe',
      stderr: 'pipe',
      env: process.env,
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

      console.log(
        `✅ Task ${task.id} finished with exit code ${exitCode} \n\n${stdoutText}`,
      );
    } catch (dbError) {
      console.error(`❌ Failed to save log for task ${task.id}`, dbError);
    }
  }
}
