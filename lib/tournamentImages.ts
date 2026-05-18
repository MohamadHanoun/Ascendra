const fallbackTournamentImages: Record<string, string> = {
  Valorant:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80",
  "League of Legends":
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80",
  CS2: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=1400&q=80",
  Dota2:
    "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1400&q=80",
};

export function getTournamentImageUrl(game: string, imageUrl?: string | null) {
  if (imageUrl && imageUrl.trim()) {
    return imageUrl.trim();
  }

  return (
    fallbackTournamentImages[game] ||
    "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=1400&q=80"
  );
}
