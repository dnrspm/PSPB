import type { WorkflowState, WorkflowAction, UserRole } from "../types/contribution";

export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  "kontribusi-masuk": "Kontribusi Masuk",
  "audiensi-menunggu-jadwal": "Audiensi - Menunggu Jadwal",
  "audiensi-terjadwal": "Audiensi - Terjadwal",
  "audiensi-konfirmasi-lanjut-pks": "Audiensi - Konfirmasi Lanjut PKS",
  "perjanjian-draft-pks": "Perjanjian - Draft PKS",
  "perjanjian-pembahasan-pks": "Perjanjian - Pembahasan PKS",
  "perjanjian-finalisasi-pks": "Perjanjian - Finalisasi PKS",
  "pelaksanaan-persiapan": "Pelaksanaan - Persiapan",
  "pelaksanaan-dalam-proses": "Pelaksanaan - Dalam Proses",
  "pelaksanaan-dalam-evaluasi": "Pelaksanaan - Dalam Evaluasi",
  "pelaksanaan-penyesuaian-pks": "Pelaksanaan - Penyesuaian PKS",
  "pemantauan-terlaksana": "Pemantauan - Pelaksanaan Terlaksana",
  "pemantauan-pemanfaatan": "Pemantauan - Pemanfaatan",
  "selesai": "Selesai",
  "tidak-dilanjutkan": "Tidak Dilanjutkan",
};

