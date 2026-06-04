import type { WorkflowState, WorkflowAction, UserRole } from "../types/contribution";

export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  "submission-review": "Pengajuan",
  "verifikasi": "Verifikasi",
  "audiensi": "Audiensi",
  "review-substansi": "Tinjauan Substansi",
  "draft-pks": "Draf PKS",
  "legal-review": "Tinjauan Legal",
  "final-pks": "PKS Final",
  "distribusi-persiapan": "Distribusi - Persiapan",
  "distribusi-in-progress": "Distribusi - Berlangsung",
  "distribusi-on-hold": "Distribusi - Ditunda",
  "distribusi-adendum": "Distribusi - Adendum",
  "distribusi-completed": "Distribusi - Selesai",
  "published": "Dipublikasikan",
};

export const WORKFLOW_STATE_COLORS: Record<WorkflowState, { bg: string; text: string; border: string }> = {
  "submission-review": { bg: "bg-[#FFE9EA]", text: "text-[#2F3031]", border: "border-[#FFE9EA]" },
  "verifikasi": { bg: "bg-[#FFDFA3]", text: "text-[#2F3031]", border: "border-[#FFDFA3]" },
  "audiensi": { bg: "bg-[#FFDFA3]", text: "text-[#2F3031]", border: "border-[#FFDFA3]" },
  "review-substansi": { bg: "bg-[#FFDFA3]", text: "text-[#2F3031]", border: "border-[#FFDFA3]" },
  "draft-pks": { bg: "bg-[#FFDFA3]", text: "text-[#2F3031]", border: "border-[#FFDFA3]" },
  "legal-review": { bg: "bg-[#FFDFA3]", text: "text-[#2F3031]", border: "border-[#FFDFA3]" },
  "final-pks": { bg: "bg-[#FFDFA3]", text: "text-[#2F3031]", border: "border-[#FFDFA3]" },
  "distribusi-persiapan": { bg: "bg-[#98DAFB]", text: "text-[#2F3031]", border: "border-[#98DAFB]" },
  "distribusi-in-progress": { bg: "bg-[#98DAFB]", text: "text-[#2F3031]", border: "border-[#98DAFB]" },
  "distribusi-on-hold": { bg: "bg-[#98DAFB]", text: "text-[#2F3031]", border: "border-[#98DAFB]" },
  "distribusi-adendum": { bg: "bg-[#98DAFB]", text: "text-[#2F3031]", border: "border-[#98DAFB]" },
  "distribusi-completed": { bg: "bg-[#98DAFB]", text: "text-[#2F3031]", border: "border-[#98DAFB]" },
  "published": { bg: "bg-[#9AE5B9]", text: "text-[#2F3031]", border: "border-[#9AE5B9]" },
};

const VALID_TRANSITIONS: Partial<Record<WorkflowState, WorkflowState[]>> = {
  "submission-review": ["verifikasi"],
  "verifikasi": ["audiensi", "submission-review"],
  "audiensi": ["review-substansi"],
  "review-substansi": ["draft-pks", "audiensi"],
  "draft-pks": ["legal-review", "review-substansi"],
  "legal-review": ["final-pks", "draft-pks"],
  "final-pks": ["distribusi-persiapan"],
  "distribusi-persiapan": ["distribusi-in-progress"],
  "distribusi-in-progress": ["distribusi-on-hold", "distribusi-adendum", "distribusi-completed"],
  "distribusi-on-hold": ["distribusi-in-progress"],
  "distribusi-adendum": ["distribusi-in-progress"],
  "distribusi-completed": ["published"],
};

export function isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ACTIONS_BY_STATE: Record<WorkflowState, WorkflowAction[]> = {
  "submission-review": ["assign-pic", "move-to-verifikasi"],
  "verifikasi": ["approve-verification", "request-revision"],
  "audiensi": ["update-audiensi", "move-to-review-substansi"],
  "review-substansi": ["approve-contribution", "reject-contribution", "request-adjustment", "move-to-draft-pks"],
  "draft-pks": ["upload-draft-pks", "send-to-legal-review"],
  "legal-review": ["upload-legal-revision", "request-legal-revision", "finalize-pks"],
  "final-pks": ["move-to-distribusi"],
  "distribusi-persiapan": ["start-distribusi"],
  "distribusi-in-progress": ["update-distribusi", "upload-dokumentasi", "put-on-hold", "create-adendum", "mark-completed"],
  "distribusi-on-hold": ["resume-distribusi"],
  "distribusi-adendum": ["upload-adendum"],
  "distribusi-completed": ["mark-publish"],
  "published": ["view-detail"],
};

