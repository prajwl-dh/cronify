import { CronExpressionParser } from "cron-parser";

export type ScheduleKind = "once" | "date" | "cron";

export type ParsedSchedule =
  | {
      ok: true;
      input: string;
      kind: ScheduleKind;
      nextRun: number;
    }
  | {
      ok: false;
      input: string;
      error: string;
    };

/**
 * Parses every schedule format Cronify accepts: a cron expression,
 * `@once`, or an ISO 8601 timestamp. The first future (or given) run
 * is returned as a millisecond timestamp.
 */
export function parseSchedule(
  input: string,
  from = new Date(),
): ParsedSchedule {
  const value = (input || "").trim();

  if (!value) {
    return { ok: false, input: value, error: "Schedule is required" };
  }

  if (value === "@once") {
    return { ok: true, input: value, kind: "once", nextRun: from.getTime() };
  }

  try {
    const interval = CronExpressionParser.parse(value, { currentDate: from });
    return {
      ok: true,
      input: value,
      kind: "cron",
      nextRun: interval.next().getTime(),
    };
  } catch {
    // Not a cron expression — fall through to date parsing.
  }

  const parsedDate = Date.parse(value);

  if (!Number.isNaN(parsedDate)) {
    return { ok: true, input: value, kind: "date", nextRun: parsedDate };
  }

  return {
    ok: false,
    input: value,
    error: "Invalid cron expression or date. Use cron, @once, or ISO 8601.",
  };
}

/**
 * Returns the next N run timestamps for a schedule. Invalid input
 * returns an empty list.
 */
export function previewSchedule(input: string, count = 5, from = new Date()) {
  const parsed = parseSchedule(input, from);

  if (!parsed.ok) return [];

  if (parsed.kind !== "cron") return [parsed.nextRun];

  const runs: number[] = [];

  try {
    const interval = CronExpressionParser.parse(parsed.input, {
      currentDate: from,
    });

    for (let i = 0; i < count; i++) {
      runs.push(interval.next().getTime());
    }
  } catch {
    return [parsed.nextRun];
  }

  return runs;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(value: string) {
  return value.padStart(2, "0");
}

function clock(hour: number, minute: number) {
  return `${pad(String(hour))}:${pad(String(minute))}`;
}

/**
 * A short human description for the common cron patterns. Anything
 * unusual falls back to the expression itself, which is still useful.
 */
export function describeSchedule(input: string): string {
  const value = (input || "").trim();

  if (value === "@once") return "Once, immediately";

  const parsed = parseSchedule(value);

  if (!parsed.ok) return value || "No schedule";

  if (parsed.kind === "date") {
    return "Once at the chosen time";
  }

  if (parsed.kind === "once") return "Once, immediately";

  const parts = value.split(/\s+/);

  if (parts.length < 5) return value;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts as [
    string,
    string,
    string,
    string,
    string,
  ];

  const everyStar = [dayOfMonth, month, dayOfWeek].every((p) => p === "*");
  const minuteStep = /^\*\/(\d+)$/.exec(minute);
  const hourStep = /^\*\/(\d+)$/.exec(hour);

  if (minute === "*" && hour === "*" && everyStar) return "Every minute";

  if (minuteStep && hour === "*" && everyStar) {
    return `Every ${minuteStep[1]} minutes`;
  }

  if (minute === "0" && hour === "*" && everyStar)
    return "Every hour, on the hour";

  if (/^\d+$/.test(minute) && hour === "*" && everyStar) {
    return `Every hour at :${pad(minute)}`;
  }

  if (hourStep && /^\d+$/.test(minute) && everyStar) {
    return `Every ${hourStep[1]} hours`;
  }

  if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) {
    const time = clock(Number(hour), Number(minute));

    if (dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
      return `Every day at ${time}`;
    }

    if (dayOfMonth === "*" && month === "*" && /^\d$/.test(dayOfWeek)) {
      return `Every ${DAY_NAMES[Number(dayOfWeek)] ?? `day ${dayOfWeek}`} at ${time}`;
    }

    if (/^\d+$/.test(dayOfMonth) && month === "*" && dayOfWeek === "*") {
      return `Monthly on day ${dayOfMonth} at ${time}`;
    }

    if (/^\d+$/.test(dayOfMonth) && /^\d+$/.test(month) && dayOfWeek === "*") {
      return `Every ${MONTH_NAMES[Number(month) - 1] ?? `month ${month}`} ${dayOfMonth} at ${time}`;
    }
  }

  return value;
}
