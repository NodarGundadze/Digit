// One-time setup for a remote libSQL/Turso database (the production DB on
// Vercel). Creates the schema from prisma/schema.sql over HTTPS via the libSQL
// client — no Turso CLI or WSL needed, works on native Windows.
//
// Usage (PowerShell), from the project root:
//   $env:DATABASE_URL="libsql://<your-db>.turso.io"
//   $env:TURSO_AUTH_TOKEN="<your-token>"
//   npm run db:setup-remote
//
// `db:setup-remote` runs this script and then the seed, so the remote DB ends
// up with the schema AND the demo accounts in one go.
//
// If you change prisma/schema.prisma, regenerate the SQL first:
//   npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o prisma/schema.sql
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";

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

  const schemaPath = fileURLToPath(
    new URL("../prisma/schema.sql", import.meta.url)
  );
  const ddl = readFileSync(schemaPath, "utf8");

  const client = createClient({ url, authToken });

  console.log(`Creating schema on ${url} ...`);
  await client.executeMultiple(ddl);
  console.log("Schema created. Seeding demo data next...");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
