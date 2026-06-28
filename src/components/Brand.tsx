import { Wrench } from "lucide-react";

export function Brand({
  subtitle,
  size = "md",
}: {
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  const icon = size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const title =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm shadow-indigo-200">
        <Wrench className={icon} />
      </div>
      <div>
        <div
          className={`font-bold tracking-tight text-slate-800 leading-none ${title}`}
        >
          Dig-IT
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
