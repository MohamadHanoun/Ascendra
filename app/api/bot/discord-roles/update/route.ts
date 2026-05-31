import { NextResponse } from "next/server";

import { isBotAuthorized } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateBody = {
  registrationId?: string;
  status?: string;
  discordRoleId?: string | null;
  error?: string | null;
};

const allowedStatuses = [
  "pending_create",
  "active",
  "pending_remove",
  "removed",
  "failed",
  "not_needed",
];

function unauthorized() {
  return NextResponse.json(
    {
      ok: false,
      message: "Unauthorized.",
    },
    {
      status: 401,
    },
  );
}

function badRequest(message: string) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status: 400,
    },
  );
}


function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) {
    return unauthorized();
  }

  let body: UpdateBody;

  try {
    body = (await request.json()) as UpdateBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const registrationId = normalizeString(body.registrationId);
  const status = normalizeString(body.status);
  const discordRoleId = normalizeString(body.discordRoleId);
  const error = normalizeString(body.error);

  if (!registrationId) {
    return badRequest("registrationId is required.");
  }

  if (!status) {
    return badRequest("status is required.");
  }

  if (!allowedStatuses.includes(status)) {
    return badRequest("Invalid status.");
  }

  if (status === "active" && !discordRoleId) {
    return badRequest("discordRoleId is required when status is active.");
  }

  if (status === "failed" && !error) {
    return badRequest("error is required when status is failed.");
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: {
      id: registrationId,
    },
    select: {
      id: true,
      tournamentId: true,
    },
  });

  if (!registration) {
    return NextResponse.json(
      {
        ok: false,
        message: "Registration was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const syncedAt =
    status === "active" || status === "removed" || status === "not_needed"
      ? new Date()
      : null;

  const updatedRegistration = await prisma.tournamentRegistration.update({
    where: {
      id: registration.id,
    },
    data: {
      discordRoleStatus: status,
      discordRoleId:
        status === "active"
          ? discordRoleId
          : status === "removed" || status === "not_needed"
            ? null
            : undefined,
      discordRoleError: status === "failed" ? error : null,
      discordRoleSyncedAt: syncedAt,
    },
    select: {
      id: true,
      status: true,
      discordRoleStatus: true,
      discordRoleName: true,
      discordRoleId: true,
      discordRoleError: true,
      discordRoleRequestedAt: true,
      discordRoleSyncedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Discord role status updated.",
    registration: updatedRegistration,
  });
}
