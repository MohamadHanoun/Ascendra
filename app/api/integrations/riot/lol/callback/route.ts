import crypto from "node:crypto";

import { NextResponse } from "next/server";

import {
  AuditStatus,
  GameProvider,
  MatchGameStatus,
  MatchStatus,
  Prisma,
  WebhookStatus,
} from "@prisma/client";

import {
  parseCallbackPayload,
  resolveWinnerFromPuuids,
  verifyCodeMetadata,
} from "@/lib/gameIntegrations/riotLolAdapter";
import { prisma } from "@/lib/prisma";
import { completeMatchGame } from "@/lib/tournamentMatchEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IngestResult =
  | { status: "ok"; code: number; body: Record<string, unknown> }
  | { status: "duplicate"; code: number; body: Record<string, unknown> }
  | { status: "error"; code: number; body: Record<string, unknown> };

async function writeAudit(input: {
  action: string;
  request?: Prisma.InputJsonValue;
  response?: Prisma.InputJsonValue;
  status: AuditStatus;
  error?: string | null;
}) {
  try {
    await prisma.gameApiAuditLog.create({
      data: {
        provider: GameProvider.riot_lol,
        action: input.action,
        request: input.request,
        response: input.response,
        status: input.status,
        error: input.error ?? null,
      },
    });
  } catch (error) {
    console.error("[riotLol callback] failed to write audit:", error);
  }
}

