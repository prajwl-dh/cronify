/**
 * Helpers for turning a process's raw stdout/stderr into clean, predictable
 * log fields.
 *
 * A task is considered successful only when it exits with code 0. Many tools
 * (Homebrew, curl, etc.) write progress information to stderr even when they
 * succeed, so we merge both streams and store the merged output in the field
 * that matches the outcome: stdout on success, stderr on failure.
 */

/**
 * Strips terminal control sequences from captured output. Interactive login
 * shells inject sequences such as iTerm2's OSC 1337 shell integration
 * (`ESC ] 1337;RemoteHost=... BEL`) before the command runs, and colour codes
 * are meaningless in stored logs. Only plain text should be persisted.
 */
export function sanitizeOutput(text: string): string {
  return (
    text
      // OSC sequences: ESC ] <payload> terminated by BEL or ST (ESC \)
      .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "")
      // CSI sequences: ESC [ <params> <final byte> (colours, cursor moves, ...)
      .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
      // Remaining two-character escapes (e.g. ESC ( B charset selection)
      .replace(/\x1b[@-Z\\-_]/g, "")
  );
}

/**
 * Merges stdout and stderr into a single field based on the exit code.
 * Every line of output ends up in stdout when the command succeeded and in
 * stderr when it failed, so consumers never have to reconcile two streams.
 */
export function routeOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
): { stdout: string; stderr: string } {
  const output = [stdout, stderr].filter(Boolean).join("\n").trim();

  return exitCode === 0
    ? { stdout: output, stderr: "" }
    : { stdout: "", stderr: output };
}
