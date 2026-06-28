# Dig-IT — IT Operations Marketplace

A full rewrite of the old `old_dig-it` demo, rebuilt from scratch on a modern,
self-contained stack. Customers file IT outages, **managers** triage/price/
broadcast them, vetted **specialists** accept and resolve them (with a mock GPS
route), and a platform **admin** oversees vetting, users, analytics, commission,
and unclaimed-ticket alarms.

## Stack

- **Next.js 16** (App Router, server components, server actions)
- **Prisma 7 + SQLite** via the **libSQL driver adapter** (zero native build; one local file `dev.db`)
- **Custom auth**: `jose` signed session cookie + `bcryptjs`, gated in server-component layouts
- **Tailwind v4** (slate/indigo look carried over from the original)
- Near-real-time dashboards via lightweight `router.refresh()` polling

## Roles & routing

| Area        | Path     | Who                                                        |
| ----------- | -------- | --------------------------------------------------------- |
| Customer    | `/`      | `role = customer`                                         |
| Specialist  | `/work`  | `role = worker` (managers are workers with `level=manager`) |
| Admin       | `/admin` | `role = admin`                                            |
| Auth        | `/login`, `/register` | everyone                                    |

A **manager is a promoted worker** — they sign in exactly like a specialist and
land in `/work`, where they additionally see a **Manage** tab. There is no
manager self-registration; an admin promotes a vetted specialist. The demo ships
with Bob already promoted and one seeded admin.

## Getting started

```bash
cd digit
npm install          # also runs `prisma generate`
npm run db:reset     # creates dev.db, applies schema, seeds demo data
npm run dev          # http://localhost:3000
```

> `db:reset` runs `prisma db push` (non-destructive) then re-seeds. If you change
> the schema in a way that needs a destructive rebuild, run
> `npx prisma db push --force-reset` yourself, then `npm run db:seed`.

> ⚠️ **Do not run `npm audit fix --force`.** It "fixes" the advisories by
> downgrading `next` 16 → 9 and the `prisma` CLI 7 → 6, which breaks the app
> (`next.config.ts` unsupported on Next 9; Prisma 6 can't read the datasource URL
> from `prisma.config.ts`). The remaining advisories are dev/build-time transitive
> deps only. They're already neutralised here via `overrides` in `package.json`
> (`postcss` ≥ 8.5.10, `@hono/node-server` ≥ 1.19.13) — `npm audit` reports **0
> vulnerabilities** with no downgrades. To address future advisories, prefer
> targeted `overrides` over `audit fix --force`.

### Demo accounts (password: `demo1234`)

| Account            | Email              | Role                          |
| ------------------ | ------------------ | ----------------------------- |
| Alice Cooper       | `alice@gmail.com`  | customer                      |
| Bob Jenkins        | `bob@digit.com`    | worker — **manager**          |
| Charlie / Dave / Emma / Frank | `*@digit.com` | worker — vetted specialist |
| Alex Rivera        | `alex@digit.com`   | worker — **pending vetting**  |
| Platform Admin     | `admin@digit.com`  | admin                         |

The login screen has one-click chips that fill these in.

## Workflow to check it end-to-end

Open a few browser profiles / incognito windows so you can be several roles at
once — the dashboards poll, so changes show up across windows within ~3s.

1. **Gating** — logged out, visit `/admin` and `/work`; you're bounced to
   `/login`. Log in as each account; you land in the correct area, and wrong-role
   URLs redirect home.
2. **Customer (Alice, `/`)** — *File new outage* → submit (try a quick template).
   It appears under *Active requests* as **Submitted**.
3. **Manager (Bob, `/work` → Manage)** — under *Needs pricing*, propose a price +
   tags + justification on Alice's new task. (Bob has Manage tools but **no**
   vetting tab — vetting is admin-only.)
4. **Customer** — the proposal shows under *Needs your attention* → **Approve &
   broadcast**. Status → **Broadcasting**.
5. **Specialist (Emma/Dave, `/work` → Queue)** — a tag-matched job appears →
   **Accept**. In *Active*, **Simulate travel** (breadcrumbs appear on Alice's
   map), **Arrived on site** (→ On site), optionally **Request scope change**
   (Bob forwards it, Alice approves → price updates), then **Mark complete**.
6. **Customer** — **rate & approve** the finished job. Bob then **Issues invoice**
   (or *Finalize & close*); Alice **Pays invoice** → **Resolved**. The
   specialist's rating / job count / net earnings update.
7. **Admin (`/admin`)**
   - *Users* → **Vet** Alex (pending) → he can now see broadcasts in `/work`.
   - **Promote** a vetted specialist → they gain Manage tools in `/work`; **Demote** reverts it.
   - *Settings* → change **commission %** → specialist payouts + *Commission earned* recompute.
   - *Settings* → set **alarm minutes** low (e.g. `1`), broadcast a task and wait → it surfaces on the admin **alarm board** and is flagged in the manager's Manage tab.
   - *Users* → **Suspend** a user → they can no longer log in; **Reactivate** restores access.
   - *Overview* KPIs and the **activity feed** reflect everything above.
8. **Reset** anytime with `npm run db:reset`.

### Sanity checks

```bash
npm run build       # type-checks + lints + compiles
npm run typecheck   # tsc --noEmit
```

## Project layout

```
prisma/
  schema.prisma     # User, WorkerProfile, Task, TaskLog, ScopeRequest, PlatformSettings, AuditLog
  seed.ts           # demo accounts + tasks + default settings
src/
  app/
    (auth)/login, (auth)/register   # bare-layout auth pages
    (customer)/                     # "/" customer dashboard (guarded)
    work/                           # specialist + manager portal (guarded)
    admin/                          # admin console (guarded)
  components/        # UI: AppShell, dashboards, MapMockup, StatusBadge, ...
  lib/
    db.ts           # Prisma client + libSQL adapter (singleton)
    auth.ts, session.ts, password.ts, server-utils.ts
    settings.ts     # commission / alarm helpers
    queries.ts      # DTO data fetchers
    actions/        # server actions: auth, tasks, admin
    types.ts        # string-union domain types + DTO mappers
```

## Notes

- Mock GPS, base64 photo upload, and Seattle location presets are intentionally
  still mocked, as in the original.
- Real payment processing, email, and production-grade password policy are out of
  scope (demo passwords + simulated invoicing).
- The old Firebase/Vite app remains untouched in `../old_dig-it` for reference.
