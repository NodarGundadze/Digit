import type { TaskLogDTO } from "@/lib/types";
import { shortDateTime } from "@/lib/format";

export function TaskTimeline({ logs }: { logs: TaskLogDTO[] }) {
  if (!logs.length)
    return <p className="text-xs text-slate-400">No activity yet.</p>;
  return (
    <ol className="space-y-3">
      {logs.map((log, i) => (
        <li key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
            {i < logs.length - 1 && (
              <span className="w-px flex-1 bg-slate-200 my-1" />
            )}
          </div>
          <div className="pb-1">
            <p className="text-xs text-slate-700 leading-relaxed">{log.note}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              {log.updatedByName} · {shortDateTime(log.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
