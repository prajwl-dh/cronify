export type Task = {
  id: number;
  command: string;
  cron_string: string;
  next_run: number;
  status: 'active' | 'inactive' | 'obsolete';
  created_at: number;
  updated_at: number;
};
