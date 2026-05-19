const fallbackTournamentImages: Record<string, string> = {
  Overall: "/images/games/overall.webp",
  Valorant: "/images/games/valorant.webp",
  "League of Legends": "/images/games/league-of-legends.webp",
  CS2: "/images/games/cs2.webp",
  Dota2: "/images/games/dota2.webp",
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

export function getTournamentImageUrl(game: string, imageUrl?: string | null) {
  const cleanImageUrl = imageUrl?.trim();

  if (cleanImageUrl) {
    if (
      isLocalImageUrl(cleanImageUrl) ||
      isAllowedExternalImageUrl(cleanImageUrl)
    ) {
      return cleanImageUrl;
    }
  }

  return fallbackTournamentImages[game] || "/images/games/default.webp";
}

export function getGameImageUrl(game: string) {
  return fallbackTournamentImages[game] || "/images/games/default.webp";
}
