import { useSyncExternalStore } from "react";

/** Kontrol prototipe: simulasi hasil proses generate draf PKS (Mitra) di backend. */
export type PksScenario = "otomatis" | "diproses" | "lambat" | "gagal" | "selesai";

export const PKS_SCENARIOS: { value: PksScenario; label: string; hint: string }[] = [
  { value: "otomatis", label: "Otomatis (30 dtk)", hint: "Diproses 30 detik lalu berhasil" },
  { value: "diproses", label: "Sedang diproses", hint: "Tertahan di status diproses" },
  { value: "lambat", label: "Proses lambat", hint: "Diproses lebih lama dari biasanya" },
  { value: "gagal", label: "Gagal", hint: "Generate gagal, tampil tombol Coba lagi" },
  { value: "selesai", label: "Berhasil", hint: "Dokumen langsung tersedia" },
];

export const PKS_GENERATE_MS = 30000;

interface State {
  scenario: PksScenario;
  /** Waktu mulai ulang proses (epoch ms), dipakai saat "Coba lagi" / pilih ulang Otomatis. */
  restartAt: number | null;
}

const KEY = "pspb-pks-generate-scenario";
const read = (): State => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* abaikan */
  }
  return { scenario: "otomatis", restartAt: null };
};

let state: State = read();
const listeners = new Set<() => void>();

const set = (next: State) => {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* abaikan */
  }
  listeners.forEach((l) => l());
};

export const setPksScenario = (scenario: PksScenario) =>
  set({ scenario, restartAt: scenario === "otomatis" ? Date.now() : state.restartAt });

/** Coba lagi setelah gagal: proses diulang dari awal dan berjalan normal. */
export const retryPksGenerate = () => set({ scenario: "otomatis", restartAt: Date.now() });

export function usePksScenario(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

/** Status dokumen PKS (Mitra) untuk skenario aktif, berdasarkan waktu data PKS disimpan. */
export function resolvePksDocState(savedAt: number, s: State) {
  switch (s.scenario) {
    case "diproses":
      return { status: "processing" as const };
    case "lambat":
      return { status: "processing" as const, lambat: true };
    case "gagal":
      return { status: "failed" as const };
    case "selesai":
      return {};
    default:
      return { diprosesHingga: Math.max(savedAt, s.restartAt ?? 0) + PKS_GENERATE_MS };
  }
}
