const fallbackImages: Record<string, string> = {
  valorant: "/images/games/valorant.webp",
  "league-of-legends": "/images/games/league-of-legends.webp",
  cs2: "/images/games/cs2.webp",
  "dota-2": "/images/games/dota2.webp",
  overall: "/images/games/overall.webp",
};

function isLocalImageUrl(url: string) {
  return url.startsWith("/");
}

function isAllowedExternalImageUrl(url: string) {
  return (
    url.startsWith("https://cdn.discordapp.com/") ||
    url.startsWith("https://media.discordapp.net/")
  );
}

export function getTournamentImageUrl(
  gameSlug: string | null | undefined,
  imageUrl?: string | null,
) {
  const cleanImageUrl = imageUrl?.trim();

  if (cleanImageUrl) {
    if (
      isLocalImageUrl(cleanImageUrl) ||
      isAllowedExternalImageUrl(cleanImageUrl)
    ) {
      return cleanImageUrl;
    }
  }

  if (gameSlug) {
    return fallbackImages[gameSlug.toLowerCase()] ?? "/images/games/default.webp";
  }

  return "/images/games/default.webp";
}

export function getGameImageUrl(gameSlug: string | null | undefined) {
  if (!gameSlug) return "/images/games/default.webp";
  return fallbackImages[gameSlug.toLowerCase()] ?? "/images/games/default.webp";
}
