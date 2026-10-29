import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api/client";
import type { Task } from "./api/types";
import { Shell } from "./components/Shell";
import { TaskDialog } from "./components/TaskDialog";
import { LogsPage } from "./pages/LogsPage";
import { OverviewPage } from "./pages/OverviewPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TasksPage } from "./pages/TasksPage";
import { useRoute } from "./lib/route";

export default function App() {
  const route = useRoute();
  const [dialog, setDialog] = useState<{ task: Task | null } | null>(null);

  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: api.overview,
    refetchInterval: 10_000,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [route.path]);

  const taskParam = Number(route.params.get("task"));
  const initialTaskId =
    Number.isInteger(taskParam) && taskParam > 0 ? taskParam : null;

  return (
    <>
      <Shell path={route.path} failureCount={overview.data?.runs.failure ?? 0}>
        {route.path === "tasks" ? (
          <TasksPage onEdit={(task) => setDialog({ task })} />
        ) : route.path === "logs" ? (
          <LogsPage initialTaskId={initialTaskId} />
        ) : route.path === "settings" ? (
          <SettingsPage />
        ) : (
          <OverviewPage onNewTask={() => setDialog({ task: null })} />
        )}
      </Shell>

      <TaskDialog
        open={dialog !== null}
        task={dialog?.task ?? null}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
