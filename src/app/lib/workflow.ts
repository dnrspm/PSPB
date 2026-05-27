import type { WorkflowState, WorkflowAction, UserRole } from "../types/contribution";

export const WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  "submission-review": "Submission Review",
  "verifikasi": "Verifikasi",
  "audiensi": "Audiensi",
  "review-substansi": "Review Substansi",
  "draft-pks": "Draft PKS",
  "legal-review": "Legal Review",
  "final-pks": "Final PKS",
  "distribusi-persiapan": "Distribusi - Persiapan",
  "distribusi-in-progress": "Distribusi - In Progress",
  "distribusi-on-hold": "Distribusi - On Hold",
  "distribusi-adendum": "Distribusi - Adendum",
  "distribusi-completed": "Distribusi - Completed",
  "published": "Published",
};

export const WORKFLOW_STATE_COLORS: Record<WorkflowState, { bg: string; text: string; border: string }> = {
  "submission-review": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  "verifikasi": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  "audiensi": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  "review-substansi": { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-300" },
  "draft-pks": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  "legal-review": { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  "final-pks": { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  "distribusi-persiapan": { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  "distribusi-in-progress": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  "distribusi-on-hold": { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
  "distribusi-adendum": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  "distribusi-completed": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  "published": { bg: "bg-green-200", text: "text-green-800", border: "border-green-400" },
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
  "assign-pic": "Assign PIC",
  "move-to-verifikasi": "Pindah ke Verifikasi",
  "approve-verification": "Approve Verifikasi",
  "request-revision": "Request Revisi",
  "update-audiensi": "Update Audiensi",
  "move-to-review-substansi": "Pindah ke Review Substansi",
  "approve-contribution": "Approve Kontribusi",
  "reject-contribution": "Reject Kontribusi",
  "request-adjustment": "Request Penyesuaian",
  "move-to-draft-pks": "Buat Draft PKS",
  "upload-draft-pks": "Upload Draft PKS",
  "send-to-legal-review": "Kirim ke Legal Review",
  "upload-legal-revision": "Upload Revisi PKS",
  "request-legal-revision": "Request Revisi",
  "finalize-pks": "Finalisasi PKS",
  "move-to-distribusi": "Mulai Distribusi",
  "start-distribusi": "Start Distribusi",
  "update-distribusi": "Update Distribusi",
  "upload-dokumentasi": "Upload Dokumentasi",
  "put-on-hold": "Hold Distribusi",
  "resume-distribusi": "Resume Distribusi",
  "create-adendum": "Buat Adendum",
  "upload-adendum": "Upload Adendum",
  "mark-completed": "Mark Selesai",
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
  "system-admin": "System Admin",
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
