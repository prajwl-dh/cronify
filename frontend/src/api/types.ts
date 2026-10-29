export type TaskStatus = "active" | "inactive" | "obsolete" | "paused";

export type Task = {
  id: number;
  name: string;
  command: string;
  cron_string: string;
  schedule_description?: string;
  next_run: number;
  status: TaskStatus;
  timeout_ms: number | null;
  max_retries: number;
  last_run_at: number | null;
  last_exit_code: number | null;
  last_duration_ms: number | null;
  run_count: number;
  success_count: number;
  failure_count: number;
  created_at: number;
  updated_at: number;
  is_running?: boolean;
  link_count?: number;
};

export type LogTrigger = "schedule" | "manual" | "bulk";

export type Log = {
  id: number;
  task_id: number;
  executed_at: number;
  duration_ms: number | null;
  attempt: number;
  trigger: LogTrigger;
  stdout: string | null;
  stderr: string | null;
  exit_code: number | null;
  task_name?: string;
  task_command?: string;
  has_output?: boolean;
};

export type HourBucket = {
  start: number;
  label: string;
  runs: number;
  failures: number;
};

export type Overview = {
  generatedAt: number;
  windowStart: number;
  windowHours: number;
  counts: {
    total: number;
    scheduled: number;
    paused: number;
    completed: number;
    running: number;
  };
  runningTaskIds: number[];
  runs: {
    total: number;
    success: number;
    failure: number;
    successRate: number | null;
    averageDurationMs: number | null;
  };
  hourly: HourBucket[];
  nextRun: Task | null;
  upcoming: Task[];
  recent: Log[];
  failures: Log[];
  daemon: DaemonInfo;
};

export type DaemonInfo = {
  version: string;
  port: number;
  uptimeMs: number;
  startedAt: number;
  pid: number;
  dataDir: string;
  defaultTimeoutMs: number;
  logRetentionDays: number;
};

export type LogsSummary = {
  total: number;
  success: number;
  failure: number;
  averageDurationMs: number | null;
};

export type LogsResponse = {
  logs: Log[];
  summary: LogsSummary;
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

export type Config = {
  port: number;
  defaultTimeoutMs: number;
  logRetentionDays: number;
};

export type ConfigResponse = {
  config: Config;
  purged?: number;
  restartRequired?: boolean;
};

export type Health = {
  daemonStatus: string;
  version: string;
  timestamp: string;
  uptimeMs: number;
  port: number;
  pid: number;
  database: string;
  taskCount: number;
  runningTasks: number;
};

export type ScheduleValidation = {
  valid: boolean;
  schedule: string;
  kind?: "once" | "date" | "cron";
  description?: string;
  nextRuns: number[];
  error?: string;
};

export type TaskInput = {
  name: string;
  command: string;
  schedule: string;
  timeoutMs: number | null;
  maxRetries: number;
};
