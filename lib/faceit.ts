// Server-side FACEIT Data API v4 client.
// FACEIT_API_KEY is read at call time — never at module load — so build-time
// imports don't fail when the key is absent in the build environment.
//
// Never import this module in client components. All callers must be
// server components, server actions, or API route handlers.

import type {
  FaceitMatchDetails,
  FaceitMatchStatsResponse,
  FaceitPlayer,
  FaceitPlayerHistoryResponse,
} from "@/lib/faceitTypes";

const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

export class FaceitApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`FACEIT API error ${status}`);
    this.name = "FaceitApiError";
  }
}

function getApiKey(): string {
  const key = process.env.FACEIT_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "FACEIT_API_KEY is not configured. Add it to your environment variables.",
    );
  }
  return key;
}

async function faceitFetch<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `${FACEIT_API_BASE}${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new FaceitApiError(response.status, body);
  }

  return response.json() as Promise<T>;
}

export async function getFaceitPlayerByNickname(
  nickname: string,
  game = "cs2",
): Promise<FaceitPlayer> {
  return faceitFetch<FaceitPlayer>(
    `/players?nickname=${encodeURIComponent(nickname)}&game=${game}`,
  );
}

export async function getFaceitPlayerHistory(
  playerId: string,
  game = "cs2",
  limit = 20,
): Promise<FaceitPlayerHistoryResponse> {
  return faceitFetch<FaceitPlayerHistoryResponse>(
    `/players/${encodeURIComponent(playerId)}/history?game=${game}&limit=${limit}`,
  );
}

export async function getFaceitMatchDetails(
  matchId: string,
): Promise<FaceitMatchDetails> {
  return faceitFetch<FaceitMatchDetails>(
    `/matches/${encodeURIComponent(matchId)}`,
  );
}

export async function getFaceitMatchStats(
  matchId: string,
): Promise<FaceitMatchStatsResponse> {
  return faceitFetch<FaceitMatchStatsResponse>(
    `/matches/${encodeURIComponent(matchId)}/stats`,
  );
}
