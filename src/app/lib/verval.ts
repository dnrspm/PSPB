import type {
  ActivityLog,
  Contribution,
  DampakPelaksanaan,
  PelaksanaanInfo,
  UserRole,
  VervalDampak,
  VervalKeputusan,
  VervalRiwayat,
  VervalStatus,
} from "../types/contribution";
import { getContributionById, getContributions, updateContribution } from "../data/mockWorkspace";
import { akumulasiRealisasi } from "./dampak";
import { getVervalLayout, vervalSaatSelesai } from "./vervalLayout";
import { PROGRAM_UNIT_KERJA_DEFAULTS, SUB_TYPE_UNIT_KERJA_MAP } from "./workflow";

/** Hanya realisasi per log penyaluran yang diverval; target dampak dicatat tanpa verval. */
export type JenisDampak = "realisasi";

/** Hanya Biro Kerja Sama (Biro Perencanaan dan Kerja Sama) yang boleh memverval dampak. */
export const VERVAL_ROLE: UserRole = "biro-perencanaan";

export function bolehVerval(role: UserRole): boolean {
  return role === VERVAL_ROLE;
}

export const VERVAL_STATUS_LABELS: Record<VervalStatus, string> = {
  menunggu: "Menunggu Verval",
  disetujui: "Disetujui",
  "disetujui-revisi": "Disetujui dengan Revisi",
  "tidak-relevan": "Tidak Relevan",
};

export const VERVAL_STATUS_VARIANT: Record<VervalStatus, "warning" | "success" | "informational" | "neutral"> = {
  menunggu: "warning",
  disetujui: "success",
  "disetujui-revisi": "informational",
  "tidak-relevan": "neutral",
};

export const VERVAL_KEPUTUSAN_LABELS: Record<VervalKeputusan, string> = {
  setuju: "Setuju",
  revisi: "Setuju dengan revisi",
  "tidak-relevan": "Tidak relevan",
};

export const VERVAL_KEPUTUSAN_DESKRIPSI: Record<VervalKeputusan, string> = {
  setuju: "Nilai yang diajukan sesuai dan langsung dihitung sebagai dampak.",
  revisi: "Nilai perlu dikoreksi. Nilai hasil revisi yang dihitung, nilai semula tetap tersimpan di riwayat.",
  "tidak-relevan": "Data tidak dipakai dan tidak dihitung, misalnya karena ganda atau salah input.",
};

export type DampakKey = "siswa" | "guru" | "satuanPendidikan" | "bantuan" | "wilayah";

export interface DampakFieldDef {
  key: DampakKey;
  label: string;
  /** Label singkat untuk ringkasan perubahan revisi. */
  singkat: string;
  /** Angka (true) atau daftar kabupaten/kota (false). */
  angka: boolean;
}

export const DAMPAK_FIELDS: DampakFieldDef[] = [
  { key: "siswa", label: "Siswa Terdampak", singkat: "Siswa", angka: true },
  { key: "guru", label: "Guru Terdampak", singkat: "Guru", angka: true },
  { key: "satuanPendidikan", label: "Satuan Pendidikan Terdampak", singkat: "Satuan pendidikan", angka: true },
  { key: "bantuan", label: "Satuan Pendidikan Penerima Bantuan", singkat: "Penerima bantuan", angka: true },
  { key: "wilayah", label: "Kabupaten/Kota yang Dibantu", singkat: "Kabupaten/kota", angka: false },
];

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const dua = (n: number) => String(n).padStart(2, "0");

