/**
 * Background sync jobs for game integrations.
 *
 * ARCHITECTURE NOTE
 * -----------------
 * Webhooks (push) are the PRIMARY result delivery channel.
 * Riot LoL results arrive via the tournament-code callback at
 *   /api/integrations/riot/lol/callback
 * which processes the payload immediately and advances the bracket.
 *
 * These cron jobs are a SECONDARY catch-up safety net for matches whose
 * webhook was missed, delayed, or failed to process. They run on a schedule
 * (see vercel.json / Vercel dashboard) and process a bounded batch each run
 * so they complete well within the serverless execution time limit.
 *
 * Vercel plan notes
 * -----------------
 * Hobby plan: 1 cron job, minimum interval 1 hour (1 * * * * is clamped).
 * Pro plan:   unlimited cron jobs, minimum interval 1 minute.
 * Design around the assumption of infrequent runs: each pass sweeps a batch
 * of stale records, not the full table.
 */

import {
  AuditStatus,
  GameProvider,
  MatchGameStatus,
  MatchStatus,
  Prisma,
  WebhookStatus,
} from "@prisma/client";

import { manualAdapter } from "@/lib/gameIntegrations/manualAdapter";
import { parseCallbackPayload, riotLolAdapter, verifyCodeMetadata } from "@/lib/gameIntegrations/riotLolAdapter";
import { riotValorantAdapter } from "@/lib/gameIntegrations/riotValorantAdapter";
import { steamCs2Adapter } from "@/lib/gameIntegrations/steamCs2Adapter";
import { steamDota2Adapter } from "@/lib/gameIntegrations/steamDota2Adapter";
import type { GameIntegrationAdapter, SyncMatchResultResult } from "@/lib/gameIntegrations/types";
import { notifyMatchRoomReady } from "@/lib/matchNotifications";
import { prisma } from "@/lib/prisma";
import {
  advanceBracketAfterMatch,
  completeMatchGame,
} from "@/lib/tournamentMatchEngine";

import type { JobRunResult, SyncConfig } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const BATCH_SIZE = 25;
const STALE_THRESHOLD_MINUTES = 30;
const RETRY_AGE_HOURS = 48;
/** Polite pause between provider API calls to respect rate limits. */
const INTER_CALL_DELAY_MS = 250;

// ─── Adapter registry ─────────────────────────────────────────────────────────

