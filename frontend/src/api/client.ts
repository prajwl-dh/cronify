import type {
  Config,
  ConfigResponse,
  Health,
  Log,
  LogsResponse,
  Overview,
  ScheduleValidation,
  Task,
  TaskInput,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export type LogQuery = {
  page?: number;
  limit?: number;
  taskId?: number | null;
  status?: "all" | "success" | "error";
  timeRange?: "all" | "1h" | "24h" | "7d" | "30d";
  search?: string;
};

export const api = {
  overview: () => request<Overview>("/api/overview"),

  tasks: () => request<Task[]>("/api/tasks"),

  task: (id: number) =>
    request<{ task: Task; logs: Log[] }>(`/api/tasks/${id}`),

  createTask: (input: TaskInput) =>
    post<{ success: boolean; id: number; task: Task }>("/api/tasks", input),

  updateTask: (id: number, input: Partial<TaskInput>) =>
    post<{ success: boolean; task: Task }>(`/api/tasks/${id}`, input),

  deleteTask: (id: number) =>
    request<{ success: boolean; deletedId: number }>(`/api/tasks/${id}`, {
      method: "DELETE",
    }),

  runTask: (id: number) =>
    post<{ success: boolean; running: boolean; message: string }>(
      `/api/tasks/${id}/run`,
      {},
    ),

  setTaskStatus: (id: number, desired: "paused" | "inactive") =>
    post<{ success: boolean; status: string; message: string }>(
      `/api/tasks/${id}/${desired === "paused" ? "pause" : "resume"}`,
      {},
    ),

  bulk: (action: "run" | "pause" | "resume" | "delete", ids: number[]) =>
    post<{
      success: boolean;
      action: string;
      affected: number;
      skipped?: number;
    }>("/api/tasks/bulk", { action, ids }),

  validateSchedule: (schedule: string) =>
    post<ScheduleValidation>("/api/schedule/validate", { schedule }),

  logs: (query: LogQuery = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(query.page ?? 1));
    params.set("limit", String(query.limit ?? 20));
    params.set("compact", "1");

    if (query.taskId) params.set("task_id", String(query.taskId));
    if (query.status && query.status !== "all") {
      params.set("status", query.status);
    }
    if (query.timeRange && query.timeRange !== "all") {
      params.set("timeRange", query.timeRange);
    }
    if (query.search?.trim()) params.set("search", query.search.trim());

    return request<LogsResponse>(`/api/logs?${params.toString()}`);
  },

  logDetail: (id: number) => request<Log>(`/api/logs/detail/${id}`),

  clearLogs: (taskId?: number | null) =>
    request<{ success: boolean; deleted: number; message: string }>(
      taskId ? `/api/logs/${taskId}` : "/api/logs",
      { method: "DELETE" },
    ),

  config: () => request<ConfigResponse>("/api/config"),

  updateConfig: (patch: Partial<Config>) =>
    request<ConfigResponse>("/api/config", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  health: () => request<Health>("/api/health"),
};
