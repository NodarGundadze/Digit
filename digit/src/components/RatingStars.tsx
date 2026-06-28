"use client";

import { Star } from "lucide-react";

export function RatingStars({
  value,
  onChange,
  size = "w-5 h-5",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: string;
}) {
  const interactive = !!onChange;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            className={`${size} ${
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
