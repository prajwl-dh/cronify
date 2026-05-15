export type Log = {
  id?: number;
  task_id?: number;
  executed_at?: number;
  stdout?: string | null;
  stderr?: string | null;
  exit_code?: number | null;
};
