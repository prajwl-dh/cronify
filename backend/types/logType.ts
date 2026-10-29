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
};