/** Format PRD: "Jam:Menit:Detik, Tanggal Bulan Tahun". */
export function formatWaktuVerval(date: Date): string {
  const d = new Date(date);
  return `${dua(d.getHours())}:${dua(d.getMinutes())}:${dua(d.getSeconds())}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatAngka(n?: number): string {
  return n === undefined || n === null ? "–" : n.toLocaleString("id-ID");
}

export function splitWilayah(wilayah: string): string[] {
  return wilayah.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Nilai satu field dampak sebagai teks siap tampil. */
export function teksField(d: DampakPelaksanaan, key: DampakKey): string {
  if (key === "wilayah") return d.wilayah ? d.wilayah : "–";
  return formatAngka(d[key]);
}

export function unitKerjaOf(c: Contribution): string {
  if (c.unitKerja) return c.unitKerja;
  const def = PROGRAM_UNIT_KERJA_DEFAULTS[c.program];
  if (def) return def;
  if (c.program === "Kebutuhan Pendidikan Lainnya" && c.paketBantuan) {
    return SUB_TYPE_UNIT_KERJA_MAP[c.paketBantuan] || "-";
  }
  return "-";
}

/** Pembuka riwayat saat realisasi baru diajukan. */
export function vervalBaru(
  oleh: string,
  at: Date = new Date(),
  teks = "Menambahkan log penyaluran dengan realisasi dampak"
): VervalDampak {
  return {
    status: "menunggu",
    diajukanOleh: oleh,
    diajukanPada: at,
    diperbaruiOleh: oleh,
    diperbaruiPada: at,
    riwayat: [
      {
        at,
        by: oleh,
        jenis: "ajukan",
        text: teks,
      },
    ],
  };
}

/* ────────────── Antrean verval ────────────── */

export interface AntreanItem {
  /** Kunci unik, dipakai juga untuk pilihan massal. */
  key: string;
  jenis: JenisDampak;
  contribution: Contribution;
  /** Kosong pada opsi verval saat selesai: satu item mewakili total realisasi kontribusi. */
  logId?: string;
  /** Jumlah log penyaluran yang menjadi dasar total (opsi verval saat selesai). */
  jumlahLog?: number;
  logJudul?: string;
  logTanggal?: Date;
  logDeskripsi?: string;
  logDokumen?: string;
  dampak: DampakPelaksanaan;
  verval: VervalDampak;
}

export function kunciAntrean(contributionId: string, logId?: string): string {
  return `${contributionId}:${logId ?? "akhir"}`;
}

/** Seluruh realisasi (log penyaluran) yang punya status verval. Data lama tanpa status tidak ikut. */
export function bangunAntrean(list: Contribution[] = getContributions()): AntreanItem[] {
  const items: AntreanItem[] = [];
  for (const c of list) {
    const p = c.pelaksanaan;
    if (!p) continue;
    if (vervalSaatSelesai(getVervalLayout())) {
      // Verval sekali per kontribusi: total realisasi yang diajukan saat Terlaksana
      if (p.realisasiAkhir && p.vervalAkhir) {
        items.push({
          key: kunciAntrean(c.id),
          jenis: "realisasi",
          contribution: c,
          jumlahLog: (p.progressUpdates || []).filter((u) => u.realisasi).length,
          logTanggal: p.completionDate,
          dampak: p.realisasiAkhir,
          verval: p.vervalAkhir,
        });
      }
      continue;
    }
    for (const u of p.progressUpdates || []) {
      if (!u.realisasi || !u.verval) continue;
      items.push({
        key: kunciAntrean(c.id, u.id),
        jenis: "realisasi",
        contribution: c,
        logId: u.id,
        logJudul: u.judul,
        logTanggal: u.tanggal,
        logDeskripsi: u.deskripsi,
        logDokumen: u.dokumen[0]?.name,
        dampak: u.realisasi,
        verval: u.verval,
      });
    }
  }
  return items;
}

export interface JumlahMenunggu {
  realisasi: number;
  total: number;
}

export function hitungMenunggu(items: AntreanItem[]): JumlahMenunggu {
  const realisasi = items.filter((i) => i.verval.status === "menunggu").length;
  return { realisasi, total: realisasi };
}

/** Item verval milik satu kontribusi (per log penyaluran), untuk tab Pelaksanaan. */
export function antreanKontribusi(contributionId: string): AntreanItem[] {
  const c = getContributionById(contributionId);
  return c ? bangunAntrean([c]) : [];
}

/* ────────────── Menerapkan keputusan ────────────── */

export interface TerapkanVervalInput {
  contributionId: string;
  logId?: string;
  keputusan: VervalKeputusan;
  catatan?: string;
  /** Nilai hasil revisi; hanya dipakai bila keputusan = revisi. */
  nilaiRevisi?: DampakPelaksanaan;
  oleh: string;
}

export type TerapkanVervalHasil =
  | { ok: true; pesan: string }
  | { ok: false; error: string };

const STATUS_DARI_KEPUTUSAN: Record<VervalKeputusan, VervalStatus> = {
  setuju: "disetujui",
  revisi: "disetujui-revisi",
  "tidak-relevan": "tidak-relevan",
};

function sama(a: DampakPelaksanaan, b: DampakPelaksanaan, key: DampakKey): boolean {
  if (key === "wilayah") return splitWilayah(a.wilayah || "").join("|") === splitWilayah(b.wilayah || "").join("|");
  return (a[key] ?? undefined) === (b[key] ?? undefined);
}

function ringkasPerubahan(semula: DampakPelaksanaan, baru: DampakPelaksanaan): string {
  return DAMPAK_FIELDS.filter((f) => !sama(semula, baru, f.key))
    .map((f) => `${f.singkat}: ${teksField(semula, f.key)} → ${teksField(baru, f.key)}`)
    .join("; ");
}

function terapkanKeVerval(
  verval: VervalDampak,
  keputusan: VervalKeputusan,
  oleh: string,
  catatan: string,
  at: Date,
  perubahan?: string
): VervalDampak {
  const label = "realisasi dampak";
  let text = `Menyetujui ${label}`;
  if (keputusan === "revisi") text = `Menyetujui ${label} dengan revisi (${perubahan})`;
  if (keputusan === "tidak-relevan") text = `Menandai ${label} tidak relevan`;
  const entri: VervalRiwayat = { at, by: oleh, jenis: keputusan, text, ...(catatan ? { note: catatan } : {}) };
  return {
    ...verval,
    status: STATUS_DARI_KEPUTUSAN[keputusan],
    diperbaruiOleh: oleh,
    diperbaruiPada: at,
    catatan: catatan || undefined,
    riwayat: [...verval.riwayat, entri],
  };
}

/** Terapkan keputusan ke target atau satu log realisasi, lalu catat di aktivitas kontribusi. */
export function terapkanVerval(input: TerapkanVervalInput): TerapkanVervalHasil {
  const c = getContributionById(input.contributionId);
  const p = c?.pelaksanaan;
  if (!c || !p) return { ok: false, error: "Kontribusi tidak ditemukan. Muat ulang halaman, lalu coba lagi." };

  // Tanpa logId: verval total realisasi saat selesai
  const totalAkhir = !input.logId;
  const log = totalAkhir ? undefined : p.progressUpdates?.find((u) => u.id === input.logId);
  const dampakAsal = totalAkhir ? p.realisasiAkhir : log?.realisasi;
  const vervalAsal = totalAkhir ? p.vervalAkhir : log?.verval;
  if (!dampakAsal || !vervalAsal) return { ok: false, error: "Data dampak tidak ditemukan. Muat ulang halaman, lalu coba lagi." };
  if (vervalAsal.status !== "menunggu") return { ok: false, error: "Data ini sudah diverval. Muat ulang halaman untuk melihat keputusan terbaru." };

  const catatan = (input.catatan || "").trim();
  if (input.keputusan === "tidak-relevan" && !catatan) {
    return { ok: false, error: "Tulis alasan data ini tidak relevan agar keputusan bisa ditelusuri." };
  }

  let dampakBaru = dampakAsal;
  let nilaiSemula: Partial<DampakPelaksanaan> | undefined;
  let perubahan: string | undefined;

  if (input.keputusan === "revisi") {
    const rev = input.nilaiRevisi;
    if (!rev) return { ok: false, error: "Isi nilai hasil revisi, lalu simpan." };
    const salah = DAMPAK_FIELDS.filter((f) => {
      if (!f.angka) return splitWilayah(rev.wilayah || "").length === 0;
      const v = rev[f.key as "siswa" | "guru" | "satuanPendidikan" | "bantuan"];
      // Data lama belum punya jumlah penerima bantuan; boleh tetap kosong.
      if (v === undefined) return !(f.key === "bantuan" && dampakAsal.bantuan === undefined);
      return !Number.isInteger(v) || v < 0;
    }).map((f) => f.label);
    if (salah.length) return { ok: false, error: `Periksa nilai berikut: ${salah.join(", ")}. Isi angka 0 atau lebih.` };
    const berubah = DAMPAK_FIELDS.filter((f) => !sama(dampakAsal, rev, f.key));
    if (berubah.length === 0) {
      return { ok: false, error: "Belum ada nilai yang diubah. Ubah minimal satu nilai, atau pilih Setuju." };
    }
    if (!catatan) return { ok: false, error: "Tulis catatan revisi agar perubahan nilai bisa ditelusuri." };
    nilaiSemula = {};
    for (const f of berubah) (nilaiSemula as Record<string, unknown>)[f.key] = dampakAsal[f.key];
    perubahan = ringkasPerubahan(dampakAsal, rev);
    dampakBaru = { ...rev, wilayah: splitWilayah(rev.wilayah || "").join(", ") };
  }

  const at = new Date();
  const vervalBaruObj = {
    ...terapkanKeVerval(vervalAsal, input.keputusan, input.oleh, catatan, at, perubahan),
    ...(nilaiSemula ? { nilaiSemula } : {}),
  };

  let pelaksanaan: PelaksanaanInfo = { ...p, realisasiAkhir: dampakBaru, vervalAkhir: vervalBaruObj };
  if (!totalAkhir) {
    const updates = (p.progressUpdates || []).map((u) =>
      u.id === input.logId ? { ...u, realisasi: dampakBaru, verval: vervalBaruObj } : u
    );
    const total = akumulasiRealisasi(updates);
    pelaksanaan = { ...p, progressUpdates: updates, realisasiDampak: total };
  }

  const aktivitas: ActivityLog = {
    id: `a${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: at,
    actor: input.oleh,
    actorRole: VERVAL_ROLE,
    action: "Verval Realisasi Dampak",
    notes: catatan || undefined,
    fields: {
      Keputusan: VERVAL_STATUS_LABELS[STATUS_DARI_KEPUTUSAN[input.keputusan]],
      ...(log ? { "Log penyaluran": log.judul } : {}),
      ...(totalAkhir ? { Cakupan: "Total realisasi saat kontribusi selesai" } : {}),
      ...(perubahan ? { "Nilai direvisi": perubahan } : {}),
    },
    fromState: c.workflowStatus,
    toState: c.workflowStatus,
  };

  updateContribution({ ...c, lastUpdate: at, pelaksanaan, aktivitas: [...c.aktivitas, aktivitas] });

  const subjek = `Realisasi dampak ${c.namaMitra}`;
  const akhir: Record<VervalKeputusan, string> = {
    setuju: "disetujui.",
    revisi: "disetujui dengan revisi.",
    "tidak-relevan": "ditandai tidak relevan dan tidak dihitung.",
  };
  return { ok: true, pesan: `${subjek} ${akhir[input.keputusan]}` };
}

