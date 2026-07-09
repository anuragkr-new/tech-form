import {
  getEnvAdminEmails,
  isEnvAdminEmail,
  normalizeAdminEmail,
} from "@/lib/admin";
import { hasPrismaModel, prisma } from "@/lib/prisma";
import type { AdminUserRecord } from "@/types/form";

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const envAdmins = getEnvAdminEmails();

  if (!hasPrismaModel("adminUser")) {
    return envAdmins.map((email, index) => ({
      id: `env-${index}`,
      email,
      createdAt: new Date(0).toISOString(),
      createdBy: null,
      protected: true,
    }));
  }

  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
    });

    return admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      createdAt: admin.createdAt.toISOString(),
      createdBy: admin.createdBy,
      protected: envAdmins.includes(admin.email),
    }));
  } catch {
    return envAdmins.map((email, index) => ({
      id: `env-${index}`,
      email,
      createdAt: new Date(0).toISOString(),
      createdBy: null,
      protected: true,
    }));
  }
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  const normalized = normalizeAdminEmail(email);
  if (isEnvAdminEmail(normalized)) return true;

  if (!hasPrismaModel("adminUser")) {
    return false;
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: normalized },
      select: { id: true },
    });

    return !!admin;
  } catch {
    return false;
  }
}

export async function getAllAdminEmails(): Promise<string[]> {
  const envAdmins = getEnvAdminEmails();

  if (!hasPrismaModel("adminUser")) {
    return envAdmins;
  }

  try {
    const dbAdmins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { email: true },
    });

    return [...new Set([...envAdmins, ...dbAdmins.map((admin) => admin.email)])];
  } catch {
    return envAdmins;
  }
}
