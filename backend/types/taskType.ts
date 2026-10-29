export type TaskStatus = "active" | "inactive" | "obsolete" | "paused";

export type Task = {
  id: number;
  name: string;
  command: string;
  cron_string: string;
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
  schedule_description?: string;
};

export type TaskWithRuntime = Task & {
  is_running?: boolean;
};
