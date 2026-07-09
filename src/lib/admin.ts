export function getEnvAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidAdminEmail(email: string): boolean {
  const normalized = normalizeAdminEmail(email);
  return normalized.includes("@") && normalized.length > 3;
}

export function isEnvAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getEnvAdminEmails().includes(normalizeAdminEmail(email));
}

export async function isProtectedAdminEmail(email: string): Promise<boolean> {
  return isEnvAdminEmail(email);
}

// Re-export async helpers from admin-access for convenience.
export { getAdminUsers, getAllAdminEmails, isAdminEmail } from "@/lib/admin-access";
