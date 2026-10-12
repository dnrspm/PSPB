import type { Contribution, WorkflowState } from "../types/contribution";

export interface ContributionGroup {
  key: string;
  items: Contribution[];
  primary: Contribution;
  instansi: string;
  program: string;
  paketBantuan: string;
  workflowStatus: WorkflowState;
  lastUpdate: Date;
  submissionDate: Date;
  pic: string | null;
}

/**
 * Kunci pengelompokan satu kali pengajuan kontribusi.
 * Record baru memakai `submissionId`; data lama (sebelum field ini ada)
 * dikenali dari pola id `mtr-<timestamp>-<index>`.
 */
export function getSubmissionKey(c: Contribution): string {
  if (c.submissionId) return c.submissionId;
  const legacy = c.id.match(/^(mtr-\d+)-\d+$/);
  return legacy ? legacy[1] : c.id;
}

function uniqueJoin(values: (string | null | undefined)[]): string {
  return [...new Set(values.filter((v): v is string => !!v && v.trim() !== ""))]
    .join(", ");
}

function submissionOrder(c: Contribution): number {
  const m = c.id.match(/-(\d+)$/);
  return m ? Number(m[1]) : 0;
}

/** Semua kontribusi (program) dalam pengajuan yang sama, terurut sesuai input. */
export function getSubmissionSiblings(
  list: Contribution[],
  target: Contribution
): Contribution[] {
  const key = getSubmissionKey(target);
  return list
    .filter((c) => getSubmissionKey(c) === key)
    .sort((a, b) => submissionOrder(a) - submissionOrder(b));
}

export function groupContributions(list: Contribution[]): ContributionGroup[] {
  const buckets = new Map<string, Contribution[]>();
  for (const c of list) {
    const key = getSubmissionKey(c);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(c);
    else buckets.set(key, [c]);
  }

  return [...buckets.entries()].map(([key, items]) => {
    const sorted = [...items].sort(
      (a, b) =>
        new Date(a.submissionDate).getTime() -
        new Date(b.submissionDate).getTime()
    );
    const primary = sorted[0];
    return {
      key,
      items: sorted,
      primary,
      instansi: primary.instansi,
      program: uniqueJoin(sorted.map((c) => c.program)),
      paketBantuan: uniqueJoin(sorted.map((c) => c.paketBantuan)),
      workflowStatus: primary.workflowStatus,
      lastUpdate: new Date(
        Math.max(...sorted.map((c) => new Date(c.lastUpdate).getTime()))
      ),
      submissionDate: primary.submissionDate,
      pic: primary.pic,
    };
  });
}
