import { useSyncExternalStore } from "react";

/**
 * Kontrol prototipe: dua opsi penempatan verval dampak di dasbor operasional.
 * - "menu": ada menu Verval Dampak sendiri (antrean lintas kontribusi) di sidebar.
 * - "tabel": tanpa menu tambahan; tabel dasbor kontribusi dilengkapi status verval.
 * Aksi verval di tab Pelaksanaan (detail kontribusi) tersedia di kedua opsi.
 */
export type VervalLayout = "menu" | "tabel";

export const VERVAL_LAYOUTS: { value: VervalLayout; label: string; hint: string }[] = [
  { value: "menu", label: "Dengan menu Verval Dampak", hint: "Menu sendiri di sidebar berisi antrean verval lintas kontribusi" },
  { value: "tabel", label: "Tanpa menu, tabel dasbor dilengkapi", hint: "Status verval tampil di tabel Dasbor Operasional" },
];

const KEY = "pspb-verval-layout";

const read = (): VervalLayout => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "menu" || raw === "tabel") return raw;
  } catch {
    /* abaikan */
  }
  return "menu";
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
