import { useSyncExternalStore } from "react";
import type { AngkaPublik } from "./verval";

/**
 * Riwayat publikasi dasbor publik. Periode ditentukan admin: tiap kali tombol Publikasikan
 * diklik, angka dampak saat itu menjadi snapshot, dan kenaikan dibandingkan dengan snapshot sebelumnya.
 * Belum ada publikasi berarti web publik masih menampilkan baseline.
 */
export interface PublikasiDampak {
  id: string;
  at: Date;
  oleh: string;
  /** Tambahan di atas baseline pada saat dipublikasikan. */
  angka: AngkaPublik;
}

const KEY = "pspb-publikasi-dampak-v2";

const read = (): PublikasiDampak[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PublikasiDampak[];
    return Array.isArray(parsed) ? parsed.map((p) => ({ ...p, at: new Date(p.at) })) : [];
  } catch {
    return [];
  }
};

let state: PublikasiDampak[] = read();
const listeners = new Set<() => void>();

function simpan(next: PublikasiDampak[]): void {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
}

/** Publikasikan angka dampak saat ini; periode baru dimulai dari sini. */
export function publikasikanDampak(oleh: string, angka: AngkaPublik): PublikasiDampak {
  const entri: PublikasiDampak = { id: `pub-${Date.now()}`, at: new Date(), oleh, angka };
  simpan([...state, entri]);
  return entri;
}

/** Dipanggil saat data demo di-reset. */
export function resetPublikasi(): void {
  simpan([]);
}

export function usePublikasi(): PublikasiDampak[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}
