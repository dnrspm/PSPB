export type WorkflowState =
  | "submission-review"
  | "verifikasi"
  | "audiensi"
  | "review-substansi"
  | "draft-pks"
  | "legal-review"
  | "final-pks"
  | "distribusi-persiapan"
  | "distribusi-in-progress"
  | "distribusi-on-hold"
  | "distribusi-adendum"
  | "distribusi-completed"
  | "published";

export type UserRole =
  | "partnership-operator"
  | "program-reviewer"
  | "strategic-reviewer"
  | "legal-reviewer"
  | "system-admin"
  | "executive-viewer";

export interface Document {
  id: string;
  name: string;
  type: "proposal" | "pks-draft" | "pks-final" | "bast" | "distribusi" | "notulen" | "adendum" | "lainnya";
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
  fromState?: WorkflowState;
  toState?: WorkflowState;
}

export interface DistribusiInfo {
  status: "persiapan" | "in-progress" | "on-hold" | "adendum" | "completed";
  progressPercent: number;
  startDate?: Date;
  completionDate?: Date;
  holdReason?: string;
  adendumActive?: boolean;
  latestUpdate?: string;
  dokumentasi: Document[];
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
  companyProfile?: string;
  targetPenerima: string;
  wilayah: string;
  sekolah: string[];
  jumlahPenerima: number;
  nilaiKontribusi: string;
  dokumen: Document[];
  aktivitas: ActivityLog[];
  distribusi?: DistribusiInfo;
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
  | "assign-pic"
  | "move-to-verifikasi"
  | "approve-verification"
  | "request-revision"
  | "update-audiensi"
  | "move-to-review-substansi"
  | "approve-contribution"
  | "reject-contribution"
  | "request-adjustment"
  | "move-to-draft-pks"
  | "upload-draft-pks"
  | "send-to-legal-review"
  | "upload-legal-revision"
  | "request-legal-revision"
  | "finalize-pks"
  | "move-to-distribusi"
  | "start-distribusi"
  | "update-distribusi"
  | "upload-dokumentasi"
  | "put-on-hold"
  | "resume-distribusi"
  | "create-adendum"
  | "upload-adendum"
  | "mark-completed"
  | "mark-publish"
  | "view-detail";
