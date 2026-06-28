export function Avatar({
  src,
  name,
  className = "w-8 h-8",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name
  )}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || fallback}
      alt={name}
      referrerPolicy="no-referrer"
      className={`rounded-full object-cover bg-slate-200 ${className}`}
    />
  );
}
