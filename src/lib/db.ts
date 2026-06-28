import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Prisma 7 requires a driver adapter. libSQL has prebuilt binaries (no native
// build step), so it runs cleanly on Windows. The SQLite file lives at the
// project root (file:./dev.db), resolved relative to the process cwd.
const url = process.env.DATABASE_URL || "file:./dev.db";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaLibSql({ url }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
