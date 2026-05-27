import type { Contribution } from "../../types/contribution";
import { WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS, ROLE_LABELS } from "../../lib/workflow";

interface WorkflowTimelineProps {
  contribution: Contribution;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WorkflowTimeline({ contribution }: WorkflowTimelineProps) {
  const activities = [...contribution.aktivitas].reverse();

  if (activities.length === 0) {
    return <p className="text-sm text-gray-400">Belum ada aktivitas tercatat.</p>;
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[9px] top-6 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {activities.map((log, i) => {
          const isLatest = i === 0;
          const stateColors = log.toState ? WORKFLOW_STATE_COLORS[log.toState] : null;

          return (
            <div key={log.id} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 mt-3 flex h-4 w-4 shrink-0 items-center justify-center">
                {isLatest && (
                  <div className="absolute h-4 w-4 animate-ping rounded-full bg-blue-400 opacity-50" />
                )}
                <div className={`relative h-2.5 w-2.5 rounded-full ${isLatest ? "bg-blue-500" : "bg-gray-300"}`} />
              </div>

              {/* Card */}
              <div className={`flex-1 rounded-lg border p-3 pb-3 ${isLatest ? "border-blue-200 bg-blue-50/40" : "border-gray-100 bg-white"}`}>
                {/* Action + state badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{log.action}</span>
                  {log.toState && stateColors && (
                    <span className={`rounded-full border px-2 py-0.5 text-sm font-medium ${stateColors.bg} ${stateColors.text} ${stateColors.border}`}>
                      {WORKFLOW_STATE_LABELS[log.toState]}
                    </span>
                  )}
                </div>

                {/* Actor + time */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                      {log.actor.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{log.actor}</span>
                    <span className="text-sm text-gray-400">· {ROLE_LABELS[log.actorRole]}</span>
                  </div>
                  <span className="text-sm text-gray-400">{formatDateTime(log.timestamp)}</span>
                </div>

                {/* Notes */}
                {log.notes && (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-sm text-gray-600">{log.notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
