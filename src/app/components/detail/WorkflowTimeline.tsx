import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
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
  const currentColors = WORKFLOW_STATE_COLORS[contribution.workflowStatus];
  const hasActivityInCurrentState = contribution.aktivitas.some((a) => a.toState === contribution.workflowStatus);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(contribution.aktivitas.map(a => a.id)));

  // Compute latest aktivitas per state
  const stateGroups = new Map<string, { id: string; timestamp: Date }[]>();
  for (const a of contribution.aktivitas) {
    if (!a.toState) continue;
    const group = stateGroups.get(a.toState) || [];
    group.push({ id: a.id, timestamp: a.timestamp });
    stateGroups.set(a.toState, group);
  }
  const latestEntryIds = new Set<string>();
  for (const [, entries] of stateGroups) {
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (entries.length > 0) latestEntryIds.add(entries[0].id);
  }

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative">
      {/* Current status card */}
      {currentColors && contribution.workflowStatus !== "kontribusi-masuk" && (
        <div className="relative flex gap-4 mb-5">
          <div className="relative z-10 mt-[14px] flex h-4 w-4 shrink-0 items-center justify-center">
            <div className="absolute h-4 w-4 animate-ping rounded-full bg-blue-400 opacity-50" />
            <div className="relative h-2.5 w-2.5 rounded-full bg-blue-500" />
          </div>
          <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Status Saat Ini</span>
              <span className={`rounded-full border px-2 py-0.5 text-sm font-medium ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>
                {WORKFLOW_STATE_LABELS[contribution.workflowStatus]}
              </span>
            </div>
            {!hasActivityInCurrentState && (
              <p className="mt-2 text-xs text-gray-400">Belum ada aksi di status ini.</p>
            )}
          </div>
        </div>
      )}

      {activities.length === 0 && (
        <p className="text-sm text-gray-400">Belum ada aktivitas tercatat.</p>
      )}

      {activities.length > 0 && (
        <>
          {/* Vertical line */}
          <div className="absolute left-[8px] top-[22px] bottom-0 w-px bg-gray-200" />

          <div className="space-y-4">
            {activities.map((log, i) => {
          const stateColors = log.toState ? WORKFLOW_STATE_COLORS[log.toState] : null;
          const isLatestVisit = latestEntryIds.has(log.id);

          return (
            <div key={log.id} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 mt-[14px] flex h-4 w-4 shrink-0 items-center justify-center">
                <div className="relative h-2.5 w-2.5 rounded-full bg-gray-300" />
              </div>

              {/* Card */}
              <div className={`flex-1 rounded-lg border border-gray-200 ${isLatestVisit ? "bg-white" : "bg-gray-100"} p-3`}>
                <button
                  onClick={() => toggleCollapse(log.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="text-xs flex-1 min-w-0">
                    {log.action === "Kontribusi masuk" ? (
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {log.toState && stateColors && (
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${stateColors.bg} ${stateColors.text} ${stateColors.border}`}>
                              {WORKFLOW_STATE_LABELS[log.toState]}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 italic text-gray-400">Oleh: Sistem · {formatDateTime(log.timestamp)}</div>
                        {contribution.workflowStatus === "kontribusi-masuk" && (
                          <p className="mt-2 text-xs text-gray-400">Belum ada aksi di status ini.</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          {log.toState && stateColors ? (
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${stateColors.bg} ${stateColors.text} ${stateColors.border}`}>
                              {WORKFLOW_STATE_LABELS[log.toState]}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                          <span className="text-gray-300 mx-0.5">→</span>
                          <span className="font-medium text-gray-400">Aksi:</span>
                          <span className="text-gray-700">{log.action}</span>
                        </div>
                        <div className="mt-1 text-gray-400">
                          <span>Oleh: {log.actor} · {ROLE_LABELS[log.actorRole]} · {formatDateTime(log.timestamp)} · <span className={isLatestVisit ? "text-green-600 font-medium" : "text-gray-500"}>{isLatestVisit ? "Berlaku" : "Tidak Berlaku"}</span></span>
                        </div>
                      </>
                    )}
                  </div>
                  {(log.fields || log.notes) && (
                    <span className="ml-2 shrink-0 text-gray-300">
                      {collapsed.has(log.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </span>
                  )}
                </button>

                {/* Fields */}
                {!collapsed.has(log.id) && (log.fields || log.notes) && (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                    <table className="w-full">
                      <colgroup>
                        <col className="w-44" />
                        <col />
                      </colgroup>
                      <tbody>
                        {log.fields && Object.entries(log.fields).filter(([label]) => !label.startsWith("_")).flatMap(([label, value]) => {
                          const isFile = /dokumen|file|upload|surat|notulen|draft|pks|bast|foto|report|rencana/i.test(label);
                          const items = String(value).split(",").map(v => v.trim()).filter(Boolean);
                          return items.length > 1 ? items.map((item, vi) => (
                            <tr key={`${label}-${vi}`}>
                              <td className="whitespace-nowrap pr-3 pb-1 align-top font-medium text-gray-400">{vi === 0 ? label : ""}</td>
                              <td className="pb-1 align-top text-gray-500">
                                : {isFile ? (
                                  <a href="#" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-xs max-w-[200px]">
                                    <span className="truncate">{item}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                ) : item}
                              </td>
                            </tr>
                          )) : (
                            <tr key={label}>
                              <td className="whitespace-nowrap pr-3 pb-1 align-top font-medium text-gray-400">{label}</td>
                              <td className="pb-1 align-top text-gray-500">
                                : {isFile ? (
                                  <a href="#" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-xs max-w-[200px]">
                                    <span className="truncate">{items[0] || value}</span>
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                  </a>
                                ) : items[0] || value}
                              </td>
                            </tr>
                          );
                        })}
                        {log.notes && (
                          <tr>
                            <td className="whitespace-nowrap pr-3 pb-1 align-top font-medium text-gray-400">Keterangan</td>
                            <td className="pb-1 align-top text-gray-500">: {log.notes}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </>
    )}
  </div>
  );
}