export const WORKFLOW_STATE_COLORS: Record<WorkflowState, { bg: string; text: string; border: string }> = {
  "kontribusi-masuk": { bg: "bg-[#FFE9EA]", text: "text-[#C82236]", border: "border-[#FFE9EA]" },
  "audiensi-menunggu-jadwal": { bg: "bg-[#FFDFA3]", text: "text-[#92400E]", border: "border-[#FFDFA3]" },
  "audiensi-terjadwal": { bg: "bg-[#FFDFA3]", text: "text-[#92400E]", border: "border-[#FFDFA3]" },
  "audiensi-konfirmasi-lanjut-pks": { bg: "bg-[#FFDFA3]", text: "text-[#92400E]", border: "border-[#FFDFA3]" },
  "perjanjian-draft-pks": { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]", border: "border-[#EDE9FE]" },
  "perjanjian-pembahasan-pks": { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]", border: "border-[#EDE9FE]" },
  "perjanjian-finalisasi-pks": { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]", border: "border-[#EDE9FE]" },
  "pelaksanaan-persiapan": { bg: "bg-[#DBEAFE]", text: "text-[#0B5FEF]", border: "border-[#DBEAFE]" },
  "pelaksanaan-dalam-proses": { bg: "bg-[#DBEAFE]", text: "text-[#0B5FEF]", border: "border-[#DBEAFE]" },
  "pelaksanaan-dalam-evaluasi": { bg: "bg-[#DBEAFE]", text: "text-[#0B5FEF]", border: "border-[#DBEAFE]" },
  "pelaksanaan-penyesuaian-pks": { bg: "bg-[#DBEAFE]", text: "text-[#0B5FEF]", border: "border-[#DBEAFE]" },
  "pemantauan-terlaksana": { bg: "bg-[#FCE7F3]", text: "text-[#EC4899]", border: "border-[#FCE7F3]" },
  "pemantauan-pemanfaatan": { bg: "bg-[#FCE7F3]", text: "text-[#EC4899]", border: "border-[#FCE7F3]" },
  "selesai": { bg: "bg-[#D1FAE5]", text: "text-[#35825A]", border: "border-[#D1FAE5]" },
  "tidak-dilanjutkan": { bg: "bg-[#E5E5E5]", text: "text-[#6B7280]", border: "border-[#E5E5E5]" },
};

const VALID_TRANSITIONS: Partial<Record<WorkflowState, WorkflowState[]>> = {
  "kontribusi-masuk": ["audiensi-menunggu-jadwal", "tidak-dilanjutkan"],
  "audiensi-menunggu-jadwal": ["audiensi-terjadwal", "tidak-dilanjutkan"],
  "audiensi-terjadwal": ["audiensi-konfirmasi-lanjut-pks", "tidak-dilanjutkan"],
  "audiensi-konfirmasi-lanjut-pks": ["perjanjian-draft-pks", "audiensi-menunggu-jadwal", "tidak-dilanjutkan"],
  "perjanjian-draft-pks": ["perjanjian-pembahasan-pks", "tidak-dilanjutkan"],
  "perjanjian-pembahasan-pks": ["perjanjian-finalisasi-pks", "tidak-dilanjutkan"],
  "perjanjian-finalisasi-pks": ["pelaksanaan-persiapan", "tidak-dilanjutkan"],
  "pelaksanaan-persiapan": ["pelaksanaan-dalam-proses"],
  "pelaksanaan-dalam-proses": ["pelaksanaan-dalam-evaluasi", "pemantauan-terlaksana"],
  "pelaksanaan-dalam-evaluasi": ["pelaksanaan-dalam-proses", "pelaksanaan-penyesuaian-pks", "pemantauan-terlaksana"],
  "pelaksanaan-penyesuaian-pks": ["pelaksanaan-dalam-proses"],
  "pemantauan-terlaksana": ["selesai", "pemantauan-pemanfaatan"],
  "pemantauan-pemanfaatan": ["selesai"],
  "selesai": [],
  "tidak-dilanjutkan": [],
};

export function isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ACTIONS_BY_STATE: Record<WorkflowState, WorkflowAction[]> = {
  "kontribusi-masuk": ["lanjutkan-kontribusi", "tidak-dilanjutkan"],
  "audiensi-menunggu-jadwal": ["jadwalkan-audiensi", "tidak-dilanjutkan"],
  "audiensi-terjadwal": ["audiensi-terlaksana", "tidak-dilanjutkan"],
  "audiensi-konfirmasi-lanjut-pks": ["setuju-hasil-audiensi", "audiensi-ulang", "tidak-dilanjutkan"],
  "perjanjian-draft-pks": ["ajukan-perjanjian", "tidak-dilanjutkan"],
  "perjanjian-pembahasan-pks": ["lanjutkan-pembahasan", "tidak-dilanjutkan"],
  "perjanjian-finalisasi-pks": ["perjanjian-disetujui", "tidak-dilanjutkan"],
  "pelaksanaan-persiapan": ["lanjut-pelaksanaan"],
  "pelaksanaan-dalam-proses": ["update-progress", "terlaksana", "dalam-evaluasi"],
  "pelaksanaan-dalam-evaluasi": ["ajukan-addendum", "lanjut-pelaksanaan", "terlaksana"],
  "pelaksanaan-penyesuaian-pks": ["lanjut-pelaksanaan"],
  "pemantauan-terlaksana": ["pemantauan-selesai", "pemantauan-pemanfaatan"],
  "pemantauan-pemanfaatan": ["pemantauan-pemanfaatan-selesai"],
  "selesai": [],
  "tidak-dilanjutkan": [],
};

export const ACTION_LABELS: Record<WorkflowAction, string> = {
  "lanjutkan-kontribusi": "Lanjutkan Kontribusi",
  "tidak-dilanjutkan": "Tidak Dilanjutkan",
  "jadwalkan-audiensi": "Jadwalkan Audiensi",
  "audiensi-terlaksana": "Audiensi Terlaksana",
  "setuju-hasil-audiensi": "Setuju Hasil Audiensi",
  "audiensi-ulang": "Audiensi Ulang",
  "ajukan-perjanjian": "Ajukan Perjanjian ke Biro Hukum",
  "lanjutkan-pembahasan": "Lanjutkan Pembahasan",
  "perjanjian-disetujui": "Perjanjian Telah Disetujui",
  "lanjut-pelaksanaan": "Lanjut Pelaksanaan",
  "update-progress": "Update Progress",
  "terlaksana": "Terlaksana",
  "dalam-evaluasi": "Dalam Evaluasi",
  "ajukan-addendum": "Ajukan Addendum PKS",
  "pemantauan-selesai": "Pemantauan Selesai",
  "pemantauan-pemanfaatan": "Pemantauan Pemanfaatan (Opsional)",
  "pemantauan-pemanfaatan-selesai": "Pemantauan Pemanfaatan Selesai",
  "view-detail": "Lihat Detail",
};

const ROLE_ALLOWED_ACTIONS: Record<UserRole, WorkflowAction[] | "all"> = {
  "biro-perencanaan": [
    "lanjutkan-kontribusi",
    "tidak-dilanjutkan",
    "jadwalkan-audiensi",
    "audiensi-terlaksana",
    "setuju-hasil-audiensi",
    "audiensi-ulang",
    "lanjut-pelaksanaan",
    "update-progress",
    "terlaksana",
    "dalam-evaluasi",
    "ajukan-addendum",
    "pemantauan-selesai",
    "pemantauan-pemanfaatan",
    "pemantauan-pemanfaatan-selesai",
    "view-detail",
  ],
  "pusat-dir-eselon": [
    "lanjut-pelaksanaan",
    "update-progress",
    "terlaksana",
    "dalam-evaluasi",
    "ajukan-addendum",
    "pemantauan-selesai",
    "pemantauan-pemanfaatan",
    "pemantauan-pemanfaatan-selesai",
    "view-detail",
  ],
  "biro-hukum": [
    "ajukan-perjanjian",
    "lanjutkan-pembahasan",
    "perjanjian-disetujui",
    "tidak-dilanjutkan",
    "lanjut-pelaksanaan",
    "view-detail",
  ],
  "pusdatin": ["view-detail"],
  "bidang-kemitraan": ["view-detail"],
  "sekjen": ["view-detail"],
};

export function getAvailableActions(state: WorkflowState, role: UserRole): WorkflowAction[] {
  const stateActions = ACTIONS_BY_STATE[state];
  const roleAllowed = ROLE_ALLOWED_ACTIONS[role];
  if (roleAllowed === "all") return stateActions;
  let allowed = stateActions.filter((a) => roleAllowed.includes(a));
  allowed = allowed.filter((a) => {
    if (a !== "tidak-dilanjutkan") return true;
    const owner = STATE_OWNERS[state];
    return !owner || owner === role;
  });
  return allowed;
}

export const STATE_OWNERS: Partial<Record<WorkflowState, UserRole>> = {
  "perjanjian-draft-pks": "biro-hukum",
  "perjanjian-pembahasan-pks": "biro-hukum",
  "perjanjian-finalisasi-pks": "biro-hukum",
};

export const ACTION_VARIANTS: Partial<Record<WorkflowAction, "default" | "destructive" | "outline">> = {
  "tidak-dilanjutkan": "destructive",
  "audiensi-ulang": "outline",
  "pemantauan-pemanfaatan": "outline",
  "dalam-evaluasi": "outline",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  "biro-perencanaan": "Biro Perencanaan dan Kerjasama",
  "pusat-dir-eselon": "Pusat / Direktorat / Eselon II",
  "biro-hukum": "Biro Hukum",
  "pusdatin": "Pusdatin",
  "bidang-kemitraan": "Bidang Kemitraan pada Pusat / Setditjen",
  "sekjen": "Sekretaris Jenderal",
};

export const ROLE_UNITS: Record<UserRole, string> = {
  "biro-perencanaan": "Biro Perencanaan dan Kerjasama",
  "pusat-dir-eselon": "Pusat / Direktorat / Eselon II",
  "biro-hukum": "Biro Hukum",
  "pusdatin": "Pusdatin",
  "bidang-kemitraan": "Bidang Kemitraan pada Pusat / Setditjen",
  "sekjen": "Sekretaris Jenderal",
};

export const ROLE_FUNCTIONS: Record<UserRole, string> = {
  "biro-perencanaan": "Pengelolaan Proses Kemitraan (Verifikasi administrasi, koordinasi, menyiapkan draft kerja sama)",
  "pusat-dir-eselon": "Review dan Persetujuan Substansi",
  "biro-hukum": "Review hukum, legal drafting, dan penomoran perjanjian",
  "pusdatin": "Persetujuan Akhir",
  "bidang-kemitraan": "Pengusulan Kebutuhan dan Mendapat Informasi Perkembangan",
  "sekjen": "Inisiasi dan Persetujuan Akhir",
};

export const INTERNAL_TEAM: { id: string; name: string; role: UserRole }[] = [
  { id: "u1", name: "Andi Pratama", role: "biro-perencanaan" },
  { id: "u2", name: "Budi Santoso", role: "biro-perencanaan" },
  { id: "u3", name: "Citra Dewi", role: "pusat-dir-eselon" },
  { id: "u4", name: "Dimas Nugroho", role: "pusat-dir-eselon" },
  { id: "u5", name: "Eka Putri", role: "biro-hukum" },
  { id: "u6", name: "Fajar Rahman", role: "pusdatin" },
  { id: "u7", name: "Gita Sekar", role: "bidang-kemitraan" },
  { id: "u8", name: "Hasan Sadikin", role: "sekjen" },
];

export const WORKFLOW_PHASES: { label: string; states: WorkflowState[]; color: string }[] = [
  {
    label: "Masuk",
    states: ["kontribusi-masuk"],
    color: "#C82236",
  },
  {
    label: "Audiensi",
    states: ["audiensi-menunggu-jadwal", "audiensi-terjadwal", "audiensi-konfirmasi-lanjut-pks"],
    color: "#FFC453",
  },
  {
    label: "Perjanjian",
    states: ["perjanjian-draft-pks", "perjanjian-pembahasan-pks", "perjanjian-finalisasi-pks"],
    color: "#7C3AED",
  },
  {
    label: "Pelaksanaan",
    states: ["pelaksanaan-persiapan", "pelaksanaan-dalam-proses", "pelaksanaan-dalam-evaluasi", "pelaksanaan-penyesuaian-pks"],
    color: "#0B5FEF",
  },
  {
    label: "Pemantauan",
    states: ["pemantauan-terlaksana", "pemantauan-pemanfaatan"],
    color: "#EC4899",
  },
  {
    label: "Selesai",
    states: ["selesai"],
    color: "#35825A",
  },
  {
    label: "Tidak Dilanjutkan",
    states: ["tidak-dilanjutkan"],
    color: "#999999",
  },
];

export const PROGRAM_UNIT_KERJA_DEFAULTS: Record<string, string> = {
  "Infrastruktur Digital": "INA Digital Infra",
  "Pengembangan Platform Digital": "INA Digital Platform",
  "Pendampingan Pelatihan GTK": "INA Digital Edu",
  "Bahan Ajar Digital": "INA Digital Murid",
  "Revitalisasi Sekolah": "INA Digital Revit",
  "Kebutuhan Pendidikan Lainnya": "INA Digital Ops",
};
