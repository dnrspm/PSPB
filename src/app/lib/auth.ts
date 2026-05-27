import type { UserRole } from "../types/contribution";
import { ROLE_LABELS, INTERNAL_TEAM } from "./workflow";

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

const SESSION_KEY = "pspb_workspace_user";

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export const MOCK_USERS: SessionUser[] = [
  { id: "u1", name: "Andi Pratama", role: "partnership-operator", email: "andi@pspb.go.id" },
  { id: "u2", name: "Budi Santoso", role: "partnership-operator", email: "budi@pspb.go.id" },
  { id: "u3", name: "Citra Dewi", role: "program-reviewer", email: "citra@pspb.go.id" },
  { id: "u4", name: "Dimas Nugroho", role: "program-reviewer", email: "dimas@pspb.go.id" },
  { id: "u5", name: "Eka Putri", role: "legal-reviewer", email: "eka@pspb.go.id" },
  { id: "u6", name: "Fajar Rahman", role: "strategic-reviewer", email: "fajar@pspb.go.id" },
  { id: "u7", name: "Gita Admin", role: "system-admin", email: "gita@pspb.go.id" },
  { id: "u8", name: "Hasan Viewer", role: "executive-viewer", email: "hasan@pspb.go.id" },
];

export { ROLE_LABELS };
