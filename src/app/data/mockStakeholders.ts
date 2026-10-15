import type { Stakeholder } from "../types/stakeholder";

export const mockStakeholders: Stakeholder[] = [
  {
    id: "sk001",
    nama: "Dr. Ir. Bambang Sutrisno, M.M.",
    jabatan: "Sekretaris Jenderal",
    alamat: "Jl. Jenderal Sudirman Senayan No. 1, Jakarta Pusat 10270",
    telepon: "021-5701234",
    posElektronik: "sekjen@kemendikdasmen.go.id",
  },
  {
    id: "sk002",
    nama: "Dra. Retno Wulandari, M.Pd.",
    jabatan: "Kepala Biro Kerja Sama dan Hubungan Masyarakat",
    alamat: "Jl. Jenderal Sudirman Senayan No. 1, Jakarta Pusat 10270",
    telepon: "021-5705678",
    posElektronik: "birokerjasama@kemendikdasmen.go.id",
  },
  {
    id: "sk003",
    nama: "Dr. Agus Priyanto, S.T., M.T.",
    jabatan: "Kepala Pusat Data dan Teknologi Informasi",
    alamat: "Jl. R.E. Martadinata No. 5, Jakarta Selatan 12550",
    telepon: "021-7512345",
    posElektronik: "pusdatin@kemendikdasmen.go.id",
  },
];

const PERSIST_KEY = "pspb-stakeholders-v1";

function loadStore(): Stakeholder[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Stakeholder[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [...mockStakeholders];
    }
  }
  return [...mockStakeholders];
}

let store: Stakeholder[] = loadStore();

const listeners = new Set<() => void>();
let version = 0;

export function subscribeStakeholders(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStakeholdersVersion(): number {
  return version;
}

function persistAndNotify(): void {
  version++;
  listeners.forEach((fn) => fn());
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(store));
  } catch {
    return;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== PERSIST_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as Stakeholder[];
      if (Array.isArray(parsed)) {
        store = parsed;
        version++;
        listeners.forEach((fn) => fn());
      }
    } catch {
      return;
    }
  });
}

export function getStakeholders(): Stakeholder[] {
  return store;
}

export function addStakeholder(stakeholder: Stakeholder): void {
  store = [stakeholder, ...store];
  persistAndNotify();
}

export function updateStakeholder(updated: Stakeholder): void {
  store = store.map((s) => (s.id === updated.id ? updated : s));
  persistAndNotify();
}

export function deleteStakeholder(id: string): void {
  store = store.filter((s) => s.id !== id);
  persistAndNotify();
}

export function resetStakeholders(): void {
  store = [...mockStakeholders];
  persistAndNotify();
}
