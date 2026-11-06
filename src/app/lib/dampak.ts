import { getVervalLayout, vervalSaatSelesai } from "./vervalLayout";
import type { DampakPelaksanaan, PelaksanaanInfo, ProgressUpdate, VervalDampak } from "../types/contribution";

/** Gabungkan daftar "Kab (Prov), Kab (Prov)" tanpa duplikat, urut sesuai pencatatan. */
function gabungWilayah(list: string[]): string {
  const items: string[] = [];
  for (const wilayah of list) {
    for (const item of wilayah.split(",").map((s) => s.trim())) {
      if (item && !items.includes(item)) items.push(item);
    }
  }
  return items.join(", ");
}

/**
 * Dampak ikut dihitung bila sudah disetujui (dengan atau tanpa revisi).
 * Data lama tanpa status verval dianggap baseline yang sudah dihitung.
 */
export function vervalDihitung(verval?: VervalDampak): boolean {
  // Kondisi eksisting (tanpa verval) dan opsi verval saat selesai: semua log penyaluran dihitung
  const layout = getVervalLayout();
  if (layout === "eksisting" || vervalSaatSelesai(layout)) return true;
  return !verval || verval.status === "disetujui" || verval.status === "disetujui-revisi";
}

function jumlahkan(realisasi: DampakPelaksanaan[]): DampakPelaksanaan | undefined {
  if (realisasi.length === 0) return undefined;
  return {
    siswa: realisasi.reduce((n, r) => n + (r.siswa || 0), 0),
    guru: realisasi.reduce((n, r) => n + (r.guru || 0), 0),
    satuanPendidikan: realisasi.reduce((n, r) => n + (r.satuanPendidikan || 0), 0),
    // Data lama belum punya jumlah penerima bantuan; biarkan kosong, bukan 0.
    ...(realisasi.some((r) => r.bantuan !== undefined)
      ? { bantuan: realisasi.reduce((n, r) => n + (r.bantuan || 0), 0) }
      : {}),
    wilayah: gabungWilayah(realisasi.map((r) => r.wilayah || "")),
  };
}

/** Akumulasi log yang disetujui, tidak bergantung pada opsi prototipe (untuk data contoh). */
export function akumulasiDisetujui(updates: ProgressUpdate[] = []): DampakPelaksanaan | undefined {
  return jumlahkan(
    updates
      .filter((u) => u.realisasi && (!u.verval || u.verval.status === "disetujui" || u.verval.status === "disetujui-revisi"))
      .map((u) => u.realisasi as DampakPelaksanaan)
  );
}

/**
 * Realisasi dampak adalah akumulasi log penyaluran yang sudah diverval (disetujui),
 * bukan cerminan log terakhir: angka dijumlahkan, wilayah digabung unik.
 */
export function akumulasiRealisasi(updates: ProgressUpdate[] = []): DampakPelaksanaan | undefined {
  return jumlahkan(
    updates
      .filter((u) => u.realisasi && vervalDihitung(u.verval))
      .map((u) => u.realisasi as DampakPelaksanaan)
  );
}

/** Tanpa verval per log (kondisi eksisting, atau verval baru dilakukan saat selesai). */
function semuaLog(): boolean {
  const layout = getVervalLayout();
  return layout === "eksisting" || vervalSaatSelesai(layout);
}

/** Akumulasi seluruh log yang pernah dicatat, termasuk yang masih menunggu verval (tanpa yang tidak relevan). */
export function akumulasiTercatat(updates: ProgressUpdate[] = []): DampakPelaksanaan | undefined {
  return jumlahkan(
    updates
      .filter((u) => u.realisasi && (semuaLog() || u.verval?.status !== "tidak-relevan"))
      .map((u) => u.realisasi as DampakPelaksanaan)
  );
}

/** Total dari log yang sudah diverval bila ada; bila belum ada log berdampak, pakai realisasi tersimpan. */
export function realisasiTerkini(p: PelaksanaanInfo): DampakPelaksanaan | undefined {
  if (vervalSaatSelesai(getVervalLayout()) && p.vervalAkhir) {
    // Total saat selesai: hanya dihitung bila sudah disetujui (dengan atau tanpa revisi)
    return vervalDihitung(p.vervalAkhir) ? p.realisasiAkhir : undefined;
  }
  const adaVerval = !semuaLog() && (p.progressUpdates || []).some((u) => u.realisasi && u.verval);
  const total = akumulasiRealisasi(p.progressUpdates);
  // Sudah memakai verval: jangan jatuh ke angka tersimpan yang bisa memuat data belum disetujui
  return total || (adaVerval ? undefined : p.realisasiDampak);
}

/** Realisasi yang sudah dicatat (belum tentu disetujui). Dipakai sebagai syarat menandai Terlaksana. */
export function realisasiTercatat(p: PelaksanaanInfo): DampakPelaksanaan | undefined {
  return akumulasiTercatat(p.progressUpdates) || p.realisasiDampak;
}

/** Pecah "Kab (Prov), Kab (Prov)" menjadi kelompok kabupaten per provinsi. */
export function groupWilayah(wilayah: string) {
  const order: string[] = [];
  const map = new Map<string, string[]>();
  const lainnya: string[] = [];

  const matches = [...wilayah.matchAll(/([^,()]+?)\s*\(([^()]+)\)/g)];
  for (const m of matches) {
    const kabupaten = m[1].trim();
    const provinsi = m[2].trim();
    if (!kabupaten) continue;
    if (!map.has(provinsi)) {
      map.set(provinsi, []);
      order.push(provinsi);
    }
    map.get(provinsi)!.push(kabupaten);
  }
  // Data lama tanpa format "(provinsi)" tetap ditampilkan apa adanya.
  if (matches.length === 0) {
    for (const item of wilayah.split(",").map((s) => s.trim())) {
      if (item) lainnya.push(item);
    }
  }

  const groups = order.map((provinsi) => ({ provinsi, kabupaten: map.get(provinsi)! }));
  const totalKabupaten = groups.reduce((n, g) => n + g.kabupaten.length, 0) + lainnya.length;
  return { groups, lainnya, totalKabupaten };
}
