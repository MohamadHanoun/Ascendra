type LeaderboardAvatarProps = {
  name: string;
  src?: string | null;
  size?: number;
};

export function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AS";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getAvatarHue(name: string) {
  let hue = 0;

  for (const character of name) {
    hue = (hue << 5) - hue + character.charCodeAt(0);
  }

  return Math.abs(hue) % 360;
}

export default function LeaderboardAvatar({
  name,
  src,
  size = 40,
}: LeaderboardAvatarProps) {
  const hue = getAvatarHue(name);
  const cut = Math.round(size * 0.18);

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        clipPath: `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`,
        background: `linear-gradient(135deg, oklch(0.55 0.22 ${hue}), oklch(0.30 0.16 ${
          hue + 40
        }))`,
        boxShadow: `inset 0 0 0 1px oklch(0.65 0.22 ${hue} / 0.4)`,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className="grid h-full w-full place-items-center font-black uppercase"
          style={{
            color: "oklch(0.97 0.01 290)",
            fontFamily: "var(--font-display)",
            fontSize: Math.round(size * 0.36),
          }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
