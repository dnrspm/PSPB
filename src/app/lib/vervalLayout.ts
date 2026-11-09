import { useSyncExternalStore } from "react";

/**
 * Kontrol prototipe: kondisi eksisting dan dua opsi penempatan verval dampak di dasbor operasional.
 * - "eksisting": kondisi sebelum fitur verval dampak (tanpa status verval, menu, maupun field baru).
 * - "menu-ringkas": menu Verval Dampak (antrean); tabel Ringkasan Kontribusi tidak berubah.
 * - "tabel": tanpa menu tambahan; tabel dasbor kontribusi dilengkapi status verval. Verval juga hanya saat status Selesai.
 * Aksi verval di tab Pelaksanaan (detail kontribusi) tersedia di kedua opsi.
 */
export type VervalLayout = "eksisting" | "menu-ringkas" | "tabel";

export const VERVAL_LAYOUTS: { value: VervalLayout; label: string; hint: string }[] = [
  { value: "eksisting", label: "Kondisi eksisting (tanpa verval dampak)", hint: "Seperti sebelum fitur verval dampak: target dan realisasi tidak diverval" },
  { value: "menu-ringkas", label: "Sesuai PRD", hint: "Antrean di menu Verval Dampak; tabel Ringkasan Kontribusi tidak berubah" },
  { value: "tabel", label: "Diskusi 5 Nov", hint: "Status verval tampil di tabel Dasbor Operasional; total realisasi diverval sekali saat kontribusi Selesai" },
];

const KEY = "pspb-verval-layout";

const read = (): VervalLayout => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "eksisting" || raw === "menu-ringkas" || raw === "tabel") return raw;
  } catch {
    /* abaikan */
  }
  return "menu-ringkas";
};

let state: VervalLayout = read();
const listeners = new Set<() => void>();

export function setVervalLayout(next: VervalLayout): void {
  state = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
}

/** Baca opsi aktif di luar komponen (mis. aturan hitung). */
export function getVervalLayout(): VervalLayout {
  return state;
}

export function useVervalLayout(): VervalLayout {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}

/** Opsi yang menampilkan menu Verval Dampak di sidebar. */
export function punyaMenuVerval(layout: VervalLayout): boolean {
  return layout === "menu-ringkas";
}

/** Opsi yang memverval total realisasi sekali saat kontribusi Selesai, bukan per log penyaluran. */
export function vervalSaatSelesai(layout: VervalLayout): boolean {
  return layout === "tabel";
}
