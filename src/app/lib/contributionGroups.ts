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

export interface PaketBantuanEntry {
  id: string;
  /** Kontribusi asal pengajuan; kosong untuk paket yang ditambahkan atau diganti mitra saat mengisi Data PKS. */
  c?: Contribution;
  jenis: string;
  /** Deskripsi yang diinput mitra pada Data PKS ("" bila belum diisi). */
  deskripsi: string;
}

/**
 * Daftar paket dukungan sesuai isian terakhir Data PKS Mitra: paket yang dihapus
 * mitra tidak ikut, paket yang ditambahkan mitra ikut. Sebelum Data PKS diisi,
 * mengembalikan seluruh kontribusi pengajuan apa adanya.
 */
export function resolvePaketBantuan(siblings: Contribution[]): PaketBantuanEntry[] {
  const asIs = (): PaketBantuanEntry[] =>
    siblings.map((c) => ({ id: c.id, c, jenis: c.program, deskripsi: "" }));

  const latest = siblings
    .flatMap((c) => c.aktivitas)
    .filter((a) => a.action === "Isi Data PKS Mitra" && a.fields)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .pop();
  const fields = latest?.fields;
  if (!fields) return asIs();

  const entries: PaketBantuanEntry[] = [];
  for (const c of siblings) {
    const jenis = fields[`${c.id}__jenis`];
    if (jenis) {
      entries.push({
        id: c.id,
        // Paket diganti mitra = bantuan lain, diperlakukan seperti paket tambahan.
        c: jenis === c.program ? c : undefined,
        jenis,
        deskripsi: fields[`${c.id}__deskripsi`] ?? "",
      });
    }
  }
  for (const key of Object.keys(fields)) {
    const m = key.match(/^(.+)__jenis$/);
    if (m && !siblings.some((c) => c.id === m[1])) {
      entries.push({
        id: m[1],
        jenis: fields[key],
        deskripsi: fields[`${m[1]}__deskripsi`] ?? "",
      });
    }
  }
  return entries.length > 0 ? entries : asIs();
}
