import { PrismaClient } from "@prisma/client";

const PRISMA_SCHEMA_VERSION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion?: number;
};

function hasExpectedModels(client: PrismaClient) {
  return "question" in client && "formSettings" in client && "adminUser" in client;
}

function createPrismaClient() {
  return new PrismaClient();
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  if (
    cached &&
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION &&
    hasExpectedModels(cached)
  ) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  }

  return client;
}

export const prisma = getPrismaClient();

export function hasPrismaModel(model: "formSettings" | "adminUser") {
  return model in prisma;
}
