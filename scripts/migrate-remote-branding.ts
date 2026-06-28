// One-off, NON-destructive migration for the remote libSQL/Turso production DB:
// adds the branding columns (brandPrimary, logoUrl, brandName) to the existing
// PlatformSettings table. The columns are nullable, so existing rows/data are
// untouched. Safe to re-run — it skips columns that already exist.
//
// Unlike `db:setup-remote`, this does NOT recreate the schema or reseed (which
// would wipe production data). Use this when you only need to add new columns.
//
// Usage (PowerShell), from the project root:
//   $env:DATABASE_URL="libsql://<your-db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<your-token>"
//   npm run db:migrate-branding
import { createClient } from "@libsql/client";

const STATEMENTS = [
  `ALTER TABLE "PlatformSettings" ADD COLUMN "brandPrimary" TEXT;`,
  `ALTER TABLE "PlatformSettings" ADD COLUMN "logoUrl" TEXT;`,
  `ALTER TABLE "PlatformSettings" ADD COLUMN "brandName" TEXT;`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !url.startsWith("libsql://")) {
    throw new Error(
      "DATABASE_URL must be set to your remote libsql:// URL. " +
        `Got: ${url ?? "(unset)"}`
    );
  }
  if (!authToken) {
    throw new Error("TURSO_AUTH_TOKEN must be set to your Turso auth token.");
  }

  const client = createClient({ url, authToken });
  console.log(`Adding branding columns on ${url} ...`);

  for (const sql of STATEMENTS) {
    try {
      await client.execute(sql);
      console.log("  added:", sql);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/duplicate column name/i.test(msg)) {
        console.log("  skip (already present):", sql);
      } else {
        throw e;
      }
    }
  }
  console.log("Done. Branding columns are in place.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