/** Setujui sekaligus semua item yang masih menunggu. Mengembalikan jumlah yang berhasil. */
export function setujuiMassal(keys: string[], oleh: string): number {
  const antrean = bangunAntrean();
  let berhasil = 0;
  for (const key of keys) {
    const item = antrean.find((i) => i.key === key);
    if (!item || item.verval.status !== "menunggu") continue;
    const hasil = terapkanVerval({
      contributionId: item.contribution.id,
      logId: item.logId,
      keputusan: "setuju",
      oleh,
    });
    if (hasil.ok) berhasil += 1;
  }
  return berhasil;
}

/* ────────────── Preview dasbor dampak ────────────── */

/**
 * Angka dasbor dampak yang sudah tayang sebelum verval ada (hasil input manual).
 * Dipakai sebagai baseline: hanya dampak yang disetujui setelah cut-off ini yang ditambahkan.
 */
export const BASELINE_DAMPAK = { siswa: 411233, guru: 21981, satuanPendidikan: 113 };

/**
 * Angka lain di dasbor publik yang belum terhubung ke data kontribusi prototipe (nilai tampilan saja):
 * jumlah program, daerah, dan mitra beserta yang masih dalam perencanaan atau pengajuan.
 */
export const DASBOR_PUBLIK_LAINNYA = {
  rencana: { program: 15, daerah: 240 },
  program: 29,
  daerah: "120+",
  mitra: 92,
  mitraPengajuan: 28,
};

