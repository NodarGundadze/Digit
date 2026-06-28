import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Prisma 7 requires a driver adapter. libSQL has prebuilt binaries (no native
// build step), so it runs cleanly on Windows. Locally the SQLite file lives at
// the project root (file:./dev.db). In production (Vercel) DATABASE_URL points
// at a remote libSQL/Turso DB and TURSO_AUTH_TOKEN authenticates to it; the
// token is ignored for a local file: URL.
const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaLibSql({ url, authToken }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
