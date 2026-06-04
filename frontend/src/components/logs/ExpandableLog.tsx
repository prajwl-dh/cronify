import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  XCircle,
} from "lucide-react";
import stripAnsi from "strip-ansi";
import type { Log } from "../../types/logType";
import { formatReadableDateTime } from "../../utils/converter";

export default function ExpandableLog({
  log,
  index,
  openedLog,
  setOpenedLog,
}: {
  log: Log;
  index: number;
  openedLog: number;
  setOpenedLog: React.Dispatch<React.SetStateAction<number>>;
}) {
  const isExpanded = openedLog === log.id;

  return (
    <div
      className={`flex select-none flex-col cursor-pointer hover:bg-(--bgActive) ${index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-950/40"} text-(--primaryText)`}
    >
      <div
        className="flex items-center justify-between px-4 md:px-6 py-3"
        onClick={() => {
          if (isExpanded) setOpenedLog(-1);
          else setOpenedLog(log.id || -1);
        }}
      >
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-bold">
          <Clock className="w-4 h-4" />
          <pre className="select-text">
            {formatReadableDateTime(log.executed_at)}
          </pre>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${log.exit_code === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"}`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${log.exit_code !== 0 && "hidden"}`}
            />
            <XCircle
              className={`w-3.5 h-3.5 ${log.exit_code === 0 && "hidden"}`}
            />
            <pre className="select-text">Exit Code: {log.exit_code}</pre>
          </div>

          <div className="text-slate-500 dark:text-slate-400">
            <ChevronUp className={`w-5 h-5 ${!isExpanded && "hidden"}`} />

            <ChevronDown className={`w-5 h-5 ${isExpanded && "hidden"}`} />
          </div>
        </div>
      </div>

      {/* Expanded Output Section */}
      <div
        className={`${!isExpanded && "hidden"} cursor-default p-4 md:p-5 relative border-t border-slate-100 dark:border-slate-800/50 ${log.exit_code === 0 ? "bg-emerald-50/30 dark:bg-[#050f0a]" : "bg-red-50/30 dark:bg-[#0a0f0a]"}`}
      >
        <div
          className={`absolute inset-0 pointer-events-none ${log.exit_code === 0 ? "bg-emerald-50/50 dark:bg-emerald-900/5" : "bg-red-50/50 dark:bg-red-900/5"}`}
        ></div>
        <h4
          className={`text-[10px] md:text-xs uppercase mb-3 font-sans font-bold tracking-widest relative flex items-center gap-2 ${log.exit_code === 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-500 dark:text-red-400"}`}
        >
          {log.exit_code === 0 ? "Standard Output" : "Standard Error / Output"}
          <span
            className={`w-2 h-2 rounded-full ${log.exit_code === 0 ? "bg-emerald-400 dark:bg-emerald-500 animate-pulse" : "bg-red-400 dark:bg-red-500 animate-pulse"}`}
          ></span>
        </h4>
        <pre
          className={`text-xs md:text-sm select-text whitespace-pre-wrap break-all md:wrap-break-word font-mono overflow-y-auto custom-scrollbar relative leading-relaxed max-h-96 ${log.exit_code === 0 ? "text-emerald-800 dark:text-emerald-300/90" : "text-red-600 dark:text-red-400/90"}`}
        >
          {log.exit_code === 0
            ? stripAnsi(log.stdout || "")
            : stripAnsi(log.stderr || "")}
        </pre>
      </div>
    </div>
  );
}