export interface RingkasanDashboard {
  siswa: number;
  guru: number;
  satuanPendidikan: number;
  /** Waktu keputusan setuju terakhir; kosong bila belum ada. */
  terakhir?: Date;
  /** Tambahan yang sudah disetujui sampai akhir bulan lalu, pembanding kenaikan bulanan. */
  sampaiBulanLalu: { siswa: number; guru: number; satuanPendidikan: number };
  /** Akhir bulan lalu (pembanding); dipakai untuk keterangan. */
  akhirBulanLalu: Date;
}

/** Tambahan dampak dari realisasi yang disetujui (dengan atau tanpa revisi), di atas baseline. */
export function ringkasanDashboard(items: AntreanItem[], sekarang: Date = new Date()): RingkasanDashboard {
  const dihitung = items.filter((i) => i.verval.status === "disetujui" || i.verval.status === "disetujui-revisi");
  const waktu = dihitung.map((i) => new Date(i.verval.diperbaruiPada).getTime());
  // Dasbor publik diasumsikan diperbarui tiap bulan: pembandingnya posisi di akhir bulan lalu
  const awalBulanIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
  const lalu = dihitung.filter((i) => new Date(i.verval.diperbaruiPada) < awalBulanIni);
  const jumlah = (list: AntreanItem[], k: "siswa" | "guru" | "satuanPendidikan") =>
    list.reduce((n, i) => n + (i.dampak[k] || 0), 0);
  return {
    sampaiBulanLalu: {
      siswa: jumlah(lalu, "siswa"),
      guru: jumlah(lalu, "guru"),
      satuanPendidikan: jumlah(lalu, "satuanPendidikan"),
    },
    akhirBulanLalu: new Date(awalBulanIni.getTime() - 1),
    siswa: dihitung.reduce((n, i) => n + (i.dampak.siswa || 0), 0),
    guru: dihitung.reduce((n, i) => n + (i.dampak.guru || 0), 0),
    satuanPendidikan: dihitung.reduce((n, i) => n + (i.dampak.satuanPendidikan || 0), 0),
    terakhir: waktu.length ? new Date(Math.max(...waktu)) : undefined,
  };
}

