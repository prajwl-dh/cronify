type StatusBadgeType = {
  taskStatus: "active" | "inactive" | "obsolete" | "paused";
};

export default function StatusBadge({ taskStatus }: StatusBadgeType) {
  const displayStatus: Record<
    StatusBadgeType["taskStatus"],
    {
      label: string;
      style: string;
      dot: string;
    }
  > = {
    active: {
      label: "Running",
      style:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 animate-pulse",
      dot: "bg-blue-500",
    },
    inactive: {
      label: "Scheduled",
      style:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    paused: {
      label: "Paused",
      style:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    obsolete: {
      label: "Completed",
      style:
        "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      dot: "bg-slate-400",
    },
  };

  const config = displayStatus[taskStatus] ?? displayStatus.obsolete;

  return (
    <span
      className={`px-3 py-1.5 text-xs rounded-full ${config.style} font-bold inline-flex items-center gap-1.5 shadow-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
