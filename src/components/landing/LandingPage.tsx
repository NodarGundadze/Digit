import type { CSSProperties } from "react";
import Link from "next/link";
import { Gantari, Space_Mono } from "next/font/google";
import {
  ArrowRight,
  CheckCircle,
  CreditCard,
  MapPin,
  Megaphone,
  PlusCircle,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

const gantari = Gantari({ subsets: ["latin"] });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const mono = spaceMono.className;

const STEPS = [
  {
    n: 1,
    icon: PlusCircle,
    title: "Tell us what's broken",
    body: "File an outage in a minute — a quick title, what's happening, and where. Attach a screenshot if it helps.",
  },
  {
    n: 2,
    icon: Megaphone,
    title: "A manager prices it & broadcasts",
    body: "Our team reviews your request, sets a transparent price for you to approve, then alerts the right specialists.",
  },
  {
    n: 3,
    icon: Wrench,
    title: "A vetted specialist resolves it",
    body: "Track your specialist in real time, approve any scope changes, then rate the fix when it's done.",
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Real-time tracking",
    body: "Watch your specialist head your way and see live status updates at every step.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted specialists",
    body: "Every specialist is reviewed and approved before they can pick up your work.",
  },
  {
    icon: CreditCard,
    title: "Transparent pricing",
    body: "You approve the price up front, and again before any scope change. No surprises.",
  },
  {
    icon: Star,
    title: "Ratings & feedback",
    body: "Rate every resolved job so the best specialists rise to the top of the platform.",
  },
];

// Brand-colored values, expressed once as local CSS vars. Each points at the
// runtime `--brand-*` scale (set on <html> from the admin color) with the
// design's original hex as the fallback — so the page recolors when an admin
// picks a color, and stays pixel-identical to the default purple when they
// haven't. See AGENTS.md / globals.css for the indigo→brand token wiring.
const brandVars = {
  "--lp-grad":
    "linear-gradient(150deg, var(--brand-600,#5a40f0), var(--brand-700,#4429d6))",
  "--lp-grad-cta":
    "linear-gradient(150deg, var(--brand-600,#5733f2) 0%, var(--brand-700,#4022e0) 100%)",
  "--lp-accent": "var(--brand-600,#4f33ea)",
  "--lp-tint": "var(--brand-50,#ece9ff)",
} as CSSProperties;

export default function LandingPage({
  logoUrl,
  brandName = "Dig-IT",
}: {
  logoUrl?: string | null;
  brandName?: string;
}) {
  return (
    <div
      style={brandVars}
      className={`${gantari.className} min-h-screen bg-white text-[#1c2030] antialiased`}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#eceff5] bg-[rgba(247,248,251,0.82)] [backdrop-filter:saturate(180%)_blur(12px)]">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="#top" className="flex items-center gap-3 no-underline">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={brandName}
                className="h-[42px] w-auto rounded-xl object-contain"
              />
            ) : (
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[image:var(--lp-grad)] shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--brand-700,#4429d6)_50%,transparent)]">
                <Wrench className="h-5 w-5 text-white" />
              </span>
            )}
            <span className="flex flex-col leading-[1.05]">
              <span className="text-[19px] font-bold tracking-[-0.01em] text-[#1c2030]">
                {brandName}
              </span>
              <span
                className={`${mono} mt-[3px] text-[9.5px] tracking-[0.14em] text-[#9298ab]`}
              >
                IT OPERATIONS MARKETPLACE
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-[11px] border border-[#e6e9f1] bg-white px-5 py-2.5 text-[14.5px] font-semibold text-[#2a2f40] no-underline shadow-[0_1px_2px_rgba(20,24,40,0.04)] transition-all duration-150 hover:border-[#cdd2e0] hover:shadow-[0_3px_10px_-2px_rgba(20,24,40,0.1)]"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-[11px] bg-[image:var(--lp-grad)] px-[22px] py-2.5 text-[14.5px] font-bold text-white no-underline shadow-[0_6px_16px_-5px_color-mix(in_srgb,var(--brand-700,#4429d6)_55%,transparent)] transition-all duration-150 hover:-translate-y-px hover:shadow-[0_10px_22px_-6px_color-mix(in_srgb,var(--brand-700,#4429d6)_60%,transparent)] active:translate-y-0"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          id="top"
          className="border-b border-[#eef1f6] bg-[linear-gradient(180deg,#eef1f7_0%,#f4f6fa_55%,#fbfcfe_100%)]"
        >
          <div className="mx-auto max-w-[760px] px-6 pb-24 pt-20 text-center sm:px-10 sm:pt-24">
            <span
              className={`${mono} inline-flex items-center gap-[7px] rounded-full border border-[var(--brand-100,#ddd6ff)] bg-[var(--lp-tint)] px-[15px] py-[7px] text-[11px] font-bold tracking-[0.08em] text-[var(--brand-600,#4a2dd6)]`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> VETTED SPECIALISTS, ON DEMAND
            </span>
            <h1 className="mb-0 mt-[26px] text-[40px] font-extrabold leading-[1.04] tracking-[-0.03em] text-[#181b27] sm:text-[60px]">
              Something&apos;s down? We&apos;ll get a
              <br />
              <span className="text-[var(--lp-accent)]">specialist on it.</span>
            </h1>
            <p className="mx-auto mt-[26px] max-w-[620px] text-[18.5px] leading-[1.62] text-[#5a6276]">
              Dig-IT connects you with vetted IT specialists who fix outages
              fast. File your problem, approve a transparent quote, and track the
              fix in real time — start to finish, all in one place.
            </p>
            <div className="mt-[38px] flex flex-wrap justify-center gap-3.5">
              <Link
                href="/register"
                className="inline-flex items-center gap-[9px] rounded-[13px] bg-[image:var(--lp-grad)] px-7 py-4 text-base font-bold text-white no-underline shadow-[0_12px_26px_-8px_color-mix(in_srgb,var(--brand-700,#4429d6)_60%,transparent)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-10px_color-mix(in_srgb,var(--brand-700,#4429d6)_65%,transparent)] active:translate-y-0"
              >
                File your first outage <ArrowRight className="h-[18px] w-[18px]" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-[13px] border border-[#e3e6ef] bg-white px-[26px] py-4 text-base font-semibold text-[#2a2f40] no-underline shadow-[0_2px_6px_rgba(20,24,40,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cbd0de] hover:shadow-[0_10px_22px_-10px_rgba(20,24,40,0.18)] active:translate-y-0"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white px-6 py-20 sm:px-10 sm:py-24">
          <div className="mx-auto max-w-[1160px]">
            <h2 className="m-0 text-center text-[32px] font-extrabold tracking-[-0.025em] text-[#181b27] sm:text-[40px]">
              How it works
            </h2>
            <p className="mt-3.5 text-center text-[17px] text-[#6b7388]">
              Three simple steps from “it&apos;s broken” to “it&apos;s fixed.”
            </p>
            <div className="mt-[52px] grid grid-cols-1 gap-[26px] md:grid-cols-3">
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="relative rounded-[20px] border border-[#ebedf4] bg-[linear-gradient(180deg,#fbfbfe,#f6f7fb)] p-[30px] shadow-[0_1px_2px_rgba(20,24,40,0.03)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(40,44,80,0.22)]"
                >
                  <span className="absolute -top-[13px] left-[26px] flex h-7 w-7 items-center justify-center rounded-[9px] bg-[image:var(--lp-grad)] text-[13px] font-bold text-white shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--brand-700,#4429d6)_55%,transparent)]">
                    {step.n}
                  </span>
                  <span className="mb-[22px] flex h-[50px] w-[50px] items-center justify-center rounded-[14px] bg-[image:var(--lp-grad)] shadow-[0_8px_18px_-6px_color-mix(in_srgb,var(--brand-700,#4429d6)_45%,transparent)]">
                    <step.icon className="h-[22px] w-[22px] text-white" />
                  </span>
                  <h3 className="mb-2.5 mt-0 text-[19px] font-bold tracking-[-0.01em] text-[#1c2030]">
                    {step.title}
                  </h3>
                  <p className="m-0 text-[15px] leading-[1.6] text-[#626a7e]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="border-y border-[#e8ebf3] bg-[linear-gradient(180deg,#f3f5fa,#eef1f7)] px-6 py-20 sm:px-10 sm:py-24">
          <div className="mx-auto max-w-[1160px]">
            <h2 className="m-0 text-center text-[32px] font-extrabold tracking-[-0.025em] text-[#181b27] sm:text-[40px]">
              Why clients choose Dig-IT
            </h2>
            <p className="mt-3.5 text-center text-[17px] text-[#6b7388]">
              Everything you need to get back up and running — with full
              visibility the whole way.
            </p>
            <div className="mt-[52px] grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[18px] border border-[#ebedf4] bg-white p-[28px] shadow-[0_1px_2px_rgba(20,24,40,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_-16px_rgba(40,44,80,0.2)]"
                >
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-[13px] bg-[var(--lp-tint)]">
                    <feature.icon className="h-5 w-5 text-[var(--lp-accent)]" />
                  </span>
                  <h3 className="mb-[9px] mt-0 text-[17px] font-bold tracking-[-0.01em] text-[#1c2030]">
                    {feature.title}
                  </h3>
                  <p className="m-0 text-[14.5px] leading-[1.58] text-[#626a7e]">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA banner */}
            <div className="relative mt-[56px] overflow-hidden rounded-[26px] bg-[image:var(--lp-grad-cta)] px-10 py-[70px] text-center shadow-[0_30px_60px_-24px_color-mix(in_srgb,var(--brand-700,#4022e0)_55%,transparent)]">
              <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.025em] text-white sm:text-[38px]">
                Ready when you are.
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[17px] leading-[1.55] text-[var(--brand-100,#d9d3ff)]">
                Create your account and file your first outage in under a minute.
              </p>
              <div className="mt-[34px] flex flex-wrap justify-center gap-3.5">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-[9px] rounded-xl bg-white px-[26px] py-[15px] text-[15.5px] font-bold text-[var(--brand-700,#3a23c8)] no-underline shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-12px_rgba(0,0,0,0.4)] active:translate-y-0"
                >
                  Get started <ArrowRight className="h-[17px] w-[17px]" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/[0.08] px-6 py-[15px] text-[15.5px] font-semibold text-white no-underline transition-all duration-200 hover:bg-white/[0.16]"
                >
                  <CheckCircle className="h-[17px] w-[17px]" /> Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white px-6 py-[30px] sm:px-10">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-3">
          <span className={`${mono} text-[11px] tracking-[0.1em] text-[#aab0c0]`}>
            {brandName.toUpperCase()} OPERATIONS PLATFORM © 2026
          </span>
          <span
            className={`${mono} inline-flex items-center gap-2 text-[11px] tracking-[0.05em] text-[#aab0c0]`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#8b91a3]" /> Role-gated
            workspace · SQLite + Prisma
          </span>
        </div>
      </footer>
    </div>
  );
}