/* ────────────── Ringkasan verval per kontribusi (kolom tabel dasbor) ────────────── */

export interface HitungStatus {
  menunggu: number;
  disetujui: number;
  revisi: number;
  tidakRelevan: number;
  total: number;
}

export interface RingkasanVerval {
  realisasi: HitungStatus;
  /** Jumlah realisasi yang masih menunggu verval. */
  menunggu: number;
}

function hitungStatus(items: AntreanItem[]): HitungStatus {
  const n = (s: VervalStatus) => items.filter((i) => i.verval.status === s).length;
  return {
    menunggu: n("menunggu"),
    disetujui: n("disetujui"),
    revisi: n("disetujui-revisi"),
    tidakRelevan: n("tidak-relevan"),
    total: items.length,
  };
}

/** Status verval gabungan untuk satu pengajuan (bisa memuat beberapa kontribusi/program). */
export function ringkasVerval(list: Contribution[]): RingkasanVerval {
  const antrean = bangunAntrean(list);
  const realisasi = hitungStatus(antrean);
  return { realisasi, menunggu: realisasi.menunggu };
}

/** Status tunggal yang mewakili sekumpulan data: menunggu dulu, lalu revisi, lalu disetujui. */
export function statusGabungan(h: HitungStatus): VervalStatus | null {
  if (h.total === 0) return null;
  if (h.menunggu > 0) return "menunggu";
  if (h.revisi > 0) return "disetujui-revisi";
  if (h.disetujui > 0) return "disetujui";
  return "tidak-relevan";
}
