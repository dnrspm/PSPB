export type WorkflowState =
  | "kontribusi-masuk"
  | "verifikasi-dan-validasi"
  | "audiensi-menunggu-jadwal"
  | "audiensi-terjadwal"
  | "audiensi-konfirmasi-lanjut-pks"
  | "perjanjian-draft-pks"
  | "perjanjian-pembahasan-pks"
  | "perjanjian-finalisasi-pks"
  | "pelaksanaan-penandatangan-kerjasama"
  | "pelaksanaan-persiapan"
  | "pelaksanaan-dalam-proses"
  | "selesai"
  | "tidak-dilanjutkan";

export type UserRole =
  | "biro-perencanaan"
  | "pusat-dir-eselon"
  | "biro-hukum"
  | "pusdatin"
  | "bidang-kemitraan"
  | "sekjen";

export interface Document {
  id: string;
  name: string;
  type: "proposal" | "pks-draft" | "pks-final" | "rencana-kerja-final" | "bast" | "dokumentasi" | "notulen" | "lainnya";
  uploadedAt: Date;
  uploadedBy: string;
  url?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  actor: string;
  actorRole: UserRole;
  action: string;
  notes?: string;
  fields?: Record<string, string>;
  fromState?: WorkflowState;
  toState?: WorkflowState;
}

/** Satu entri timeline penyaluran bantuan (CTA "Update Progress"). */
export interface ProgressUpdate {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal: Date;
  actor: string;
  dokumen: Document[];
}

/** Jumlah penerima manfaat: target saat persiapan, realisasi saat terlaksana. */
export interface DampakPelaksanaan {
  siswa: number;
  guru: number;
  satuanPendidikan: number;
  wilayah: string;
}

export interface PelaksanaanInfo {
  progress: number;
  startDate?: Date;
  completionDate?: Date;
  latestUpdate?: string;
  dokumentasi: Document[];
  progressUpdates?: ProgressUpdate[];
  targetDampak?: DampakPelaksanaan;
  realisasiDampak?: DampakPelaksanaan;
}

export interface SekolahDetail {
  name: string;
  npsn: string;
  lokasi: string;
  linkLokasi: string;
  kontribusi: string;
  estimasiDana: string;
  catatan: string;
}

export interface Contribution {
  id: string;
  namaMitra: string;
  program: string;
  paketBantuan: string;
  workflowStatus: WorkflowState;
  pic: string | null;
  lastUpdate: Date;
  submissionDate: Date;
  instansi: string;
  narahubung: string;
  kontak: string;
  email: string;
  badanHukum?: string;
  statusMitra?: string;
  jabatan?: string;
  companyProfile?: string;
  targetPenerima: string;
  wilayah: string;
  sekolah: string[];
  sekolahDetail?: SekolahDetail[];
  jumlahPenerima: number;
  nilaiKontribusi: string;
  unitKerja?: string;
  topik?: string;
  infoTambahan?: string;
  untukSiapa?: string;
  jenjangSekolah?: string;
  topikMateri?: string;
  jenisDukungan?: string;
  dokumen: Document[];
  aktivitas: ActivityLog[];
  pelaksanaan?: PelaksanaanInfo;
  reviewNotes?: string;
  legalNotes?: string;
  audiensiNotes?: string;
  audiensiDate?: Date;
  audiensiResult?: string;
}

export interface WorkspaceUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export type WorkflowAction =
  | "lanjutkan-kontribusi"
  | "lanjutkan-audiensi"
  | "tidak-dilanjutkan"
  | "jadwalkan-audiensi"
  | "audiensi-terlaksana"
  | "setuju-hasil-audiensi"
  | "audiensi-ulang"
  | "ajukan-perjanjian"
  | "lanjutkan-pembahasan"
  | "perjanjian-disetujui"
  | "lanjut-persiapan-pelaksanaan"
  | "lanjut-pelaksanaan"
  | "update-progress"
  | "terlaksana"
  | "view-detail";
