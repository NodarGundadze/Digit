// Seeds the Dig-IT demo: accounts (kept from the original app), two sample
// tasks, and default platform settings. Run via `npm run db:seed` (or db:reset).
//
// Uses relative imports + an explicit libSQL adapter so it runs under tsx
// without depending on Next's tsconfig path aliases or .env loading.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url, authToken }) });

const DEMO_PASSWORD = "demo1234";

const AVAILABLE_TAGS = [
  "Frontend Dev",
  "Backend Dev",
  "Fullstack Dev",
  "Network Engineering",
  "DevOps & Cloud",
  "Cyber Security",
  "Database Administration",
  "Systems & Support",
];

const DATABASE_PROBLEM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%" style="background:%230c1424;"><circle cx="200" cy="150" r="80" fill="%231e3a8a" opacity="0.4"/><rect x="140" y="90" width="120" height="120" rx="10" fill="%230f172a" stroke="%233b82f6" stroke-width="4"/><line x1="140" y1="130" x2="260" y2="130" stroke="%233b82f6" stroke-width="4"/><line x1="140" y1="170" x2="260" y2="170" stroke="%233b82f6" stroke-width="4"/><text x="180" y="115" fill="%23ef4444" font-family="monospace" font-size="14">ERR</text><text x="50" y="260" fill="%2394a3b8" font-family="sans-serif" font-size="14">Dig-IT: Database Replication Lag and Corrupt Indexes</text></svg>`;

const FRONTEND_PROBLEM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%" style="background:%23110e1a;"><circle cx="200" cy="150" r="80" fill="%2378350f" opacity="0.4"/><rect x="120" y="80" width="160" height="140" rx="12" fill="%231e1b4b" stroke="%23ea580c" stroke-width="4"/><text x="145" y="150" fill="%23ef4444" font-family="monospace" font-size="16">WHITE SCREEN</text><text x="50" y="260" fill="%2394a3b8" font-family="sans-serif" font-size="14">Dig-IT: React Client White Screen Safari Rendering</text></svg>`;

