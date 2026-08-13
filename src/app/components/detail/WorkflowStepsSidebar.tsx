import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, ExternalLink, FileText, Route, X } from "lucide-react";
import { ROLE_LABELS, WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from "../../lib/workflow";
import type { ActivityLog, Contribution, WorkflowState } from "../../types/contribution";

export const HAPPY_FLOW: WorkflowState[] = [
  "kontribusi-masuk",
  "verifikasi-dan-validasi",
  "audiensi-menunggu-jadwal",
  "audiensi-terjadwal",
  "audiensi-konfirmasi-lanjut-pks",
  "perjanjian-draft-pks",
  "perjanjian-pembahasan-pks",
  "perjanjian-finalisasi-pks",
  "pelaksanaan-penandatangan-kerjasama",
  "pelaksanaan-persiapan",
  "pelaksanaan-dalam-proses",
  "pemantauan-terlaksana",
  "selesai",
];

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ActivityDetailCard({ log, defaultExpanded = false, isLatestVisit = false }: { log: ActivityLog; defaultExpanded?: boolean; isLatestVisit?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasDetails = (log.fields && Object.keys(log.fields).some(k => !k.startsWith("_"))) || !!log.notes;

  const isSystem = log.action === "Kontribusi masuk";

  return (
    <div className={`rounded-md border border-gray-200 ${isSystem ? "bg-white" : isLatestVisit ? "bg-white" : "bg-gray-100"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700">{log.action}</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {isSystem ? <>Oleh: Sistem · {formatDateTime(log.timestamp)}</> : <>{log.actor} · {ROLE_LABELS[log.actorRole]} · {formatDateTime(log.timestamp)}<span className="mx-1">·</span><span className={isLatestVisit ? "text-green-600 font-medium" : "text-gray-500"}>{isLatestVisit ? "Berlaku" : "Tidak Berlaku"}</span></>}
          </p>
        </div>
        {hasDetails && (
          <span className="shrink-0 text-gray-300">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>
      {expanded && hasDetails && (
        <div className="border-t border-gray-100 px-3 py-2">
          <table className="w-full text-sm">
            <colgroup><col className="w-44" /><col /></colgroup>
              <tbody>
                {log.fields && Object.entries(log.fields).filter(([k]) => !k.startsWith("_")).flatMap(([label, value]) => {
                  const isFile = /dokumen|file|upload|surat|notulen|draft|pks|bast|foto|report|rencana/i.test(label);
                  const rawItems = String(value).split(/\s*\|\|\s*/);
                  const items: string[] = [];
                  for (const r of rawItems) {
                    const t = r.trim();
                    if (!t) continue;
                    if (!t.includes("(") && t.includes(",")) {
                      items.push(...t.split(",").map(s => s.trim()).filter(Boolean));
                    } else {
                      items.push(t);
                    }
                  }
                  return items.length > 1 ? items.map((item, vi) => (
                    <tr key={`${label}-${vi}`}>
                      <td className="whitespace-nowrap pr-3 pb-1.5 align-top font-medium text-gray-400">{vi === 0 ? label : ""}</td>
                      <td className="pb-1.5 align-top text-gray-500">
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
                      <td className="whitespace-nowrap pr-3 pb-1.5 align-top font-medium text-gray-400">{label}</td>
                      <td className="pb-1.5 align-top text-gray-500">
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
  );
}

export function WorkflowStepsSidebar({
  contribution: c,
  readOnly = false,
}: {
  contribution: Contribution;
  /** true = tampilkan indikator alur saja, tanpa interaksi (dipakai di portal mitra) */
  readOnly?: boolean;
}) {
  const currentIndex = HAPPY_FLOW.indexOf(c.workflowStatus as WorkflowState);
  const isTerminal = c.workflowStatus === "selesai" || c.workflowStatus === "tidak-dilanjutkan";
  const [popupState, setPopupState] = useState<WorkflowState | null>(null);
  const [detailState, setDetailState] = useState<WorkflowState | null>(null);
  const maxReachedIdx = Math.max(
    ...c.aktivitas.flatMap(a => {
      const fromIdx = HAPPY_FLOW.indexOf(a.fromState as WorkflowState);
      const toIdx = HAPPY_FLOW.indexOf(a.toState as WorkflowState);
      return [fromIdx, toIdx];
    }).filter(idx => idx >= 0),
    -1
  );
  const rejectedState: WorkflowState | undefined = c.workflowStatus === "tidak-dilanjutkan"
    ? c.aktivitas.find(a => a.action === "Tidak Dilanjutkan")?.fromState
    : undefined;
  const hasReentryMarker = c.aktivitas.some(a => {
    const fromIdx = HAPPY_FLOW.indexOf(a.fromState as WorkflowState);
    const toIdx = HAPPY_FLOW.indexOf(a.toState as WorkflowState);
    return fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx;
  });

  const getStepInfo = (state: WorkflowState) => {
    const currentIdx = HAPPY_FLOW.indexOf(c.workflowStatus as WorkflowState);
    const stateIdx = HAPPY_FLOW.indexOf(state);
    const allSorted = [...c.aktivitas].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const allLinkedDocIds = allSorted
      .filter(a => a.fromState === state || a.toState === state)
      .flatMap(a => a.fields?._docIds ? a.fields._docIds.split(",") : [])
      .filter(Boolean);
    const dokumenTerkait = c.dokumen.filter(d => allLinkedDocIds.includes(d.id));
    let latestVisitDocIds: string[];
    if (currentIdx >= 0 && stateIdx > currentIdx) {
      latestVisitDocIds = [];
    } else if (c.workflowStatus === state) {
      const latestReentryIndex = allSorted.findIndex(a => a.fromState !== state);
      const currentVisitEntries = latestReentryIndex === -1
        ? allSorted
        : allSorted.slice(0, latestReentryIndex);
      latestVisitDocIds = currentVisitEntries
        .filter(a => a.fromState === state)
        .flatMap(a => a.fields?._docIds ? a.fields._docIds.split(",") : [])
        .filter(Boolean);
    } else {
      const stateEntries = allSorted.filter(a => a.fromState === state || a.toState === state);
      latestVisitDocIds = stateEntries
        .find(a => a.fields?._docIds)?.fields?._docIds?.split(",").filter(Boolean) || [];
    }
    return { dokumenTerkait, latestVisitDocIds };
  };

  return (
    <div className="sticky top-0 rounded-lg border border-gray-100 bg-white shadow-sm p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5"><Route className="h-4 w-4" /> Alur Status</h3>
      <div className="relative">
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-100" />

        <div className="space-y-0">
          {HAPPY_FLOW.map((state, i) => {
            const stateHasAktivitas = c.aktivitas.some(a => a.fromState === state || a.toState === state);
            const isCurrent = c.workflowStatus === state;
            const isPast = currentIndex >= 0 && i < currentIndex && stateHasAktivitas;
            const isFuture = currentIndex >= 0 && i > currentIndex;
            const isPreviouslyVisited = currentIndex >= 0 && i >= currentIndex && i <= maxReachedIdx && (maxReachedIdx > currentIndex || hasReentryMarker) && stateHasAktivitas;
            const rejectedIndex = rejectedState ? HAPPY_FLOW.indexOf(rejectedState) : -1;
            const isRejected = rejectedIndex >= 0 && i === rejectedIndex;
            const isPastRejected = rejectedIndex >= 0 && i < rejectedIndex;
            const info = getStepInfo(state);
            const popupOpen = popupState === state;

            return (
              <div key={state} className="relative flex items-start gap-3 pb-4 last:pb-0">
                  <div className="relative z-10 mt-0.5 shrink-0">
                    {isRejected ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-red-500" />
                    ) : isCurrent ? (
                      <span className="flex h-[18px] w-[18px] items-center justify-center">
                        <span className="absolute h-[18px] w-[18px] animate-ping rounded-full bg-blue-400 opacity-40" />
                        <span className="relative h-[18px] w-[18px] rounded-full border-2 border-blue-600 bg-white" />
                      </span>
                    ) : isPast || isPastRejected ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-green-600 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isPreviouslyVisited ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-gray-200" />
                    ) : isTerminal && i > currentIndex && c.workflowStatus === "selesai" ? (
                      <div className="h-[18px] w-[18px] rounded-full bg-gray-200" />
                    ) : (
                      <div className="h-[18px] w-[18px] rounded-full border-2 border-gray-200 bg-white" />
                    )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  {readOnly ? (
                    <span
                      className={`flex items-center text-[14px] leading-tight whitespace-nowrap ${
                        isRejected
                          ? "font-semibold text-red-600"
                          : isCurrent
                            ? "font-semibold text-blue-700"
                            : isPast || isPastRejected
                              ? "font-medium text-gray-600"
                              : "font-medium text-gray-400"
                      }`}
                    >
                      <span className="truncate" style={{ fontSize: '14px', fontWeight: isCurrent ? 600 : 400 }}>
                        {WORKFLOW_STATE_LABELS[state]}
                      </span>
                    </span>
                  ) : (
                  <button
                    className={`group flex items-center gap-1 text-[14px] leading-tight whitespace-nowrap cursor-pointer transition-colors duration-200 ${
                    isRejected
                      ? "font-semibold text-red-600 hover:text-red-700"
                      : isPreviouslyVisited && isCurrent
                        ? "font-semibold text-blue-700 hover:text-blue-800"
                        : isCurrent
                          ? "font-semibold text-blue-700 hover:text-blue-800"
                          : isPast || isPastRejected
                            ? "font-medium text-gray-600 hover:text-gray-800"
                            : "font-medium text-gray-400 hover:text-gray-600"
                  }`}
                    onClick={() => setDetailState(detailState === state ? null : state)}
                  >
                    <span className="truncate" style={{ fontSize: '14px', fontWeight: isCurrent ? 600 : 400 }}>{WORKFLOW_STATE_LABELS[state]}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                  </button>
                  )}
                  {!readOnly && info.dokumenTerkait.length > 0 && (
                    <button
                      onClick={() => setPopupState(popupOpen ? null : state)}
                      className="mt-1 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      <FileText className="h-3 w-3" />
                      Dokumen ({info.dokumenTerkait.length})
                    </button>
                  )}
                </div>

                {popupOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setPopupState(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto w-[640px] max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                              <FileText className="h-4 w-4" /> Dokumen
                            </h3>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {WORKFLOW_STATE_LABELS[state]}
                            </span>
                          </div>
                          <button onClick={() => setPopupState(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="px-5 py-3 max-h-80 overflow-y-auto space-y-2">
                          {(() => {
                            const latestDocIdSet = new Set(info.latestVisitDocIds);
                            return [...info.dokumenTerkait].sort((a, b) => {
                              const aValid = latestDocIdSet.has(a.id);
                              const bValid = latestDocIdSet.has(b.id);
                              if (aValid !== bValid) return aValid ? -1 : 1;
                              return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
                            }).map(doc => {
                              const isLatest = latestDocIdSet.has(doc.id);
                                return (
                                  <div
                                    key={doc.id}
                                    className={`flex items-start gap-3 p-3 rounded-md border ${
                                      isLatest ? "bg-white border-gray-200" : "bg-gray-100 border-gray-300"
                                    }`}
                                  >
                                    <FileText className={`h-5 w-5 shrink-0 mt-0.5 ${isLatest ? "text-blue-400" : "text-gray-400"}`} />
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-sm block truncate ${isLatest ? "text-gray-900" : "text-gray-500"}`}>
                                        {doc.name}
                                      </span>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {formatDate(doc.uploadedAt)} • {new Date(doc.uploadedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} • <span className={isLatest ? "text-green-700" : "text-gray-400"}>{isLatest ? "Berlaku" : "Tidak Berlaku"}</span>
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                                      <a
                                        href={doc.url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                      >
                                        Lihat
                                      </a>
                                      <a
                                        href={doc.url || "#"}
                                        download
                                        className="rounded-md border border-gray-900 bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800"
                                      >
                                        Unduh
                                      </a>
                                    </div>
                                  </div>
                                  );
                                });
                            })()}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {detailState === state && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setDetailState(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                      <div className="pointer-events-auto w-[640px] max-w-[90vw] rounded-lg border border-gray-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                              <Route className="h-4 w-4" /> Detail Aktivitas
                            </h3>
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${WORKFLOW_STATE_COLORS[state]?.bg} ${WORKFLOW_STATE_COLORS[state]?.text} ${WORKFLOW_STATE_COLORS[state]?.border}`}>
                              {WORKFLOW_STATE_LABELS[state]}
                            </span>
                          </div>
                          <button onClick={() => setDetailState(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="px-5 py-3 max-h-96 overflow-y-auto">
                          {(() => {
                            const aktivitasForState = c.aktivitas
                              .filter(a => a.fromState === state || a.toState === state)
                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                            const hasCurrentVisitEntry = isPreviouslyVisited && aktivitasForState.some(a => {
                              const docIds = a.fields?._docIds ? String(a.fields._docIds).split(",").map(s => s.trim()).filter(Boolean) : [];
                              return docIds.some(id => info.latestVisitDocIds.includes(id));
                            });
                            return aktivitasForState.length === 0 ? (
                              <p className="text-sm text-gray-400 py-4 text-center">Belum ada aktivitas di status ini.</p>
                            ) : (
                              <div className="space-y-3">
                                {aktivitasForState.map((log, idx) => (
                                  <ActivityDetailCard key={log.id} log={log} defaultExpanded={idx === 0} isLatestVisit={isPreviouslyVisited ? (hasCurrentVisitEntry && idx === 0) : idx === 0} />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
