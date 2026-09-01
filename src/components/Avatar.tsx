function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  src,
  size = 40,
  tone = "light",
}: {
  name: string;
  src?: string | null;
  size?: number;
  /** "light" = white-on-dark (for the dark People cards); "dark" = dark-on-light (for the light nav bar). */
  tone?: "light" | "dark";
}) {
  const borderClass = tone === "light" ? "border-white/15" : "border-line";

  if (src) {
    return (
      // src is an arbitrary data: URI (a user's uploaded avatar), not a
      // static/remote asset next/image can optimize.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full border object-cover ${borderClass}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const toneClass =
    tone === "light" ? "bg-white/10 text-white" : "bg-foreground/[0.06] text-foreground";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border font-semibold ${borderClass} ${toneClass}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}
