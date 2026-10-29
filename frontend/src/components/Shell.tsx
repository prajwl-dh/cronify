import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Monitor,
  Moon,
  ScrollText,
  Settings,
  Sun,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { formatUptime } from "../lib/format";
import { useTheme } from "../lib/theme";

const destinations = [
  { path: "overview", label: "Overview", icon: LayoutDashboard },
  { path: "tasks", label: "Tasks", icon: ListTodo },
  { path: "logs", label: "Logs", icon: ScrollText },
  { path: "settings", label: "Settings", icon: Settings },
] as const;

function ProductMark() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="13"
        cy="13"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M13 4.2v2.1M13 19.7v2.1M21.8 13h-2.1M6.3 13H4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13 8.6V13l3.1 1.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavItem({
  path,
  label,
  icon: Icon,
  active,
  count,
}: {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  count?: number;
}) {
  return (
    <a
      href={`#/${path}`}
      className="nav-item"
      aria-current={active ? "page" : undefined}
    >
      <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
      <span className="nav-label">{label}</span>
      {count !== undefined && count > 0 ? (
        <span className="nav-count" aria-label={`${count} needing attention`}>
          {count}
        </span>
      ) : null}
    </a>
  );
}

function ThemeButton({ compact = false }: { compact?: boolean }) {
  const { mode, cycle } = useTheme();
  const Icon = mode === "light" ? Sun : mode === "system" ? Monitor : Moon;
  const label =
    mode === "light" ? "Light" : mode === "system" ? "System" : "Dark";

  return (
    <button
      type="button"
      className={compact ? "icon-btn" : "theme-button"}
      onClick={cycle}
      aria-label={`Theme: ${label}. Switch theme`}
      title={`Theme: ${label}`}
    >
      <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
      {compact ? null : <span>{label} theme</span>}
    </button>
  );
}

function DaemonStatus() {
  const { data, isError } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    refetchInterval: 15_000,
  });

  const online = Boolean(data) && !isError;

  return (
    <div className="daemon-chip" title={data ? `PID ${data.pid}` : undefined}>
      <span
        className={`status-dot ${online ? "status-dot-online" : "status-dot-offline"}`}
        aria-hidden="true"
      />
      <span>
        {online
          ? "Daemon online"
          : isError
            ? "Daemon offline"
            : "Checking daemon"}
      </span>
      <span className="daemon-meta mono">
        {data ? `v${data.version} · up ${formatUptime(data.uptimeMs)}` : "—"}
      </span>
    </div>
  );
}

export function Shell({
  path,
  failureCount,
  children,
}: {
  path: string;
  failureCount: number;
  children: ReactNode;
}) {
  const current = destinations.find((item) => item.path === path);
  const title = current?.label ?? "Overview";

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#/overview" aria-label="Cronify, overview">
          <span className="brand-mark">
            <ProductMark />
          </span>
          <span className="brand-text">
            <strong>Cronify</strong>
            <span className="brand-scope">Local daemon</span>
          </span>
        </a>

        <nav className="nav" aria-label="Primary">
          <p className="nav-group">Workspace</p>
          {destinations.slice(0, 3).map((item) => (
            <NavItem
              key={item.path}
              {...item}
              active={path === item.path}
              count={item.path === "logs" ? failureCount : undefined}
            />
          ))}
          <p className="nav-group nav-group-system">System</p>
          <NavItem {...destinations[3]} active={path === "settings"} />
        </nav>

        <div className="sidebar-foot">
          <DaemonStatus />
          <ThemeButton />
        </div>
      </aside>

      <header className="mobile-top">
        <a className="brand brand-mobile" href="#/overview">
          <span className="brand-mark">
            <ProductMark />
          </span>
          <span className="brand-text">
            <strong>Cronify</strong>
            <span className="brand-scope">{title}</span>
          </span>
        </a>
        <ThemeButton compact />
      </header>

      <main className="canvas" id="main">
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Primary">
        {destinations.map(({ path: itemPath, label, icon: Icon }) => {
          const active = itemPath === path;
          const count = itemPath === "logs" ? failureCount : 0;

          return (
            <a
              key={itemPath}
              href={`#/${itemPath}`}
              className="mobile-nav-item"
              aria-current={active ? "page" : undefined}
            >
              <span className="mobile-nav-icon">
                <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
                {count > 0 ? (
                  <span className="mobile-nav-count">{count}</span>
                ) : null}
              </span>
              <span>{label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
