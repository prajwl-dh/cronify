import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Database,
  HardDrive,
  Server,
  Terminal,
  Timer,
  Trash2,
} from "lucide-react";
import { api } from "../api/client";
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  Skeleton,
  TextInput,
} from "../components/ui";
import { CopyButton } from "../components/CopyButton";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatUptime,
} from "../lib/format";
import { useToast } from "../lib/toast";

type Draft = {
  timeout: string;
  retention: string;
  port: string;
};

function secondsFromMs(ms: number) {
  return String(Math.round(ms / 1000));
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const configQuery = useQuery({
    queryKey: ["config"],
    queryFn: api.config,
  });

  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
    refetchInterval: 10_000,
  });

  const logSummaryQuery = useQuery({
    queryKey: ["logs", "summary"],
    queryFn: () => api.logs({ page: 1, limit: 1 }),
    staleTime: 10_000,
  });

  const [draft, setDraft] = useState<Draft>({
    timeout: "0",
    retention: "0",
    port: "2207",
  });
  const [attempted, setAttempted] = useState(false);
  const [restartNote, setRestartNote] = useState<number | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!configQuery.data) return;
    const config = configQuery.data.config;
    setDraft({
      timeout: secondsFromMs(config.defaultTimeoutMs),
      retention: String(config.logRetentionDays),
      port: String(config.port),
    });
  }, [configQuery.data]);

  const config = configQuery.data?.config;

  const dirty =
    Boolean(config) &&
    (draft.timeout !== secondsFromMs(config!.defaultTimeoutMs) ||
      draft.retention !== String(config!.logRetentionDays) ||
      draft.port !== String(config!.port));

  const errors = useMemo(() => {
    const timeout = Number(draft.timeout);
    const retention = Number(draft.retention);
    const port = Number(draft.port);

    return {
      timeout:
        draft.timeout.trim() === "" || !Number.isFinite(timeout) || timeout < 0
          ? "Enter zero or a positive number of seconds."
          : null,
      retention:
        draft.retention.trim() === "" ||
        !Number.isInteger(retention) ||
        retention < 0
          ? "Enter zero or a whole number of days."
          : null,
      port:
        draft.port.trim() === "" ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
          ? "Enter a port between 1 and 65535."
          : null,
    };
  }, [draft]);

  const hasErrors = Object.values(errors).some(Boolean);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateConfig({
        defaultTimeoutMs: Math.round(Number(draft.timeout) * 1000),
        logRetentionDays: Number(draft.retention),
        port: Number(draft.port),
      }),
    onSuccess: (result) => {
      toast("Settings saved.", "success");
      if (result.restartRequired) {
        setRestartNote(result.config.port);
      } else {
        setRestartNote(null);
      }
      queryClient.invalidateQueries({ queryKey: ["config"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["health"] });
      setAttempted(false);
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearLogs(),
    onSuccess: (result) => {
      toast(
        `${formatNumber(result.deleted)} execution ${
          result.deleted === 1 ? "log" : "logs"
        } cleared.`,
        "success",
      );
      setConfirmClear(false);
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: Error) => {
      setConfirmClear(false);
      toast(error.message, "error");
    },
  });

  function update(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (hasErrors) return;
    saveMutation.mutate();
  }

  if (configQuery.isPending) {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>Settings</h1>
            <Skeleton className="skeleton-sub" />
          </div>
        </div>
        <div className="settings-layout">
          <div className="settings-row">
            <div className="settings-label">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-line" />
            </div>
            <div className="panel settings-panel">
              <Skeleton className="skeleton-field" />
              <Skeleton className="skeleton-field" />
              <Skeleton className="skeleton-field" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (configQuery.isError) {
    return (
      <>
        <div className="title-row">
          <div>
            <h1>Settings</h1>
            <p className="sub">The daemon configuration could not be loaded.</p>
          </div>
        </div>
        <div className="panel">
          <ErrorState
            message={configQuery.error.message}
            onRetry={() => configQuery.refetch()}
          />
        </div>
      </>
    );
  }

  const daemon = overviewQuery.data?.daemon;
  const logCount = logSummaryQuery.data?.summary.total ?? 0;
  const timeoutSeconds = Number(draft.timeout);
  const retentionDays = Number(draft.retention);
  const port = Number(draft.port);

  const cliCommands = [
    `cronify config --timeout ${draft.timeout} --retention ${draft.retention}`,
    'cronify validate --schedule "0 9 * * 1-5"',
    "cronify stats",
    "cronify logs --status error",
  ];

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Settings</h1>
          <p className="sub">
            Limits, retention and the local address this daemon listens on.
          </p>
        </div>
        <div className="title-actions">
          <span className="stamp">Daemon configuration</span>
        </div>
      </div>

      {restartNote ? (
        <div className="notice" role="status">
          <AlertTriangle size={15} aria-hidden="true" />
          <span>
            Port <span className="mono">{restartNote}</span> is saved. Restart
            the daemon to apply it:{" "}
            <code>cronify change --port {restartNote}</code>
          </span>
        </div>
      ) : null}

      <section className="panel daemon-facts" aria-label="Daemon facts">
        <div className="fact">
          <span className="fact-label">Version</span>
          <span className="fact-value mono">{daemon?.version ?? "—"}</span>
        </div>
        <div className="fact">
          <span className="fact-label">Listening on</span>
          <span className="fact-value mono">
            {daemon ? `127.0.0.1:${daemon.port}` : "—"}
          </span>
        </div>
        <div className="fact">
          <span className="fact-label">Uptime</span>
          <span className="fact-value num">
            {daemon ? formatUptime(daemon.uptimeMs) : "—"}
          </span>
        </div>
        <div className="fact">
          <span className="fact-label">Database</span>
          <span className="fact-value">
            <span className="online-mark" aria-hidden="true" />
            connected
          </span>
        </div>
      </section>

      <div className="settings-layout">
        <section className="settings-row">
          <div className="settings-label">
            <h2>Daemon settings</h2>
            <p>
              Defaults for tasks that do not set their own limit, plus how long
              execution history stays on disk.
            </p>
          </div>

          <form className="panel settings-panel" onSubmit={submit}>
            <div className="settings-field">
              <Field
                label="Default timeout"
                htmlFor="default-timeout"
                hint={
                  attempted && errors.timeout
                    ? errors.timeout
                    : "Seconds. Zero means commands run without a time limit."
                }
              >
                <TextInput
                  id="default-timeout"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.timeout}
                  onChange={(event) => update("timeout", event.target.value)}
                  aria-invalid={attempted && Boolean(errors.timeout)}
                />
              </Field>
              <p className="setting-preview">
                <Timer size={13} aria-hidden="true" />
                {timeoutSeconds > 0
                  ? `Commands stop after ${timeoutSeconds}s unless the task sets its own timeout.`
                  : "Commands run until they exit on their own."}
              </p>
            </div>

            <div className="settings-field">
              <Field
                label="Log retention"
                htmlFor="log-retention"
                hint={
                  attempted && errors.retention
                    ? errors.retention
                    : "Days. Zero keeps execution logs forever."
                }
              >
                <div className="input-with-unit">
                  <TextInput
                    id="log-retention"
                    type="number"
                    min="0"
                    step="1"
                    value={draft.retention}
                    onChange={(event) =>
                      update("retention", event.target.value)
                    }
                    aria-invalid={attempted && Boolean(errors.retention)}
                  />
                  <span>days</span>
                </div>
              </Field>
              <p className="setting-preview">
                <Database size={13} aria-hidden="true" />
                {retentionDays > 0
                  ? `Logs older than ${retentionDays} days are removed hourly.`
                  : "Execution logs are kept until you clear them."}
              </p>
            </div>

            <div className="settings-field">
              <Field
                label="Dashboard port"
                htmlFor="daemon-port"
                hint={
                  attempted && errors.port
                    ? errors.port
                    : "Bound to localhost only. Changing the port needs a restart."
                }
              >
                <div className="input-with-unit">
                  <TextInput
                    id="daemon-port"
                    type="number"
                    min="1"
                    max="65535"
                    step="1"
                    value={draft.port}
                    onChange={(event) => update("port", event.target.value)}
                    aria-invalid={attempted && Boolean(errors.port)}
                  />
                  <span>TCP</span>
                </div>
              </Field>
              <p className="setting-preview">
                <Server size={13} aria-hidden="true" />
                {port >= 1 && port <= 65535
                  ? `The dashboard and API would listen on 127.0.0.1:${port}.`
                  : "Enter a valid TCP port."}
              </p>
            </div>

            <div className="settings-save">
              <span className="settings-dirty">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </span>
              <Button
                type="submit"
                variant="primary"
                loading={saveMutation.isPending}
                disabled={!dirty}
              >
                Save settings
              </Button>
            </div>
          </form>
        </section>

        <section className="settings-row">
          <div className="settings-label">
            <h2>Maintenance</h2>
            <p>
              Execution history is stored in SQLite beside the daemon
              configuration. Clearing it does not touch tasks or schedules.
            </p>
          </div>

          <div className="panel settings-panel maintenance-panel">
            <div className="maintenance-copy">
              <span className="maintenance-icon" aria-hidden="true">
                <HardDrive size={17} />
              </span>
              <div>
                <p className="maintenance-title">
                  {formatNumber(logCount)}{" "}
                  {logCount === 1 ? "execution log" : "execution logs"} stored
                </p>
                <p className="maintenance-sub">
                  Includes stdout and stderr for every run still inside the
                  retention window.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={() => setConfirmClear(true)}
              disabled={logCount === 0}
            >
              Clear all logs
            </Button>
          </div>
        </section>

        <section className="settings-row">
          <div className="settings-label">
            <h2>Command line</h2>
            <p>
              Every setting and action on this dashboard is also available from
              the CLI.
            </p>
          </div>

          <div className="panel settings-panel cli-panel">
            <div className="cli-head">
              <span>
                <Terminal size={14} aria-hidden="true" />
                Equivalent commands
              </span>
              <CopyButton text={cliCommands.join("\n")} label="Commands" />
            </div>
            <div className="cli-list">
              {cliCommands.map((command) => (
                <div className="cli-line" key={command}>
                  <code>{command}</code>
                  <CopyButton text={command} label="Command" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-row">
          <div className="settings-label">
            <h2>About</h2>
            <p>
              Cronify runs a scheduler, a SQLite database and this dashboard as
              one local process.
            </p>
          </div>

          <div className="panel settings-panel about-panel">
            <dl className="about-list">
              <div>
                <dt>Data directory</dt>
                <dd className="mono">{daemon?.dataDir ?? "~/.cronify"}</dd>
              </div>
              <div>
                <dt>Process</dt>
                <dd className="mono">PID {daemon?.pid ?? "—"}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd className="mono">
                  {daemon ? formatDateTime(daemon.startedAt) : "—"}
                </dd>
              </div>
              <div>
                <dt>Task defaults</dt>
                <dd>
                  {daemon?.defaultTimeoutMs
                    ? `${formatDuration(daemon.defaultTimeoutMs)} timeout`
                    : "No timeout"}{" "}
                  ·{" "}
                  {daemon?.logRetentionDays
                    ? `${daemon.logRetentionDays} day retention`
                    : "logs kept"}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear all execution logs?"
        description={
          <>
            <span className="mono">{formatNumber(logCount)}</span> execution{" "}
            {logCount === 1 ? "log" : "logs"} will be deleted permanently.
            Tasks, schedules and settings are kept.
          </>
        }
        confirmLabel="Clear all logs"
        busy={clearMutation.isPending}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => clearMutation.mutate()}
      />
    </>
  );
}
