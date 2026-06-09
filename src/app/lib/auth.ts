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
  { id: "u1", name: "Andi Pratama", role: "biro-perencanaan", email: "andi@pspb.go.id" },
  { id: "u2", name: "Budi Santoso", role: "biro-perencanaan", email: "budi@pspb.go.id" },
  { id: "u3", name: "Citra Dewi", role: "pusat-dir-eselon", email: "citra@pspb.go.id" },
  { id: "u4", name: "Dimas Nugroho", role: "pusat-dir-eselon", email: "dimas@pspb.go.id" },
  { id: "u5", name: "Eka Putri", role: "biro-hukum", email: "eka@pspb.go.id" },
  { id: "u6", name: "Fajar Rahman", role: "pusdatin", email: "fajar@pspb.go.id" },
  { id: "u7", name: "Gita Sekar", role: "bidang-kemitraan", email: "gita@pspb.go.id" },
  { id: "u8", name: "Hasan Sadikin", role: "sekjen", email: "hasan@pspb.go.id" },
];

export { ROLE_LABELS };
