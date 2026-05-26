-- FaceitWebhookLog: stores safe metadata about incoming FACEIT webhook events (Phase 7)
CREATE TABLE "FaceitWebhookLog" (
  "id"                TEXT         NOT NULL,
  "eventType"         TEXT,
  "faceitMatchId"     TEXT,
  "tournamentMatchId" TEXT,
  "status"            TEXT         NOT NULL,
  "reason"            TEXT,
  "httpStatus"        INTEGER,
  "processedAt"       TIMESTAMP(3),
  "payload"           JSONB,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FaceitWebhookLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FaceitWebhookLog_eventType_idx"         ON "FaceitWebhookLog"("eventType");
CREATE INDEX "FaceitWebhookLog_faceitMatchId_idx"     ON "FaceitWebhookLog"("faceitMatchId");
CREATE INDEX "FaceitWebhookLog_tournamentMatchId_idx" ON "FaceitWebhookLog"("tournamentMatchId");
CREATE INDEX "FaceitWebhookLog_status_idx"            ON "FaceitWebhookLog"("status");
CREATE INDEX "FaceitWebhookLog_createdAt_idx"         ON "FaceitWebhookLog"("createdAt");
