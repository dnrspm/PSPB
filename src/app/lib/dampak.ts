import type { DampakPelaksanaan, PelaksanaanInfo, ProgressUpdate } from "../types/contribution";

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
 * Realisasi dampak adalah akumulasi seluruh log penyaluran, bukan cerminan log terakhir:
 * angka dijumlahkan, wilayah digabung unik.
 */
export function akumulasiRealisasi(updates: ProgressUpdate[] = []): DampakPelaksanaan | undefined {
  const realisasi = updates.map((u) => u.realisasi).filter((r): r is DampakPelaksanaan => !!r);
  if (realisasi.length === 0) return undefined;
  return {
    siswa: realisasi.reduce((n, r) => n + (r.siswa || 0), 0),
    guru: realisasi.reduce((n, r) => n + (r.guru || 0), 0),
    satuanPendidikan: realisasi.reduce((n, r) => n + (r.satuanPendidikan || 0), 0),
    wilayah: gabungWilayah(realisasi.map((r) => r.wilayah || "")),
  };
}

/** Total dari log bila ada; bila belum ada log berdampak, pakai realisasi tersimpan. */
export function realisasiTerkini(p: PelaksanaanInfo): DampakPelaksanaan | undefined {
  return akumulasiRealisasi(p.progressUpdates) || p.realisasiDampak;
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
