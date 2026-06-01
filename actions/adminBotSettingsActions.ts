"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getServerLogErrorMessage,
  logServerAdminAction,
  logServerBotError,
} from "@/lib/serverDiscordLogs";

const botTextSettings = [
  {
    key: "bot.config.announcementChannelId",
    formName: "announcementChannelId",
    description: "Discord channel used for tournament announcements.",
  },
  {
    key: "bot.config.tournamentCategoryId",
    formName: "tournamentCategoryId",
    description: "Discord category where tournament voice rooms are created.",
  },
  {
    key: "bot.config.tournamentStaffRoleIds",
    formName: "tournamentStaffRoleIds",
    description: "Comma-separated Discord role IDs for tournament staff.",
  },
  {
    key: "bot.config.botLogChannelId",
    formName: "botLogChannelId",
    description: "Discord channel used for technical bot logs.",
  },
  {
    key: "bot.config.tournamentLogChannelId",
    formName: "tournamentLogChannelId",
    description: "Discord channel used for tournament operation logs.",
  },
  {
    key: "bot.errorLogChannelId",
    formName: "errorLogChannelId",
    description: "Discord channel used for bot error logs.",
  },
  {
    key: "bot.adminActionsLogChannelId",
    formName: "adminActionsLogChannelId",
    description: "Discord channel used for admin action logs.",
  },
  {
    key: "bot.config.inviteChannelId",
    formName: "inviteChannelId",
    description: "Discord channel used when the bot creates invite links.",
  },
];

const botBooleanSettings = [
  {
    key: "bot.config.enableAnnouncements",
    formName: "enableAnnouncements",
    description: "Allow bot tournament announcements.",
  },
  {
    key: "bot.config.enableDiscordAccess",
    formName: "enableDiscordAccess",
    description: "Allow bot role and voice room automation.",
  },
];

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function getCheckboxValue(formData: FormData, name: string) {
  return formData.get(name) === "on" ? "true" : "false";
}

function redirectBack(type: "success" | "error", message: string): never {
  const params = new URLSearchParams({
    type,
    message,
  });

  redirect(`/admin/bot?${params.toString()}`);
}

export async function saveAdminBotSettings(formData: FormData) {
  const session = await auth();

  const sessionUser = session?.user as
    | {
        databaseId?: string;
        isAdmin?: boolean;
      }
    | undefined;

  if (!sessionUser?.databaseId) {
    redirect("/login");
  }

  if (!sessionUser.isAdmin) {
    redirectBack("error", "Only Ascendra admins can update bot settings.");
  }

  try {
    await prisma.$transaction([
      ...botTextSettings.map((setting) =>
        prisma.serverSetting.upsert({
          where: {
            key: setting.key,
          },
          update: {
            value: getValue(formData, setting.formName),
            description: setting.description,
          },
          create: {
            key: setting.key,
            value: getValue(formData, setting.formName),
            description: setting.description,
          },
        }),
      ),

      ...botBooleanSettings.map((setting) =>
        prisma.serverSetting.upsert({
          where: {
            key: setting.key,
          },
          update: {
            value: getCheckboxValue(formData, setting.formName),
            description: setting.description,
          },
          create: {
            key: setting.key,
            value: getCheckboxValue(formData, setting.formName),
            description: setting.description,
          },
        }),
      ),
    ]);
    await logServerAdminAction({
      title: "Bot settings saved",
      fields: [{ name: "Admin ID", value: sessionUser.databaseId, inline: false }],
    });
  } catch (error) {
    await logServerBotError({
      title: "Bot settings save failed",
      description: getServerLogErrorMessage(error),
      fields: [{ name: "Admin ID", value: sessionUser.databaseId, inline: false }],
    });
    throw error;
  }

  revalidatePath("/admin");

  redirectBack("success", "Bot settings saved successfully.");
}
