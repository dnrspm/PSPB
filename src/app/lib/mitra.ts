import type {
  BadanHukum,
  MitraDokumen,
  MitraProfile,
  MitraSession,
  VerifikasiStatus,
} from "../types/mitra";
import type { Contribution } from "../types/contribution";
import { getContributions, mockContributions } from "../data/mockWorkspace";

const ACCOUNTS_KEY = "pspb_mitra_accounts";
const SESSION_KEY = "pspb_mitra_session";

export const BADAN_HUKUM_OPTIONS: BadanHukum[] = [
  "PT",
  "Yayasan",
  "BUMN/BUMD",
  "CV",
  "Mitra pembangunan bilateral/multilateral",
  "Organisasi kemasyarakatan",
  "Lainnya",
];

export const DOKUMEN_VALIDASI_JENIS = [
  "Surat Pengajuan Kerjasama",
  "Proposal Kerjasama",
  "Rencana Kerja",
] as const;

export const MAX_DOKUMEN_SIZE = 10 * 1024 * 1024; // 10 MB

const VERIFIKASI_STATUS_LABEL: Record<VerifikasiStatus, string> = {
  "belum-lengkap": "Dokumen Belum Lengkap",
  "menunggu-verifikasi": "Menunggu Verifikasi",
  terverifikasi: "Terverifikasi",
  ditolak: "Verifikasi Ditolak",
};

export function verifikasiStatusLabel(status: VerifikasiStatus): string {
  return VERIFIKASI_STATUS_LABEL[status];
}

// ---------- Persistence helpers ----------

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Seeding from mock contributions ----------

function seedAccounts(): MitraProfile[] {
  return mockContributions.map((c) => {
    const nama = c.narahubung || c.namaMitra || "";
    return {
      email: c.email,
      password: "Mitra@123",
      nama,
      nomorTelepon: c.kontak || "",
      jabatan: c.jabatan || "",
      namaPerusahaan: c.instansi || c.namaMitra,
      badanHukum: c.badanHukum || "PT",
      statusMitra: "lama",
      companyProfile: {
        id: `cp-${c.id}`,
        jenis: "Company Profile",
        fileName: `${c.namaMitra} - Company Profile.pdf`,
        uploadedAt: new Date(c.submissionDate).toISOString(),
      },
      dokumen: c.dokumen.map((d) => ({
        id: d.id,
        jenis: d.name,
        fileName: d.name,
        uploadedAt: new Date(d.uploadedAt).toISOString(),
      })),
      verifikasiStatus: "terverifikasi",
      createdAt: new Date(c.submissionDate).toISOString(),
    };
  });
}

export function getMitraAccounts(): MitraProfile[] {
  const accounts = readJson<MitraProfile[]>(ACCOUNTS_KEY, []);
  if (accounts.length > 0) return accounts;
  const seeded = seedAccounts();
  writeJson(ACCOUNTS_KEY, seeded);
  return seeded;
}

function saveAccounts(accounts: MitraProfile[]): void {
  writeJson(ACCOUNTS_KEY, accounts);
}

// ---------- Session ----------

export function getMitraSession(): MitraSession | null {
  return readJson<MitraSession | null>(SESSION_KEY, null);
}

export function setMitraSession(session: MitraSession): void {
  writeJson(SESSION_KEY, session);
}

export function clearMitraSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isMitraLoggedIn(): boolean {
  return getMitraSession() !== null;
}

// ---------- Login / Registrasi ----------

export interface AuthResult {
  ok: boolean;
  error?: string;
  profile?: MitraProfile;
}

export function loginMitra(email: string, password: string): AuthResult {
  const accounts = getMitraAccounts();
  const profile = accounts.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!profile) {
    return { ok: false, error: "Akun belum terdaftar. Silakan lakukan registrasi terlebih dahulu." };
  }
  if (profile.password !== password) {
    return { ok: false, error: "Email atau kata sandi salah." };
  }
  setMitraSession({
    email: profile.email,
    nama: profile.nama,
    namaPerusahaan: profile.namaPerusahaan,
  });
  return { ok: true, profile };
}

export function registerMitra(
  profile: Omit<MitraProfile, "createdAt" | "dokumen" | "verifikasiStatus">
): AuthResult {
  const accounts = getMitraAccounts();
  const existing = accounts.find(
    (a) => a.email.toLowerCase() === profile.email.toLowerCase()
  );
  if (existing) {
    return { ok: false, error: "Email sudah digunakan. Silakan gunakan email lain." };
  }
  const newProfile: MitraProfile = {
    ...profile,
    dokumen: [],
    verifikasiStatus: "belum-lengkap",
    createdAt: new Date().toISOString(),
  };
  accounts.push(newProfile);
  saveAccounts(accounts);
  setMitraSession({
    email: newProfile.email,
    nama: newProfile.nama,
    namaPerusahaan: newProfile.namaPerusahaan,
  });
  return { ok: true, profile: newProfile };
}

// ---------- Profil ----------

export function getMitraProfile(email: string): MitraProfile | null {
  const accounts = getMitraAccounts();
  return (
    accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null
  );
}

export function updateMitraProfile(
  email: string,
  patch: Partial<MitraProfile>
): MitraProfile | null {
  const accounts = getMitraAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) return null;
  accounts[idx] = { ...accounts[idx], ...patch, email: accounts[idx].email };
  saveAccounts(accounts);
  return accounts[idx];
}

// ---------- Dokumen ----------

export function addMitraDokumen(
  email: string,
  dokumen: Omit<MitraDokumen, "id" | "uploadedAt">
): MitraProfile | null {
  const accounts = getMitraAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) return null;
  const duplicate = accounts[idx].dokumen.some(
    (d) => d.jenis.toLowerCase() === dokumen.jenis.toLowerCase()
  );
  if (duplicate) return null;
  const item: MitraDokumen = {
    ...dokumen,
    id: `md-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    uploadedAt: new Date().toISOString(),
  };
  accounts[idx] = {
    ...accounts[idx],
    dokumen: [...accounts[idx].dokumen, item],
    verifikasiStatus: "menunggu-verifikasi",
  };
  saveAccounts(accounts);
  return accounts[idx];
}

export function removeMitraDokumen(email: string, dokumenId: string): MitraProfile | null {
  const accounts = getMitraAccounts();
  const idx = accounts.findIndex(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
  if (idx === -1) return null;
  accounts[idx] = {
    ...accounts[idx],
    dokumen: accounts[idx].dokumen.filter((d) => d.id !== dokumenId),
  };
  saveAccounts(accounts);
  return accounts[idx];
}

// ---------- Kontribusi ----------

export function getMitraContributions(email: string): Contribution[] {
  return getContributions().filter(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase()
  );
}

export function getMitraContributionById(email: string, id: string): Contribution | null {
  return (
    getContributions().find(
      (c) =>
        c.id === id && c.email.toLowerCase() === email.trim().toLowerCase()
    ) || null
  );
}