export const ACTION_LABELS: Record<WorkflowAction, string> = {
  "assign-pic": "Tetapkan PIC",
  "move-to-verifikasi": "Pindah ke Verifikasi",
  "approve-verification": "Setujui Verifikasi",
  "request-revision": "Minta Revisi",
  "update-audiensi": "Perbarui Audiensi",
  "move-to-review-substansi": "Pindah ke Tinjauan Substansi",
  "approve-contribution": "Setujui Kontribusi",
  "reject-contribution": "Tolak Kontribusi",
  "request-adjustment": "Minta Penyesuaian",
  "move-to-draft-pks": "Buat Draf PKS",
  "upload-draft-pks": "Unggah Draf PKS",
  "send-to-legal-review": "Kirim ke Tinjauan Legal",
  "upload-legal-revision": "Unggah Revisi PKS",
  "request-legal-revision": "Minta Revisi Legal",
  "finalize-pks": "Finalisasi PKS",
  "move-to-distribusi": "Proses ke Distribusi",
  "start-distribusi": "Mulai Distribusi",
  "update-distribusi": "Perbarui Distribusi",
  "upload-dokumentasi": "Unggah Dokumentasi",
  "put-on-hold": "Tunda Distribusi",
  "resume-distribusi": "Lanjutkan Distribusi",
  "create-adendum": "Buat Adendum",
  "upload-adendum": "Unggah Adendum",
  "mark-completed": "Tandai Selesai",
  "mark-publish": "Publikasikan",
  "view-detail": "Lihat Detail",
};

const ROLE_ALLOWED_ACTIONS: Record<UserRole, WorkflowAction[] | "all"> = {
  "partnership-operator": "all",
  "system-admin": "all",
  "program-reviewer": ["approve-contribution", "reject-contribution", "request-adjustment", "move-to-draft-pks", "view-detail"],
  "legal-reviewer": ["upload-legal-revision", "request-legal-revision", "finalize-pks", "view-detail"],
  "strategic-reviewer": ["view-detail"],
  "executive-viewer": ["view-detail"],
};

export function getAvailableActions(state: WorkflowState, role: UserRole): WorkflowAction[] {
  const stateActions = ACTIONS_BY_STATE[state];
  const roleAllowed = ROLE_ALLOWED_ACTIONS[role];
  if (roleAllowed === "all") return stateActions;
  return stateActions.filter((a) => roleAllowed.includes(a));
}

export const ACTION_VARIANTS: Partial<Record<WorkflowAction, "default" | "destructive" | "outline">> = {
  "reject-contribution": "destructive",
  "request-revision": "outline",
  "request-adjustment": "outline",
  "request-legal-revision": "outline",
  "put-on-hold": "destructive",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  "partnership-operator": "Partnership Operator",
  "program-reviewer": "Program Reviewer",
  "strategic-reviewer": "Strategic Reviewer",
  "legal-reviewer": "Legal Reviewer",
  "system-admin": "Admin",
  "executive-viewer": "Executive Viewer",
};

export const INTERNAL_TEAM: { id: string; name: string; role: UserRole }[] = [
  { id: "u1", name: "Andi Pratama", role: "partnership-operator" },
  { id: "u2", name: "Budi Santoso", role: "partnership-operator" },
  { id: "u3", name: "Citra Dewi", role: "program-reviewer" },
  { id: "u4", name: "Dimas Nugroho", role: "program-reviewer" },
  { id: "u5", name: "Eka Putri", role: "legal-reviewer" },
  { id: "u6", name: "Fajar Rahman", role: "strategic-reviewer" },
];