async function main() {
  console.log("Seeding Dig-IT demo data...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Clear in FK-safe order (idempotent seed).
  await prisma.dispute.deleteMany();
  await prisma.taskLog.deleteMany();
  await prisma.scopeRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.workerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.platformSettings.deleteMany();

  await prisma.platformSettings.create({
    data: {
      id: "singleton",
      commissionPct: 12,
      minJobPrice: 20,
      unclaimedAlarmMinutes: 10, // worker rebroadcast timer
      managerNoResponseMinutes: 15,
      maxImagesPerTicket: 5,
      maxImageSizeMb: 10,
      skillTags: JSON.stringify(AVAILABLE_TAGS),
    },
  });

  // --- Admin (seeded only; not self-registerable) ---
  await prisma.user.create({
    data: {
      id: "admin_root",
      name: "Platform Admin",
      email: "admin@digit.com",
      passwordHash,
      role: "admin",
      phone: "555-0001",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=digit-admin",
    },
  });

  // --- Customer ---
  await prisma.user.create({
    data: {
      id: "cust_alice",
      name: "Alice Cooper",
      email: "alice@gmail.com",
      passwordHash,
      role: "customer",
      phone: "555-0199",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    },
  });

  // --- Workers (technicians + Bob already promoted to manager) ---
  const workers = [
    {
      id: "mgr_bob",
      name: "Bob Jenkins",
      email: "bob@digit.com",
      phone: "555-0100",
      avatarUrl:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120",
      profile: {
        tags: ["Systems & Support", "DevOps & Cloud"],
        bio: "Operations lead and dispatch manager. Promoted from senior support engineer; oversees triage, pricing, and specialist coordination across the network.",
        vetStatus: "vetted",
        level: "manager",
        rating: 5.0,
        completedJobsCount: 21,
        curLat: 47.605,
        curLng: -122.33,
        curAddress: "Downtown, Seattle",
      },
    },
    {
      id: "tech_charlie",
      name: "Charlie Watts (Networking)",
      email: "charlie@digit.com",
      phone: "555-0101",
      avatarUrl:
        "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=120",
      profile: {
        tags: ["Network Engineering", "DevOps & Cloud"],
        bio: "CCIE certified network engineer with 8+ years experience. Specialist in core hardware routing, secure firewall configuration, high-availability VPN gateways, and cloud VPC setup.",
        vetStatus: "vetted",
        level: "technician",
        rating: 4.8,
        completedJobsCount: 14,
        curLat: 47.6,
        curLng: -122.325,
        curAddress: "First Hill, Seattle",
      },
    },
    {
      id: "tech_dave",
      name: "Dave Script (Backend & DB)",
      email: "dave@digit.com",
      phone: "555-0102",
      avatarUrl:
        "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=120",
      profile: {
        tags: ["Backend Dev", "Database Administration"],
        bio: "Senior Go & Node.js backend architect. Specializes in PostgreSQL performance tuning, database replication debugging, caching layers, and high-load API development.",
        vetStatus: "vetted",
        level: "technician",
        rating: 4.9,
        completedJobsCount: 29,
        curLat: 47.615,
        curLng: -122.345,
        curAddress: "Belltown, Seattle",
      },
    },
    {
      id: "tech_emma",
      name: "Emma Cool (Frontend Dev)",
      email: "emma@digit.com",
      phone: "555-0103",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
      profile: {
        tags: ["Frontend Dev", "Fullstack Dev"],
        bio: "Expert React & TypeScript developer. Passionate about visual polish, frontend state management optimization, browser Safari/Chrome rendering compatibility, and Tailwind UI designs.",
        vetStatus: "vetted",
        level: "technician",
        rating: 4.7,
        completedJobsCount: 8,
        curLat: 47.59,
        curLng: -122.31,
        curAddress: "Beacon Hill, Seattle",
      },
    },
    {
      id: "tech_frank",
      name: "Frank Miller (Systems & Support)",
      email: "frank@digit.com",
      phone: "555-0104",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
      profile: {
        tags: ["Systems & Support", "DevOps & Cloud"],
        bio: "IT Systems and Support Administrator with 5+ years experience. Expert in active directory integrations, hardware troubleshooting, Linux/Windows virtualization, and legacy systems support.",
        vetStatus: "vetted",
        level: "technician",
        rating: 4.6,
        completedJobsCount: 12,
        curLat: 47.62,
        curLng: -122.32,
        curAddress: "Capitol Hill, Seattle",
      },
    },
    {
      id: "tech_alex",
      name: "Alex Rivera (Cyber Security)",
      email: "alex@digit.com",
      phone: "555-0105",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
      profile: {
        tags: ["Cyber Security", "Systems & Support"],
        bio: "Security researcher and auditor. Experienced in server hardening, penetration testing, vulnerability patching, credential audits, and zero-trust policy configuration.",
        vetStatus: "pending",
        level: "technician",
        rating: 0,
        completedJobsCount: 0,
        curLat: 47.605,
        curLng: -122.33,
        curAddress: "Downtown, Seattle",
      },
    },
  ];

  for (const w of workers) {
    await prisma.user.create({
      data: {
        id: w.id,
        name: w.name,
        email: w.email,
        passwordHash,
        role: "worker",
        phone: w.phone,
        avatarUrl: w.avatarUrl,
        workerProfile: {
          create: {
            tags: JSON.stringify(w.profile.tags),
            bio: w.profile.bio,
            vetStatus: w.profile.vetStatus,
            level: w.profile.level,
            rating: w.profile.rating,
            completedJobsCount: w.profile.completedJobsCount,
            vettedById: w.profile.vetStatus === "vetted" ? "mgr_bob" : null,
            vettedAt: w.profile.vetStatus === "vetted" ? new Date() : null,
            curLat: w.profile.curLat,
            curLng: w.profile.curLng,
            curAddress: w.profile.curAddress,
            curUpdatedAt: new Date(),
          },
        },
      },
    });
  }

  // --- Demo tasks ---
  await prisma.task.create({
    data: {
      id: "task_01",
      customerId: "cust_alice",
      customerName: "Alice Cooper",
      customerPhone: "555-0199",
      title: "Production PostgreSQL database replication lagging heavily",
      description:
        "Our primary database is suffering from replication lag of over 45 minutes on the read-replica. It seems some complex index operations are blocking the WAL sender. Need a senior PostgreSQL dba to analyze locks and restore real-time replication.",
      photoUrl: DATABASE_PROBLEM_SVG,
      tags: JSON.stringify(["Database Administration", "Backend Dev"]),
      status: "submitted",
      price: 150,
      originalPrice: 150,
      locLat: 47.6101,
      locLng: -122.3421,
      locAddress: "Pike Place Market, Seattle, WA 98101",
      logs: {
        create: [
          {
            status: "submitted",
            note: "Customer posted replication lag issue and console logs.",
            updatedById: "cust_alice",
            updatedByName: "Alice Cooper",
          },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      id: "task_02",
      customerId: "cust_alice",
      customerName: "Alice Cooper",
      customerPhone: "555-0199",
      title: "React web application rendering blank screen on Safari browser",
      description:
        "Our client web portal loads perfectly on Chrome and Firefox, but displays a completely blank page on Safari (iOS and macOS). The JS console shows a syntax error with optional chaining. Need a React developer to inspect compilation targets and fix the ES bundle.",
      photoUrl: FRONTEND_PROBLEM_SVG,
      tags: JSON.stringify(["Frontend Dev"]),
      status: "broadcasted",
      price: 180,
      originalPrice: 180,
      initialPriceStatus: "approved",
      locLat: 47.5984,
      locLng: -122.3301,
      locAddress: "Pioneer Square, Seattle, WA 98104",
      broadcastedAt: new Date(Date.now() - 1800000),
      createdAt: new Date(Date.now() - 3600000),
      logs: {
        create: [
          {
            status: "submitted",
            note: "Customer uploaded problem details.",
            timestamp: new Date(Date.now() - 3600000),
            updatedById: "cust_alice",
            updatedByName: "Alice Cooper",
          },
          {
            status: "broadcasted",
            note: "Manager Bob reviewed the problem and broadcasted assignment to specialists matching tag: Frontend Dev",
            timestamp: new Date(Date.now() - 1800000),
            updatedById: "mgr_bob",
            updatedByName: "Bob Jenkins",
          },
        ],
      },
    },
  });

  // A fully-resolved ticket so the customer "History" tab has content and the
  // price-adjustment breakdown (approved scope change) is exercised.
  const settledAt = new Date(Date.now() - 86400000); // ~1 day ago
  await prisma.task.create({
    data: {
      id: "task_03",
      customerId: "cust_alice",
      customerName: "Alice Cooper",
      customerPhone: "555-0199",
      title: "Kubernetes ingress controller returning intermittent 502s",
      description:
        "Our staging ingress controller started failing under load. Nginx logs show 'upstream prematurely closed connection' during traffic spikes. Needed a DevOps specialist to inspect pod health, VPC routing, and the ingress configuration.",
      photoUrl: DATABASE_PROBLEM_SVG,
      tags: JSON.stringify(["DevOps & Cloud", "Systems & Support"]),
      status: "paid",
      price: 260,
      originalPrice: 200,
      initialPriceStatus: "approved",
      assignedTechnicianId: "tech_dave",
      assignedTechnicianName: "Dave Script (Backend & DB)",
      assignedTechnicianPhone: "555-0102",
      locLat: 47.6205,
      locLng: -122.3493,
      locAddress: "Space Needle, Seattle, WA 98109",
      rating: 5,
      feedback:
        "Dave traced it to a misconfigured readiness probe and tuned the upstream keepalive settings. Rock solid since. Worth the extra scope.",
      createdAt: new Date(Date.now() - 5 * 86400000),
      scopeRequest: {
        create: {
          requestedNewPrice: 260,
          requestedNewTime: "+2 hours",
          reason:
            "Root cause spanned both the ingress config and the underlying VPC route tables, requiring extra diagnostic time beyond the original quote.",
          status: "approved",
          createdAt: new Date(Date.now() - 3 * 86400000),
        },
      },
      logs: {
        create: [
          {
            status: "submitted",
            note: "Customer reported intermittent 502s from the staging ingress.",
            timestamp: new Date(Date.now() - 5 * 86400000),
            updatedById: "cust_alice",
            updatedByName: "Alice Cooper",
          },
          {
            status: "broadcasted",
            note: "Manager Bob priced and broadcasted to specialists matching tag: DevOps & Cloud.",
            timestamp: new Date(Date.now() - 5 * 86400000 + 1800000),
            updatedById: "mgr_bob",
            updatedByName: "Bob Jenkins",
          },
          {
            status: "accepted",
            note: "Dave Script claimed the ticket.",
            timestamp: new Date(Date.now() - 4 * 86400000),
            updatedById: "tech_dave",
            updatedByName: "Dave Script (Backend & DB)",
          },
          {
            status: "in_progress",
            note: "On site; began inspecting pod health and ingress configuration.",
            timestamp: new Date(Date.now() - 4 * 86400000 + 3600000),
            updatedById: "tech_dave",
            updatedByName: "Dave Script (Backend & DB)",
          },
          {
            status: "in_progress",
            note: "Scope readjustment to $260 approved by customer; resumed work on VPC routing.",
            timestamp: new Date(Date.now() - 3 * 86400000),
            updatedById: "cust_alice",
            updatedByName: "Alice Cooper",
          },
          {
            status: "completed_pending",
            note: "Fix submitted for customer approval.",
            timestamp: new Date(Date.now() - 2 * 86400000),
            updatedById: "tech_dave",
            updatedByName: "Dave Script (Backend & DB)",
          },
          {
            status: "invoiced",
            note: "Customer approved the fix and rated 5★; final invoice issued.",
            timestamp: new Date(Date.now() - 86400000 - 3600000),
            updatedById: "cust_alice",
            updatedByName: "Alice Cooper",
          },
          {
            status: "paid",
            note: "Invoice settled. Ticket resolved.",
            timestamp: settledAt,
            updatedById: "cust_alice",
            updatedByName: "Alice Cooper",
          },
        ],
      },
    },
  });

  // --- Demo dispute (open, awaiting admin resolution) ---
  await prisma.dispute.create({
    data: {
      taskId: "task_03",
      raisedById: "cust_alice",
      raisedByName: "Alice Cooper",
      raisedByRole: "customer",
      reason:
        "The final invoice came to $260 but I only ever approved the original $200 quote. I'd like the $60 scope add-on reviewed before I consider it settled.",
      status: "open",
      createdAt: new Date(Date.now() - 3600000),
    },
  });

  const counts = {
    users: await prisma.user.count(),
    tasks: await prisma.task.count(),
  };
  console.log(
    `Seed complete. Users: ${counts.users}, Tasks: ${counts.tasks}. Demo password: "${DEMO_PASSWORD}"`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
