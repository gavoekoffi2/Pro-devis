// En production Netlify Database, l'URL fournie est NETLIFY_DB_URL.
// Prisma lit DATABASE_URL depuis le schéma : on le mappe avant d'instancier le client.
if (
  process.env.NETLIFY_DB_URL &&
  (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost"))
) {
  process.env.DATABASE_URL = process.env.NETLIFY_DB_URL;
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
