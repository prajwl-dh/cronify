import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import type { Task, TaskStatus } from "../api/types";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  Pill,
  Select,
  Skeleton,
} from "../components/ui";
import {
  formatDateTime,
  formatRelative,
  formatTime,
  statusMeta,
} from "../lib/format";
import { useNow } from "../lib/route";
import { useToast } from "../lib/toast";

type Tab = "all" | TaskStatus;
type Sort = "next" | "name" | "last_run" | "runs";
type BulkAction = "run" | "pause" | "resume" | "delete";

const tabs: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "inactive", label: "Scheduled" },
  { id: "active", label: "Running" },
  { id: "paused", label: "Paused" },
  { id: "obsolete", label: "Completed" },
];

function sortTasks(tasks: Task[], sort: Sort) {
  return [...tasks].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "runs") return b.run_count - a.run_count;
    if (sort === "last_run") {
      return (b.last_run_at ?? 0) - (a.last_run_at ?? 0);
    }
    return a.next_run - b.next_run;
  });
}

function LoadingTasks() {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Tasks</h1>
          <Skeleton className="skeleton-sub" />
        </div>
        <Skeleton className="skeleton-button" />
      </div>
      <div className="tabs">
        {tabs.map((tab) => (
          <span className="tab" key={tab.id}>
            {tab.label}
          </span>
        ))}
      </div>
      <div className="panel task-panel">
        <div className="task-table" role="table" aria-label="Tasks">
          {[0, 1, 2, 3, 4].map((row) => (
            <div className="task-row task-row-skeleton" key={row}>
              <Skeleton className="skeleton-check" />
              <Skeleton className="skeleton-task-name" />
              <Skeleton className="skeleton-line" />
              <Skeleton className="skeleton-pill" />
              <Skeleton className="skeleton-line short" />
              <Skeleton className="skeleton-line short" />
              <Skeleton className="skeleton-line" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function TasksPage({ onEdit }: { onEdit: (task: Task | null) => void }) {
  const queryClient = useQueryClient();
  const now = useNow(1000);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("next");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [bulkPending, setBulkPending] = useState<BulkAction | null>(null);
  const [rowPending, setRowPending] = useState<number | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: api.tasks,
    refetchInterval: 5_000,
  });

  const tasks = tasksQuery.data ?? [];

  const counts = useMemo(() => {
    const result: Record<Tab, number> = {
      all: tasks.length,
      active: 0,
      inactive: 0,
      obsolete: 0,
      paused: 0,
    };
    for (const task of tasks) result[task.status] += 1;
    return result;
  }, [tasks]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const visible = tasks.filter((task) => {
      if (tab !== "all" && task.status !== tab) return false;
      if (!term) return true;
      return (
        task.name.toLowerCase().includes(term) ||
        task.command.toLowerCase().includes(term) ||
        task.cron_string.toLowerCase().includes(term)
      );
    });
    return sortTasks(visible, sort);
  }, [tasks, tab, search, sort]);

  useEffect(() => {
    setSelected((current) => {
      if (current.size === 0) return current;
      const existing = new Set(tasks.map((task) => task.id));
      const next = new Set([...current].filter((id) => existing.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [tasks]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selected.size > 0 && selected.size < filtered.length;
    }
  }, [selected, filtered.length]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["overview"] });
    queryClient.invalidateQueries({ queryKey: ["logs"] });
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteTask(id),
    onSuccess: () => {
      toast("Task deleted.", "success");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }: { action: BulkAction; ids: number[] }) =>
      api.bulk(action, ids),
    onSuccess: (result, variables) => {
      const noun = result.affected === 1 ? "task" : "tasks";
      const message =
        variables.action === "delete"
          ? `Deleted ${result.affected} ${noun}.`
          : `${result.action[0].toUpperCase()}${result.action.slice(1)} applied to ${result.affected} ${noun}.`;
      toast(message, "success");
      setBulkPending(null);
      setBulkDelete(false);
      setSelected(new Set());
      invalidate();
    },
    onError: (error: Error) => {
      setBulkPending(null);
      toast(error.message, "error");
    },
  });

  async function runTask(task: Task) {
    setRowPending(task.id);
    try {
      await api.runTask(task.id);
      toast(`Run started for ${task.name}.`, "success");
      invalidate();
    } catch (error) {
      toast((error as Error).message, "error");
    } finally {
      setRowPending(null);
    }
  }

  async function toggleTask(task: Task) {
    const desired = task.status === "paused" ? "inactive" : "paused";
    setRowPending(task.id);
    try {
      await api.setTaskStatus(task.id, desired);
      toast(
        desired === "paused" ? `${task.name} paused.` : `${task.name} resumed.`,
        "success",
      );
      invalidate();
    } catch (error) {
      toast((error as Error).message, "error");
    } finally {
      setRowPending(null);
    }
  }

  function toggleSelected(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((task) => task.id)));
    }
  }

  if (tasksQuery.isPending) return <LoadingTasks />;

  if (tasksQuery.isError) {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>Tasks</h1>
            <p className="sub">The task list could not be loaded.</p>
          </div>
        </div>
        <div className="panel">
          <ErrorState
            message={tasksQuery.error.message}
            onRetry={() => tasksQuery.refetch()}
          />
        </div>
      </>
    );
  }

  const selectedIds = [...selected];
  const allSelected = selected.size > 0 && selected.size === filtered.length;

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Tasks</h1>
          <p className="sub">
            Commands this daemon runs on a schedule, and the state of each one.
          </p>
        </div>
        <div className="title-actions">
          <span className="stamp">
            Updated{" "}
            <span className="mono">{formatTime(tasksQuery.dataUpdatedAt)}</span>
          </span>
          <IconButton
            label="Refresh tasks"
            onClick={() => tasksQuery.refetch()}
          >
            <RefreshCw
              size={14}
              className={tasksQuery.isFetching ? "spin" : undefined}
            />
          </IconButton>
          <Button
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => onEdit(null)}
          >
            New task
          </Button>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Task status">
        {tabs.map((item) => (
          <button
            type="button"
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            className="tab"
            onClick={() => {
              setTab(item.id);
              setSelected(new Set());
            }}
          >
            <span>{item.label}</span>
            <span className="tab-count num">{counts[item.id]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-field">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search names, commands, schedules"
              aria-label="Search tasks"
            />
          </div>
          <Select
            className="sort-select"
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            aria-label="Sort tasks"
          >
            <option value="next">Next run</option>
            <option value="name">Name</option>
            <option value="last_run">Last run</option>
            <option value="runs">Most runs</option>
          </Select>
        </div>
        <span className="toolbar-count">
          <span className="mono">{filtered.length}</span> of{" "}
          <span className="mono">{tasks.length}</span>{" "}
          {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {selected.size > 0 ? (
        <div className="bulk-bar" role="region" aria-label="Bulk actions">
          <span className="bulk-count">
            <span className="mono">{selected.size}</span> selected
          </span>
          <div className="bulk-actions">
            <Button
              size="sm"
              variant="ghost"
              icon={<Play size={13} />}
              loading={bulkPending === "run"}
              onClick={() =>
                bulkMutation.mutate({ action: "run", ids: selectedIds })
              }
            >
              Run now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Pause size={13} />}
              loading={bulkPending === "pause"}
              onClick={() =>
                bulkMutation.mutate({ action: "pause", ids: selectedIds })
              }
            >
              Pause
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw size={13} />}
              loading={bulkPending === "resume"}
              onClick={() =>
                bulkMutation.mutate({ action: "resume", ids: selectedIds })
              }
            >
              Resume
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 size={13} />}
              onClick={() => setBulkDelete(true)}
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <div className="panel task-panel">
        {filtered.length === 0 ? (
          <EmptyState
            title={
              tasks.length === 0 ? "No tasks yet" : "No tasks match this view"
            }
            action={
              tasks.length === 0 ? (
                <Button
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => onEdit(null)}
                >
                  Create a task
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTab("all");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          >
            {tasks.length === 0
              ? "A task is a command plus a schedule. Add one and Cronify will run it in the background."
              : "Try a different status, or search by name, command or cron expression."}
          </EmptyState>
        ) : (
          <div className="task-table" role="table" aria-label="Tasks">
            <div className="task-head" role="row">
              <span className="check-cell">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all visible tasks"
                />
              </span>
              <span role="columnheader">Task</span>
              <span role="columnheader" className="col-schedule">
                Schedule
              </span>
              <span role="columnheader" className="col-status">
                Status
              </span>
              <span role="columnheader" className="col-next">
                Next run
              </span>
              <span role="columnheader" className="col-last">
                Last run
              </span>
              <span role="columnheader" className="num col-runs">
                Runs
              </span>
              <span role="columnheader" className="actions-head">
                <span className="sr-only">Actions</span>
              </span>
            </div>

            {filtered.map((task) => {
              const meta = statusMeta[task.status];
              const isBusy = rowPending === task.id;
              const taskSelected = selected.has(task.id);

              return (
                <div
                  className={`task-row${taskSelected ? " task-row-selected" : ""}`}
                  role="row"
                  key={task.id}
                >
                  <span className="check-cell" role="cell">
                    <input
                      type="checkbox"
                      checked={taskSelected}
                      onChange={() => toggleSelected(task.id)}
                      aria-label={`Select ${task.name}`}
                    />
                  </span>

                  <span className="task-identity" role="cell">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onEdit(task)}
                    >
                      {task.name}
                    </button>
                    <span className="cell-sub mono" title={task.command}>
                      {task.command}
                    </span>
                  </span>

                  <span className="task-schedule" role="cell">
                    <span className="mono">{task.cron_string}</span>
                    <span className="cell-sub">
                      {task.schedule_description || "Custom schedule"}
                    </span>
                  </span>

                  <span className="task-status" role="cell">
                    <Pill tone={meta.tone}>{meta.label}</Pill>
                  </span>

                  <span className="task-when task-next" role="cell">
                    <span className="cell-label">Next run</span>
                    <span className="mono">
                      {task.status === "obsolete"
                        ? "—"
                        : formatRelative(task.next_run, now)}
                    </span>
                    <span className="cell-sub">
                      {task.status === "obsolete"
                        ? "finished"
                        : formatDateTime(task.next_run)}
                    </span>
                  </span>

                  <span className="task-when task-last" role="cell">
                    <span className="cell-label">Last run</span>
                    {task.last_run_at ? (
                      <>
                        <span className="mono">
                          {formatRelative(task.last_run_at, now)}
                        </span>
                        <span className="cell-sub">
                          exit {task.last_exit_code ?? "—"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="dash">—</span>
                        <span className="cell-sub">never run</span>
                      </>
                    )}
                  </span>

                  <span className="task-runs num" role="cell">
                    <span className="cell-label">Runs</span>
                    <span className="mono">{task.run_count}</span>
                    <span className="cell-sub">{task.success_count} ok</span>
                  </span>

                  <span className="task-actions" role="cell">
                    <IconButton
                      label={`Run ${task.name} now`}
                      onClick={() => runTask(task)}
                      disabled={isBusy || task.status === "active"}
                    >
                      <Play size={14} />
                    </IconButton>

                    <Menu>
                      <MenuButton
                        className="icon-btn"
                        aria-label={`More actions for ${task.name}`}
                      >
                        <MoreHorizontal size={15} />
                      </MenuButton>
                      <MenuItems
                        className="menu"
                        anchor={{ to: "bottom end", gap: 6 }}
                      >
                        <MenuItem>
                          <button
                            type="button"
                            className="menu-item"
                            onClick={() => onEdit(task)}
                          >
                            <Pencil size={13} aria-hidden="true" />
                            Edit task
                          </button>
                        </MenuItem>
                        <MenuItem>
                          <a
                            className="menu-item"
                            href={`#/logs?task=${task.id}`}
                          >
                            <ScrollText size={13} aria-hidden="true" />
                            View logs
                          </a>
                        </MenuItem>
                        <MenuItem>
                          <button
                            type="button"
                            className="menu-item"
                            onClick={() => runTask(task)}
                            disabled={task.status === "active"}
                          >
                            <Play size={13} aria-hidden="true" />
                            Run now
                          </button>
                        </MenuItem>
                        {task.status !== "obsolete" ? (
                          <MenuItem>
                            <button
                              type="button"
                              className="menu-item"
                              onClick={() => toggleTask(task)}
                            >
                              {task.status === "paused" ? (
                                <RotateCcw size={13} aria-hidden="true" />
                              ) : (
                                <Pause size={13} aria-hidden="true" />
                              )}
                              {task.status === "paused" ? "Resume" : "Pause"}
                            </button>
                          </MenuItem>
                        ) : null}
                        <div className="menu-rule" />
                        <MenuItem>
                          <button
                            type="button"
                            className="menu-item menu-item-danger"
                            onClick={() => setDeleteTarget(task)}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                            Delete task
                          </button>
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="table-foot">
        <span>
          Cronify checks the schedule every second. Tasks never overlap: a
          trigger that arrives while a command is still running is skipped.
        </span>
      </p>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete task?"
        description={
          deleteTarget ? (
            <>
              <strong>{deleteTarget.name}</strong> and its{" "}
              <span className="mono">{deleteTarget.run_count}</span> execution{" "}
              {deleteTarget.run_count === 1 ? "log" : "logs"} will be removed.
              This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete task"
        busy={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      <ConfirmDialog
        open={bulkDelete}
        title={`Delete ${selected.size} ${selected.size === 1 ? "task" : "tasks"}?`}
        description="The selected tasks and all of their execution logs will be removed. This cannot be undone."
        confirmLabel="Delete tasks"
        busy={bulkMutation.isPending}
        onCancel={() => setBulkDelete(false)}
        onConfirm={() => {
          setBulkPending("delete");
          bulkMutation.mutate({ action: "delete", ids: selectedIds });
        }}
      />
    </>
  );
}
