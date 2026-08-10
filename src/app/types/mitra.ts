export type BadanHukum =
  | "PT"
  | "Yayasan"
  | "BUMN/BUMD"
  | "CV"
  | "Mitra pembangunan bilateral/multilateral"
  | "Organisasi kemasyarakatan"
  | "Lainnya";

export type StatusMitra = "baru" | "lama";

export type VerifikasiStatus =
  | "belum-lengkap"
  | "menunggu-verifikasi"
  | "terverifikasi"
  | "ditolak";

export interface MitraDokumen {
  id: string;
  jenis: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface MitraProfile {
  email: string;
  password: string;
  nama: string;
  nomorTelepon: string;
  jabatan: string;
  namaPerusahaan: string;
  badanHukum: string;
  badanHukumLainnya?: string;
  statusMitra: StatusMitra;
  companyProfile?: MitraDokumen;
  dokumen: MitraDokumen[];
  verifikasiStatus: VerifikasiStatus;
  createdAt: string;
}

export interface MitraSession {
  email: string;
  nama: string;
  namaPerusahaan: string;
}
