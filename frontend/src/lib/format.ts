import type { TaskStatus } from "../api/types";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const numberFormatter = new Intl.NumberFormat();

export function formatNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDuration(ms: number | null | undefined) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1) return "0 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;

  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatDateTime(timestamp: number | null | undefined) {
  if (!timestamp) return "—";
  return dateTimeFormatter.format(timestamp);
}

export function formatDate(timestamp: number | null | undefined) {
  if (!timestamp) return "—";
  return dateFormatter.format(timestamp);
}

export function formatTime(timestamp: number | null | undefined) {
  if (!timestamp) return "—";
  return timeFormatter.format(timestamp);
}

export function formatRelative(
  timestamp: number | null | undefined,
  now = Date.now(),
) {
  if (!timestamp) return "—";

  const difference = timestamp - now;
  const absolute = Math.abs(difference);

  if (absolute < 5_000) return "just now";

  const future = difference > 0;

  let value: string;

  if (absolute < 60_000) {
    value = `${Math.round(absolute / 1000)}s`;
  } else if (absolute < 3_600_000) {
    value = `${Math.round(absolute / 60_000)}m`;
  } else if (absolute < 86_400_000) {
    const hours = Math.floor(absolute / 3_600_000);
    const minutes = Math.round((absolute % 3_600_000) / 60_000);
    value = minutes > 0 && hours < 6 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(absolute / 86_400_000);
    value = `${days}d`;
  }

  return future ? `in ${value}` : `${value} ago`;
}

export function formatCountdown(
  timestamp: number | null | undefined,
  now: number,
) {
  if (!timestamp) return "—";

  const difference = timestamp - now;
  if (difference <= 0) return "due now";

  if (difference < 3_600_000) {
    const totalSeconds = Math.ceil(difference / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  if (difference < 86_400_000) {
    const hours = Math.floor(difference / 3_600_000);
    const minutes = Math.round((difference % 3_600_000) / 60_000);
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${Math.floor(difference / 86_400_000)}d`;
}

export function formatUptime(ms: number) {
  return formatDuration(ms);
}

export const statusMeta: Record<
  TaskStatus,
  { label: string; tone: "neutral" | "positive" | "warning" | "muted" }
> = {
  inactive: { label: "Scheduled", tone: "neutral" },
  active: { label: "Running", tone: "positive" },
  paused: { label: "Paused", tone: "warning" },
  obsolete: { label: "Completed", tone: "muted" },
};

export function exitLabel(exitCode: number | null | undefined) {
  if (exitCode === null || exitCode === undefined) return "no exit code";
  return `exit ${exitCode}`;
}

export function logResult(log: { exit_code: number | null }) {
  return log.exit_code === 0 ? "Succeeded" : "Failed";
}

export function triggerLabel(trigger: string) {
  if (trigger === "manual") return "Manual";
  if (trigger === "bulk") return "Bulk";
  return "Schedule";
}
