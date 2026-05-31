import { NextResponse } from "next/server";

import { isBotAuthorized } from "@/lib/botAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function getSettingValue(
  settings: Array<{
    key: string;
    value: string;
  }>,
  key: string,
  fallback = "",
) {
  return settings.find((setting) => setting.key === key)?.value || fallback;
}

function getBooleanSettingValue(
  settings: Array<{
    key: string;
    value: string;
  }>,
  key: string,
  fallback = true,
) {
  const value = settings.find((setting) => setting.key === key)?.value;

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const settings = await prisma.serverSetting.findMany({
    where: {
      key: {
        in: [
          "bot.config.announcementChannelId",
          "bot.config.tournamentCategoryId",
          "bot.config.tournamentStaffRoleIds",
          "bot.config.botLogChannelId",
          "bot.config.tournamentLogChannelId",
          "bot.config.inviteChannelId",
          "bot.config.enableAnnouncements",
          "bot.config.enableDiscordAccess",
        ],
      },
    },
  });

  return NextResponse.json({
    ok: true,
    config: {
      announcementChannelId: getSettingValue(
        settings,
        "bot.config.announcementChannelId",
        process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID || "",
      ),
      tournamentCategoryId: getSettingValue(
        settings,
        "bot.config.tournamentCategoryId",
        process.env.DISCORD_TOURNAMENT_CATEGORY_ID || "",
      ),
      tournamentStaffRoleIds: getSettingValue(
        settings,
        "bot.config.tournamentStaffRoleIds",
        process.env.DISCORD_TOURNAMENT_STAFF_ROLE_IDS || "",
      ),
      botLogChannelId: getSettingValue(
        settings,
        "bot.config.botLogChannelId",
        process.env.DISCORD_BOT_LOG_CHANNEL_ID || "",
      ),
      tournamentLogChannelId: getSettingValue(
        settings,
        "bot.config.tournamentLogChannelId",
        process.env.DISCORD_TOURNAMENT_LOG_CHANNEL_ID || "",
      ),
      inviteChannelId: getSettingValue(
        settings,
        "bot.config.inviteChannelId",
        process.env.DISCORD_INVITE_CHANNEL_ID ||
          process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID ||
          "",
      ),
      enableAnnouncements: getBooleanSettingValue(
        settings,
        "bot.config.enableAnnouncements",
        true,
      ),
      enableDiscordAccess: getBooleanSettingValue(
        settings,
        "bot.config.enableDiscordAccess",
        true,
      ),
    },
  });
}
