import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient();
}

let prismaInstance = globalForPrisma.prisma ?? createPrismaClient();

// Recreate client after schema changes (common in local dev hot reload).
if (!("formSettings" in prismaInstance)) {
  prismaInstance = createPrismaClient();
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