async function ingest(rawBody: string, rawJson: unknown): Promise<IngestResult> {
  const callback = parseCallbackPayload(rawJson);
  if (!callback.ok) {
    return {
      status: "error",
      code: 400,
      body: { ok: false, error: callback.error },
    };
  }

  const metadataCheck = verifyCodeMetadata(callback.data.metadata);
  if (!metadataCheck.ok) {
    await writeAudit({
      action: "riot.lol.callback.reject",
      request: { reason: metadataCheck.error },
      response: rawJson as Prisma.InputJsonValue,
      status: AuditStatus.failure,
      error: metadataCheck.error,
    });
    return {
      status: "error",
      code: 401,
      body: { ok: false, error: metadataCheck.error },
    };
  }

  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${callback.data.shortCode}|${callback.data.gameId ?? ""}|${rawBody}`)
    .digest("hex");

  // Use the unique (provider, idempotencyKey) constraint to atomically claim.
  let webhookId: string | null = null;
  try {
    const created = await prisma.gameWebhookEvent.create({
      data: {
        provider: GameProvider.riot_lol,
        externalId: callback.data.gameId
          ? String(callback.data.gameId)
          : callback.data.shortCode,
        idempotencyKey,
        payload: (rawJson as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        status: WebhookStatus.received,
      },
      select: { id: true },
    });
    webhookId = created.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Duplicate — already received this payload. Mark and stop.
      await prisma.gameWebhookEvent
        .update({
          where: {
            provider_idempotencyKey: {
              provider: GameProvider.riot_lol,
              idempotencyKey,
            },
          },
          data: { status: WebhookStatus.duplicate, processedAt: new Date() },
        })
        .catch(() => undefined);

      await writeAudit({
        action: "riot.lol.callback.duplicate",
        request: { idempotencyKey },
        status: AuditStatus.success,
      });
      return {
        status: "duplicate",
        code: 200,
        body: { ok: true, duplicate: true },
      };
    }
    throw error;
  }

  const markFailed = async (reason: string) => {
    if (!webhookId) return;
    await prisma.gameWebhookEvent
      .update({
        where: { id: webhookId },
        data: {
          status: WebhookStatus.failed,
          processedAt: new Date(),
          error: reason,
        },
      })
      .catch(() => undefined);
  };

  const matchId = metadataCheck.matchId!;
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      tournamentId: true,
      status: true,
      bestOf: true,
    },
  });

  if (!match) {
    await markFailed("match_not_found");
    await writeAudit({
      action: "riot.lol.callback.reject",
      request: { matchId, shortCode: callback.data.shortCode },
      status: AuditStatus.failure,
      error: "match_not_found",
    });
    return {
      status: "error",
      code: 404,
      body: { ok: false, error: "match_not_found" },
    };
  }

  if (!match.teamAId || !match.teamBId) {
    await markFailed("match_missing_teams");
    return {
      status: "error",
      code: 409,
      body: { ok: false, error: "match_missing_teams" },
    };
  }

  // Find the game row by short code (stored in externalRoomId).
  let game = await prisma.tournamentMatchGame.findFirst({
    where: { matchId, externalRoomId: callback.data.shortCode },
    select: { id: true, status: true, gameNumber: true },
  });

  // Fallback by matchGameId from metadata.
  if (!game && metadataCheck.matchGameId) {
    game = await prisma.tournamentMatchGame.findFirst({
      where: { id: metadataCheck.matchGameId, matchId },
      select: { id: true, status: true, gameNumber: true },
    });
  }

  if (!game) {
    await markFailed("game_not_found");
    await writeAudit({
      action: "riot.lol.callback.reject",
      request: {
        matchId,
        shortCode: callback.data.shortCode,
        matchGameId: metadataCheck.matchGameId,
      },
      status: AuditStatus.failure,
      error: "game_not_found",
    });
    return {
      status: "error",
      code: 404,
      body: { ok: false, error: "game_not_found" },
    };
  }

  if (game.status === MatchGameStatus.completed) {
    await prisma.gameWebhookEvent
      .update({
        where: { id: webhookId },
        data: {
          status: WebhookStatus.duplicate,
          processedAt: new Date(),
        },
      })
      .catch(() => undefined);
    return {
      status: "duplicate",
      code: 200,
      body: { ok: true, alreadyCompleted: true },
    };
  }

  // Mark processing.
  await prisma.gameWebhookEvent.update({
    where: { id: webhookId },
    data: { status: WebhookStatus.processing },
  });

  const winner = await resolveWinnerFromPuuids({
    matchTeamAId: match.teamAId,
    matchTeamBId: match.teamBId,
    winningPuuids: callback.data.winningPuuids,
  });
  if (!winner.ok) {
    await markFailed(winner.error);
    await writeAudit({
      action: "riot.lol.callback.winner_unresolved",
      request: { matchId, shortCode: callback.data.shortCode },
      response: { winningPuuids: callback.data.winningPuuids },
      status: AuditStatus.failure,
      error: winner.error,
    });
    return {
      status: "error",
      code: 422,
      body: { ok: false, error: winner.error },
    };
  }

  if (callback.data.gameId) {
    await prisma.tournamentMatchGame
      .update({
        where: { id: game.id },
        data: { externalMatchId: String(callback.data.gameId) },
      })
      .catch(() => undefined);
  }

  const completeResult = await completeMatchGame(
    game.id,
    winner.winnerTeamId,
    rawJson as Prisma.InputJsonValue,
  );

  if (!completeResult.ok) {
    await markFailed(completeResult.error);
    await writeAudit({
      action: "riot.lol.callback.complete_failed",
      request: { matchId, gameId: game.id },
      status: AuditStatus.failure,
      error: completeResult.error,
    });
    return {
      status: "error",
      code: 500,
      body: { ok: false, error: completeResult.error },
    };
  }

  await prisma.gameWebhookEvent.update({
    where: { id: webhookId },
    data: { status: WebhookStatus.processed, processedAt: new Date() },
  });

  // If the series wrapped up, flip match status to confirmed and advance the bracket.
  if (completeResult.data.seriesComplete) {
    const refreshed = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, winnerTeamId: true, status: true },
    });
    if (refreshed?.winnerTeamId) {
      await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.confirmed,
          completedAt: new Date(),
          version: { increment: 1 },
        },
      });
      const { advanceBracketAfterMatch } = await import(
        "@/lib/tournamentMatchEngine"
      );
      await advanceBracketAfterMatch(matchId);
    }
  }

  await writeAudit({
    action: "riot.lol.callback.processed",
    request: { matchId, gameId: game.id, shortCode: callback.data.shortCode },
    response: {
      winnerTeamId: winner.winnerTeamId,
      seriesComplete: completeResult.data.seriesComplete,
    },
    status: AuditStatus.success,
  });

  return {
    status: "ok",
    code: 200,
    body: {
      ok: true,
      winnerTeamId: winner.winnerTeamId,
      seriesComplete: completeResult.data.seriesComplete,
    },
  };
}

export async function POST(request: Request) {
  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: "unreadable_body" },
      { status: 400 },
    );
  }

  let rawJson: unknown = null;
  if (rawBody) {
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_json" },
        { status: 400 },
      );
    }
  }

  try {
    const result = await ingest(rawBody, rawJson);
    return NextResponse.json(result.body, { status: result.code });
  } catch (error) {
    console.error("[riotLol callback] unexpected:", error);
    await writeAudit({
      action: "riot.lol.callback.unexpected",
      request: { bodyLength: rawBody.length },
      status: AuditStatus.failure,
      error: error instanceof Error ? error.message : "unexpected_error",
    });
    return NextResponse.json(
      { ok: false, error: "unexpected" },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json(
    { ok: true, route: "riot.lol.callback", method: "POST" },
    { status: 200 },
  );
}