function getAdapter(provider: GameProvider): GameIntegrationAdapter | null {
  switch (provider) {
    case GameProvider.riot_lol:
      return riotLolAdapter;
    case GameProvider.riot_valorant:
      return riotValorantAdapter;
    case GameProvider.steam_dota2:
      return steamDota2Adapter;
    case GameProvider.steam_cs2:
      return steamCs2Adapter;
    case GameProvider.manual:
      return manualAdapter;
    default:
      return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function makeResult(job: string): JobRunResult {
  return { ok: true, job, processed: 0, failed: 0, skipped: 0, durationMs: 0, errors: [] };
}

async function writeAudit(opts: {
  provider: GameProvider;
  action: string;
  request?: Prisma.InputJsonValue;
  response?: Prisma.InputJsonValue;
  status: AuditStatus;
  error?: string;
}) {
  try {
    await prisma.gameApiAuditLog.create({
      data: {
        provider: opts.provider,
        action: opts.action,
        request: opts.request ?? Prisma.JsonNull,
        response: opts.response ?? Prisma.JsonNull,
        status: opts.status,
        error: opts.error ?? null,
      },
    });
  } catch {
    // audit must never break the job
  }
}

// ─── Job 1: Sync pending match results ───────────────────────────────────────
//
// Finds matches stuck in room_created / in_progress with games that have an
// externalMatchId, calls the provider's syncMatchResult, and if a winner is
// returned calls completeMatchGame + auto-confirms for authoritative providers.

export async function syncPendingMatches(config: SyncConfig = {}): Promise<JobRunResult> {
  const start = Date.now();
  const result = makeResult("syncPendingMatches");

  const batchSize = config.batchSize ?? BATCH_SIZE;
  const staleMinutes = config.staleThresholdMinutes ?? STALE_THRESHOLD_MINUTES;
  const staleThreshold = new Date(Date.now() - staleMinutes * 60 * 1000);

  const staleMatches = await prisma.tournamentMatch.findMany({
    where: {
      status: {
        in: [MatchStatus.room_created, MatchStatus.in_progress],
      },
      updatedAt: { lte: staleThreshold },
      room: { isNot: null },
    },
    include: {
      room: true,
      games: {
        where: {
          status: {
            in: [MatchGameStatus.pending, MatchGameStatus.in_progress],
          },
          NOT: { externalMatchId: null },
        },
      },
    },
    take: batchSize,
    orderBy: { updatedAt: "asc" },
  });

  for (const match of staleMatches) {
    const provider = match.room?.provider;
    if (!provider) {
      result.skipped++;
      continue;
    }

    const adapter = getAdapter(provider);
    if (!adapter) {
      result.skipped++;
      await writeAudit({
        provider: GameProvider.manual,
        action: "cron.sync.no_adapter",
        request: { matchId: match.id, provider } as Prisma.InputJsonValue,
        status: AuditStatus.failure,
        error: `no_adapter_for_${provider}`,
      });
      continue;
    }

    if (match.games.length === 0) {
      result.skipped++;
      continue;
    }

    for (const game of match.games) {
      const externalMatchId =
        game.externalMatchId ?? game.externalRoomId ?? undefined;

      let syncResult: SyncMatchResultResult;
      try {
        syncResult = await adapter.syncMatchResult({
          context: {
            matchId: match.id,
            tournamentId: match.tournamentId,
            bestOf: match.bestOf,
          },
          externalMatchId,
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : "unexpected_error";
        result.failed++;
        result.errors.push(`match:${match.id} game:${game.id}: ${error}`);
        await writeAudit({
          provider,
          action: "cron.sync.adapter_error",
          request: {
            matchId: match.id,
            gameId: game.id,
            externalMatchId,
          } as Prisma.InputJsonValue,
          status: AuditStatus.failure,
          error,
        });
        continue;
      }

      if (!syncResult.ok || !syncResult.winnerTeamId) {
        result.skipped++;
        await writeAudit({
          provider,
          action: "cron.sync.no_result",
          request: {
            matchId: match.id,
            gameId: game.id,
          } as Prisma.InputJsonValue,
          response: { error: syncResult.error ?? null } as Prisma.InputJsonValue,
          status: AuditStatus.success,
        });
        await sleep(INTER_CALL_DELAY_MS);
        continue;
      }

      const completeResult = await completeMatchGame(
        game.id,
        syncResult.winnerTeamId,
        syncResult.raw ? (syncResult.raw as Prisma.InputJsonValue) : null,
      );

      if (!completeResult.ok) {
        result.failed++;
        result.errors.push(
          `completeGame match:${match.id} game:${game.id}: ${completeResult.error}`,
        );
        await writeAudit({
          provider,
          action: "cron.sync.complete_failed",
          request: {
            matchId: match.id,
            gameId: game.id,
          } as Prisma.InputJsonValue,
          status: AuditStatus.failure,
          error: completeResult.error,
        });
        await sleep(INTER_CALL_DELAY_MS);
        continue;
      }

      result.processed++;

      if (completeResult.data.seriesComplete) {
        // Auto-confirm for providers that return authoritative, machine-verified results.
        // Manual and CS2 (manual mode) always need human confirmation.
        const isAuthoritative =
          provider === GameProvider.riot_lol ||
          provider === GameProvider.riot_valorant ||
          provider === GameProvider.steam_dota2;

        if (isAuthoritative) {
          await prisma.tournamentMatch.update({
            where: { id: match.id },
            data: {
              status: MatchStatus.confirmed,
              completedAt: new Date(),
              version: { increment: 1 },
            },
          });

          await advanceBracketAfterMatch(match.id);

          await writeAudit({
            provider,
            action: "cron.sync.auto_confirmed",
            request: { matchId: match.id } as Prisma.InputJsonValue,
            response: {
              winnerTeamId: syncResult.winnerTeamId,
            } as Prisma.InputJsonValue,
            status: AuditStatus.success,
          });
        }
      }

      await sleep(INTER_CALL_DELAY_MS);
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ─── Job 2: Re-notify for stuck game rooms ────────────────────────────────────
//
// Finds matches that have a room (room_created status) but haven't progressed
// past the threshold. Re-sends the "room ready" notification so players don't
// miss the join details. Does NOT call external provider APIs.

export async function syncPendingGameRooms(config: SyncConfig = {}): Promise<JobRunResult> {
  const start = Date.now();
  const result = makeResult("syncPendingGameRooms");

  const batchSize = config.batchSize ?? BATCH_SIZE;
  const staleMinutes = config.staleThresholdMinutes ?? STALE_THRESHOLD_MINUTES;
  const staleThreshold = new Date(Date.now() - staleMinutes * 60 * 1000);

  const staleRooms = await prisma.gameRoom.findMany({
    where: {
      match: {
        status: MatchStatus.room_created,
        updatedAt: { lte: staleThreshold },
      },
    },
    include: {
      match: {
        select: {
          id: true,
          tournamentId: true,
          roundNumber: true,
          matchNumber: true,
          teamAId: true,
          teamBId: true,
          status: true,
          updatedAt: true,
        },
      },
    },
    take: batchSize,
    orderBy: { createdAt: "asc" },
  });

  for (const room of staleRooms) {
    const match = room.match;

    if (!match.teamAId || !match.teamBId) {
      result.skipped++;
      continue;
    }

    try {
      await notifyMatchRoomReady(match);
      result.processed++;

      await writeAudit({
        provider: room.provider,
        action: "cron.room.re_notified",
        request: {
          matchId: match.id,
          roomId: room.id,
          provider: room.provider,
        } as Prisma.InputJsonValue,
        status: AuditStatus.success,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "unexpected_error";
      result.failed++;
      result.errors.push(`room:${room.id} match:${match.id}: ${error}`);

      await writeAudit({
        provider: room.provider,
        action: "cron.room.notify_failed",
        request: { matchId: match.id, roomId: room.id } as Prisma.InputJsonValue,
        status: AuditStatus.failure,
        error,
      });
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

// ─── Job 3: Retry failed webhook events ──────────────────────────────────────
//
// Finds GameWebhookEvent rows with status=failed created within the retry
// window. For each, it tries to locate the associated match game via
// externalId and calls the provider adapter's syncMatchResult to get fresh
// data. On success, marks the webhook as processed. On failure, increments
// the error field and leaves it failed for the next pass (up to the age limit).
//
// The idempotencyKey constraint ensures that even if a webhook is retried and
// succeeds, a duplicate delivery of the original event is still rejected.

export async function retryFailedWebhookEvents(
  config: SyncConfig = {},
): Promise<JobRunResult> {
  const start = Date.now();
  const result = makeResult("retryFailedWebhookEvents");

  const batchSize = config.batchSize ?? BATCH_SIZE;
  const retryAgeHours = config.retryAgeHours ?? RETRY_AGE_HOURS;
  const retryWindow = new Date(Date.now() - retryAgeHours * 60 * 60 * 1000);

  const failedEvents = await prisma.gameWebhookEvent.findMany({
    where: {
      status: WebhookStatus.failed,
      createdAt: { gte: retryWindow },
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  for (const event of failedEvents) {
    const adapter = getAdapter(event.provider);
    if (!adapter) {
      result.skipped++;
      continue;
    }

    // Mark as processing to prevent concurrent retry runs from picking it up.
    await prisma.gameWebhookEvent.update({
      where: { id: event.id },
      data: { status: WebhookStatus.processing },
    });

    const markRetryFailed = async (reason: string) => {
      await prisma.gameWebhookEvent
        .update({
          where: { id: event.id },
          data: {
            status: WebhookStatus.failed,
            error: `[retry] ${reason}`,
          },
        })
        .catch(() => undefined);
    };

    // For riot_lol: use the stored payload to extract matchId / game context
    // via the same helpers used by the callback route.
    if (event.provider === GameProvider.riot_lol) {
      const callbackParse = parseCallbackPayload(event.payload);
      if (!callbackParse.ok) {
        result.skipped++;
        await markRetryFailed(`payload_parse: ${callbackParse.error}`);
        continue;
      }

      const metaCheck = verifyCodeMetadata(callbackParse.data.metadata);
      if (!metaCheck.ok || !metaCheck.matchId) {
        result.skipped++;
        await markRetryFailed("invalid_metadata");
        continue;
      }

      const matchId = metaCheck.matchId;
      const match = await prisma.tournamentMatch.findUnique({
        where: { id: matchId },
        select: {
          id: true,
          tournamentId: true,
          bestOf: true,
          teamAId: true,
          teamBId: true,
          status: true,
        },
      });

      if (!match || !match.teamAId || !match.teamBId) {
        result.skipped++;
        await markRetryFailed("match_not_found_or_missing_teams");
        continue;
      }

      // Attempt a fresh sync using the short code as externalMatchId.
      const shortCode = callbackParse.data.shortCode;
      let syncResult: SyncMatchResultResult;
      try {
        syncResult = await adapter.syncMatchResult({
          context: {
            matchId: match.id,
            tournamentId: match.tournamentId,
            bestOf: match.bestOf,
          },
          externalMatchId: shortCode,
        });
      } catch (err) {
        const error = err instanceof Error ? err.message : "unexpected_error";
        result.failed++;
        result.errors.push(`webhook:${event.id}: ${error}`);
        await markRetryFailed(error);
        await writeAudit({
          provider: event.provider,
          action: "cron.webhook.retry_error",
          request: { webhookId: event.id, matchId } as Prisma.InputJsonValue,
          status: AuditStatus.failure,
          error,
        });
        await sleep(INTER_CALL_DELAY_MS);
        continue;
      }

      if (!syncResult.ok || !syncResult.winnerTeamId) {
        result.skipped++;
        await markRetryFailed(
          syncResult.error ?? "no_winner_from_sync",
        );
        await sleep(INTER_CALL_DELAY_MS);
        continue;
      }

      // Find the game row to complete.
      const game = await prisma.tournamentMatchGame.findFirst({
        where: {
          matchId: match.id,
          OR: [
            { externalRoomId: shortCode },
            metaCheck.matchGameId ? { id: metaCheck.matchGameId } : {},
          ],
        },
        select: { id: true, status: true },
      });

      if (!game || game.status === MatchGameStatus.completed) {
        // Already processed — mark the event as duplicate.
        await prisma.gameWebhookEvent.update({
          where: { id: event.id },
          data: { status: WebhookStatus.duplicate, processedAt: new Date() },
        });
        result.skipped++;
        await sleep(INTER_CALL_DELAY_MS);
        continue;
      }

      const completeResult = await completeMatchGame(
        game.id,
        syncResult.winnerTeamId,
        syncResult.raw ? (syncResult.raw as Prisma.InputJsonValue) : null,
      );

      if (!completeResult.ok) {
        result.failed++;
        result.errors.push(
          `webhook:${event.id} game:${game.id}: ${completeResult.error}`,
        );
        await markRetryFailed(completeResult.error);
        await writeAudit({
          provider: event.provider,
          action: "cron.webhook.retry_complete_failed",
          request: { webhookId: event.id, gameId: game.id } as Prisma.InputJsonValue,
          status: AuditStatus.failure,
          error: completeResult.error,
        });
        await sleep(INTER_CALL_DELAY_MS);
        continue;
      }

      // Mark webhook processed.
      await prisma.gameWebhookEvent.update({
        where: { id: event.id },
        data: { status: WebhookStatus.processed, processedAt: new Date() },
      });
      result.processed++;

      if (completeResult.data.seriesComplete) {
        await prisma.tournamentMatch.update({
          where: { id: match.id },
          data: {
            status: MatchStatus.confirmed,
            completedAt: new Date(),
            version: { increment: 1 },
          },
        });
        await advanceBracketAfterMatch(match.id);
      }

      await writeAudit({
        provider: event.provider,
        action: "cron.webhook.retry_success",
        request: { webhookId: event.id, matchId: match.id } as Prisma.InputJsonValue,
        response: {
          winnerTeamId: syncResult.winnerTeamId,
          seriesComplete: completeResult.data.seriesComplete,
        } as Prisma.InputJsonValue,
        status: AuditStatus.success,
      });

      await sleep(INTER_CALL_DELAY_MS);
      continue;
    }

    // Generic path: look up a game by externalId and call syncMatchResult.
    // Covers steam_dota2 and any future providers stored as webhook events.
    const game = await prisma.tournamentMatchGame.findFirst({
      where: {
        OR: [
          { externalMatchId: event.externalId ?? undefined },
          { externalRoomId: event.externalId ?? undefined },
        ],
        status: { not: MatchGameStatus.completed },
      },
      include: {
        match: {
          select: {
            id: true,
            tournamentId: true,
            bestOf: true,
            teamAId: true,
            teamBId: true,
          },
        },
      },
    });

    if (!game || !game.match.teamAId || !game.match.teamBId) {
      result.skipped++;
      await markRetryFailed("game_or_match_not_found");
      continue;
    }

    let syncResult: SyncMatchResultResult;
    try {
      syncResult = await adapter.syncMatchResult({
        context: {
          matchId: game.matchId,
          tournamentId: game.match.tournamentId,
          bestOf: game.match.bestOf,
        },
        externalMatchId:
          game.externalMatchId ?? game.externalRoomId ?? undefined,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "unexpected_error";
      result.failed++;
      result.errors.push(`webhook:${event.id}: ${error}`);
      await markRetryFailed(error);
      await sleep(INTER_CALL_DELAY_MS);
      continue;
    }

    if (!syncResult.ok || !syncResult.winnerTeamId) {
      result.skipped++;
      await markRetryFailed(syncResult.error ?? "no_winner_from_sync");
      await sleep(INTER_CALL_DELAY_MS);
      continue;
    }

    const completeResult = await completeMatchGame(
      game.id,
      syncResult.winnerTeamId,
      syncResult.raw ? (syncResult.raw as Prisma.InputJsonValue) : null,
    );

    if (!completeResult.ok) {
      result.failed++;
      result.errors.push(
        `webhook:${event.id} game:${game.id}: ${completeResult.error}`,
      );
      await markRetryFailed(completeResult.error);
      await sleep(INTER_CALL_DELAY_MS);
      continue;
    }

    await prisma.gameWebhookEvent.update({
      where: { id: event.id },
      data: { status: WebhookStatus.processed, processedAt: new Date() },
    });
    result.processed++;

    if (completeResult.data.seriesComplete) {
      // riot_lol is handled above; here we only reach riot_valorant / steam_dota2
      const isAuthoritative =
        event.provider === GameProvider.riot_valorant ||
        event.provider === GameProvider.steam_dota2;
      if (isAuthoritative) {
        await prisma.tournamentMatch.update({
          where: { id: game.matchId },
          data: {
            status: MatchStatus.confirmed,
            completedAt: new Date(),
            version: { increment: 1 },
          },
        });
        await advanceBracketAfterMatch(game.matchId);
      }
    }

    await writeAudit({
      provider: event.provider,
      action: "cron.webhook.retry_success",
      request: { webhookId: event.id, gameId: game.id } as Prisma.InputJsonValue,
      response: {
        winnerTeamId: syncResult.winnerTeamId,
      } as Prisma.InputJsonValue,
      status: AuditStatus.success,
    });

    await sleep(INTER_CALL_DELAY_MS);
  }

  result.durationMs = Date.now() - start;
  return result;
}
