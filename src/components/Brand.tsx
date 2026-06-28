import { Wrench } from "lucide-react";

export function Brand({
  subtitle,
  size = "md",
  logoUrl,
  brandName = "Dig-IT",
}: {
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  logoUrl?: string | null;
  brandName?: string;
}) {
  const icon = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const title =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const logoH = size === "lg" ? "h-11" : size === "sm" ? "h-8" : "h-9";
  return (
    <div className="flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={brandName}
          className={`${logoH} w-auto object-contain rounded-xl`}
        />
      ) : (
        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm shadow-indigo-200">
          <Wrench className={icon} />
        </div>
      )}
      <div>
        <div
          className={`font-bold tracking-tight text-slate-800 leading-none ${title}`}
        >
          {brandName}
        </div>
        {subtitle && (
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
