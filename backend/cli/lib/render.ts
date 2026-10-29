import type { Log, LogTrigger } from "../../types/logType";
import type { Task } from "../../types/taskType";

type Align = "left" | "right";

/**
 * Minimal ANSI helpers. They are skipped when output is not a TTY so
 * piping to a file or another command stays clean.
 */
const useColor = process.stdout.isTTY;

export const color = {
  dim: (text: string) => (useColor ? `\x1b[2m${text}\x1b[0m` : text),
  bold: (text: string) => (useColor ? `\x1b[1m${text}\x1b[0m` : text),
  green: (text: string) => (useColor ? `\x1b[32m${text}\x1b[0m` : text),
  red: (text: string) => (useColor ? `\x1b[31m${text}\x1b[0m` : text),
  yellow: (text: string) => (useColor ? `\x1b[33m${text}\x1b[0m` : text),
  cyan: (text: string) => (useColor ? `\x1b[36m${text}\x1b[0m` : text),
};

function visibleLength(value: string) {
  return value.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function pad(value: string, width: number, align: Align) {
  const gap = Math.max(0, width - visibleLength(value));
  return align === "right" ? " ".repeat(gap) + value : value + " ".repeat(gap);
}

/**
 * Prints a compact aligned table with a sentence-case header and a
 * single rule under it.
 */
export function table(
  headers: string[],
  rows: string[][],
  aligns: Align[] = [],
): string {
  const widths = headers.map((header, index) =>
    Math.max(
      visibleLength(header),
      ...rows.map((row) => visibleLength(row[index] ?? "")),
    ),
  );

  const headerLine = headers
    .map((header, index) =>
      pad(header, widths[index] ?? 0, aligns[index] ?? "left"),
    )
    .join("  ");

  const rule = widths.map((width) => "─".repeat(width)).join("  ");

  const body = rows
    .map((row) =>
      row
        .map((cell, index) =>
          pad(cell ?? "", widths[index] ?? 0, aligns[index] ?? "left"),
        )
        .join("  "),
    )
    .join("\n");

  return `${headerLine}\n${rule}${body ? `\n${body}` : ""}`;
}

export function formatTimestamp(value?: number | null, withSeconds = false) {
  if (!value) return "—";
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
  };
  return date.toLocaleString(undefined, options);
}

export function formatRelative(value?: number | null) {
  if (!value) return "never";

  const diff = value - Date.now();
  const abs = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let phrase: string;
  if (abs < minute) phrase = "less than a minute";
  else if (abs < hour) phrase = `${Math.round(abs / minute)} min`;
  else if (abs < day) phrase = `${Math.round(abs / hour)} h`;
  else phrase = `${Math.round(abs / day)} d`;

  return diff >= 0 ? `in ${phrase}` : `${phrase} ago`;
}

export function formatDuration(value?: number | null) {
  if (value === null || value === undefined) return "—";
  if (value < 1000) return `${Math.round(value)} ms`;
  if (value < 60_000) return `${(value / 1000).toFixed(1)} s`;
  const minutes = Math.floor(value / 60_000);
  const seconds = Math.round((value % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export function statusLabel(task: Task) {
  if (task.status === "inactive") return color.green("Scheduled");
  if (task.status === "paused") return color.yellow("Paused");
  if (task.status === "active") return color.cyan("Running");
  return color.dim("Completed");
}

export function successLabel(exitCode?: number | null) {
  if (exitCode === 0) return color.green("success");
  return color.red(`exit ${exitCode ?? "?"}`);
}

export function triggerLabel(trigger?: LogTrigger) {
  if (trigger === "manual") return "manual";
  if (trigger === "bulk") return "bulk";
  return "schedule";
}

export function printTaskList(tasks: Task[]) {
  if (tasks.length === 0) {
    console.info(
      "No tasks scheduled. Add one with: cronify add --name … --cmd … --schedule …",
    );
    return;
  }

  const rows = tasks.map((task) => [
    String(task.id),
    task.name,
    task.cron_string,
    statusLabel(task),
    formatTimestamp(task.next_run),
    formatRelative(task.last_run_at),
    `${task.run_count} run${task.run_count === 1 ? "" : "s"} · ${task.success_count} ok`,
  ]);

  console.info(
    table(
      ["ID", "Name", "Schedule", "Status", "Next run", "Last run", "History"],
      rows,
      ["right", "left", "left", "left", "left", "left", "left"],
    ),
  );
  console.info(
    color.dim(`\n${tasks.length} task${tasks.length === 1 ? "" : "s"}`),
  );
}

export function printLogList(logs: Log[]) {
  if (logs.length === 0) {
    console.info("No execution logs yet.");
    return;
  }

  const rows = logs.map((log) => [
    String(log.id),
    log.task_name || `Task ${log.task_id}`,
    formatTimestamp(log.executed_at, true),
    successLabel(log.exit_code),
    formatDuration(log.duration_ms),
    triggerLabel(log.trigger),
  ]);

  console.info(
    table(["ID", "Task", "Executed", "Result", "Duration", "Trigger"], rows, [
      "right",
      "left",
      "left",
      "left",
      "right",
      "left",
    ]),
  );
  console.info(
    color.dim(`\n${logs.length} execution${logs.length === 1 ? "" : "s"}`),
  );
}

export function printTask(task: Task) {
  console.info(`${color.bold(task.name)} ${color.dim(`#${task.id}`)}`);
  console.info(`  command   ${task.command}`);
  console.info(`  schedule  ${task.cron_string}`);
  console.info(`  status    ${statusLabel(task)}`);
  console.info(
    `  next run  ${formatTimestamp(task.next_run)} (${formatRelative(task.next_run)})`,
  );
  console.info(
    `  last run  ${formatTimestamp(task.last_run_at)} · ${successLabel(task.last_exit_code)} · ${formatDuration(task.last_duration_ms)}`,
  );
  console.info(
    `  history   ${task.run_count} runs · ${task.success_count} succeeded · ${task.failure_count} failed`,
  );
  console.info(
    `  limits    ${task.timeout_ms ? `${Math.round(task.timeout_ms / 1000)}s timeout` : "no timeout"} · ${task.max_retries} retr${task.max_retries === 1 ? "y" : "ies"}`,
  );
}
