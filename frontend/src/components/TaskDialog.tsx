import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { api } from "../api/client";
import type { Task, TaskInput } from "../api/types";
import { formatDateTime, formatRelative } from "../lib/format";
import { useDebounced, useNow } from "../lib/route";
import { useToast } from "../lib/toast";
import { Button, Dropdown, Field, IconButton, TextInput } from "./ui";

const presets = [
  { label: "Every 5 min", value: "*/5 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Weekdays 09:00", value: "0 9 * * 1-5" },
  { label: "Daily 02:00", value: "0 2 * * *" },
  { label: "Once", value: "@once" },
];

type FormState = {
  name: string;
  command: string;
  schedule: string;
  timeout: string;
  retries: string;
};

const emptyForm: FormState = {
  name: "",
  command: "",
  schedule: "",
  timeout: "",
  retries: "0",
};

function formFromTask(task: Task): FormState {
  return {
    name: task.name,
    command: task.command,
    schedule: task.cron_string,
    timeout:
      task.timeout_ms && task.timeout_ms > 0
        ? String(task.timeout_ms / 1000)
        : "",
    retries: String(task.max_retries ?? 0),
  };
}

export function TaskDialog({
  open,
  task,
  defaultSchedule,
  onClose,
}: {
  open: boolean;
  task: Task | null;
  defaultSchedule?: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = useNow(30_000);
  const debouncedSchedule = useDebounced(form.schedule, 350);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      task
        ? formFromTask(task)
        : { ...emptyForm, schedule: defaultSchedule ?? "" },
    );
  }, [open, task, defaultSchedule]);

  const validation = useQuery({
    queryKey: ["schedule-preview", debouncedSchedule],
    queryFn: () => api.validateSchedule(debouncedSchedule),
    enabled: open && debouncedSchedule.trim().length > 0,
    staleTime: 30_000,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (input: TaskInput) =>
      task ? api.updateTask(task.id, input) : api.createTask(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
      toast(task ? "Task updated." : "Task created.", "success");

      if (result && "task" in result && result.task) {
        queryClient.invalidateQueries({ queryKey: ["task", result.task.id] });
      }

      onClose();
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const canSubmit = useMemo(
    () =>
      form.name.trim().length > 0 &&
      form.command.trim().length > 0 &&
      form.schedule.trim().length > 0 &&
      validation.data?.valid !== false &&
      !mutation.isPending,
    [form, validation.data?.valid, mutation.isPending],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    const timeoutValue = form.timeout.trim();
    const timeoutSeconds = timeoutValue === "" ? null : Number(timeoutValue);
    const retries = Number(form.retries);

    if (
      timeoutSeconds !== null &&
      (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 0)
    ) {
      setError("Timeout must be zero or a positive number of seconds.");
      return;
    }

    if (!Number.isInteger(retries) || retries < 0 || retries > 10) {
      setError("Retries must be a whole number between 0 and 10.");
      return;
    }

    mutation.mutate({
      name: form.name.trim(),
      command: form.command.trim(),
      schedule: form.schedule.trim(),
      timeoutMs:
        timeoutSeconds === null ? null : Math.round(timeoutSeconds * 1000),
      maxRetries: retries,
    });
  }

  const preview = validation.data;
  const previewIsLoading = validation.isFetching;
  const scheduleInvalid = preview?.valid === false;

  return (
    <Dialog
      open={open}
      onClose={mutation.isPending ? () => {} : onClose}
      className="dialog-root"
    >
      <div className="dialog-backdrop" aria-hidden="true" />
      <div className="dialog-wrap">
        <DialogPanel className="dialog dialog-form">
          <div className="dialog-head">
            <div>
              <DialogTitle className="dialog-title">
                {task ? "Edit task" : "New task"}
              </DialogTitle>
              <p className="dialog-sub">
                {task
                  ? `Task ${task.id} · created ${formatDateTime(task.created_at)}`
                  : "A command this machine runs on a schedule."}
              </p>
            </div>
            <IconButton
              label="Close dialog"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              <X size={15} />
            </IconButton>
          </div>

          <form onSubmit={submit}>
            <div className="dialog-body form-grid">
              <Field label="Task name" htmlFor="task-name">
                <TextInput
                  id="task-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Nightly database backup"
                  autoFocus
                  maxLength={200}
                />
              </Field>

              <Field
                label="Command"
                htmlFor="task-command"
                hint="Runs through your login shell, exactly as written."
              >
                <textarea
                  id="task-command"
                  className="input textarea mono"
                  rows={3}
                  value={form.command}
                  onChange={(event) => update("command", event.target.value)}
                  placeholder="~/scripts/backup.sh --compress"
                  spellCheck={false}
                />
              </Field>

              <div className="form-two">
                <Field label="Schedule" htmlFor="task-schedule">
                  <TextInput
                    id="task-schedule"
                    className="mono"
                    value={form.schedule}
                    onChange={(event) => update("schedule", event.target.value)}
                    placeholder="0 2 * * *"
                    spellCheck={false}
                    aria-invalid={scheduleInvalid}
                    aria-describedby="schedule-result"
                  />
                </Field>

                <Field
                  label="Timeout"
                  htmlFor="task-timeout"
                  hint="Seconds. Blank uses the daemon default."
                >
                  <TextInput
                    id="task-timeout"
                    type="number"
                    min="0"
                    step="1"
                    value={form.timeout}
                    onChange={(event) => update("timeout", event.target.value)}
                    placeholder="No limit"
                  />
                </Field>

                <Field
                  label="Retries"
                  htmlFor="task-retries"
                  hint="Retry a failed command up to 10 times."
                >
                  <Dropdown
                    id="task-retries"
                    value={form.retries}
                    onChange={(value) => update("retries", value)}
                    label="Retries"
                    options={Array.from({ length: 11 }, (_, value) => ({
                      value: String(value),
                      label:
                        value === 0
                          ? "No retries"
                          : `${value} ${value === 1 ? "retry" : "retries"}`,
                    }))}
                  />
                </Field>
              </div>

              <div className="schedule-presets" aria-label="Schedule presets">
                {presets.map((preset) => (
                  <button
                    type="button"
                    className="preset"
                    key={preset.value}
                    onClick={() => update("schedule", preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div
                id="schedule-result"
                className="schedule-preview"
                aria-live="polite"
              >
                <div className="schedule-preview-head">
                  <span className="schedule-preview-title">
                    <CalendarClock size={14} aria-hidden="true" />
                    Schedule preview
                  </span>
                  {previewIsLoading ? (
                    <span className="schedule-state">
                      <Loader2 size={12} className="spin" aria-hidden="true" />
                      Checking
                    </span>
                  ) : preview?.valid ? (
                    <span className="schedule-state schedule-state-ok">
                      <Check size={12} aria-hidden="true" />
                      Valid
                    </span>
                  ) : null}
                </div>

                {!form.schedule.trim() ? (
                  <p className="field-hint">
                    Use a cron expression, <span className="mono">@once</span>,
                    or an ISO 8601 date.
                  </p>
                ) : scheduleInvalid ? (
                  <p className="field-error">{preview?.error}</p>
                ) : preview?.valid ? (
                  <>
                    <p className="schedule-description">
                      {preview.description}
                    </p>
                    <ol className="next-runs">
                      {preview.nextRuns.slice(0, 4).map((timestamp) => (
                        <li key={timestamp}>
                          <span className="mono">
                            {formatDateTime(timestamp)}
                          </span>
                          <span>{formatRelative(timestamp, now)}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : previewIsLoading ? (
                  <div className="preview-loading">
                    <span className="skeleton skeleton-line" />
                    <span className="skeleton skeleton-line short" />
                  </div>
                ) : (
                  <p className="field-hint">
                    Upcoming runs appear here as you type.
                  </p>
                )}
              </div>

              {error ? <p className="form-error">{error}</p> : null}
            </div>

            <div className="dialog-foot">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={mutation.isPending}
                disabled={!canSubmit}
              >
                {task ? "Save changes" : "Create task"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
