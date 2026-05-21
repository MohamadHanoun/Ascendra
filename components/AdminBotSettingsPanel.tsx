import { saveAdminBotSettings } from "@/actions/adminBotSettingsActions";
import { prisma } from "@/lib/prisma";

const textSettings = [
  {
    key: "bot.config.announcementChannelId",
    name: "announcementChannelId",
    label: "Announcement channel ID",
    placeholder: "Example: 1506789622376562838",
    hint: "Used for public tournament announcements.",
  },
  {
    key: "bot.config.tournamentCategoryId",
    name: "tournamentCategoryId",
    label: "Tournament category ID",
    placeholder: "Example: 1506789194914332722",
    hint: "Voice rooms for teams are created inside this category.",
  },
  {
    key: "bot.config.tournamentStaffRoleIds",
    name: "tournamentStaffRoleIds",
    label: "Tournament staff role IDs",
    placeholder: "Example: 1506789882255900772,1506789882255900773",
    hint: "Comma-separated role IDs that can manage tournament rooms.",
    multiline: true,
  },
  {
    key: "bot.config.botLogChannelId",
    name: "botLogChannelId",
    label: "Bot log channel ID",
    placeholder: "Discord channel ID",
    hint: "Used for technical bot logs.",
  },
  {
    key: "bot.config.tournamentLogChannelId",
    name: "tournamentLogChannelId",
    label: "Tournament log channel ID",
    placeholder: "Discord channel ID",
    hint: "Used for approve/reject/create/remove operation logs.",
  },
  {
    key: "bot.config.inviteChannelId",
    name: "inviteChannelId",
    label: "Invite channel ID",
    placeholder: "Discord channel ID",
    hint: "Used when the bot creates Discord invite links.",
  },
];

const booleanSettings = [
  {
    key: "bot.config.enableAnnouncements",
    name: "enableAnnouncements",
    label: "Enable announcements",
    hint: "Allow the bot to publish tournament announcements.",
  },
  {
    key: "bot.config.enableDiscordAccess",
    name: "enableDiscordAccess",
    label: "Enable Discord access automation",
    hint: "Allow the bot to create roles and voice rooms for approved teams.",
  },
];

function getSettingValue(
  settings: Array<{
    key: string;
    value: string;
  }>,
  key: string,
) {
  return settings.find((setting) => setting.key === key)?.value || "";
}

export default async function AdminBotSettingsPanel() {
  const settingKeys = [
    ...textSettings.map((setting) => setting.key),
    ...booleanSettings.map((setting) => setting.key),
  ];

  const settings = await prisma.serverSetting.findMany({
    where: {
      key: {
        in: settingKeys,
      },
    },
  });

  return (
    <section className="grid gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
            Bot settings
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            Discord configuration
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
            Manage public Discord IDs used by Ascendra bot operations. Tokens
            and secrets must remain in environment variables only.
          </p>
        </div>
      </div>

      <form action={saveAdminBotSettings} className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {textSettings.map((setting) => {
            const value = getSettingValue(settings, setting.key);

            return (
              <label
                key={setting.key}
                className="grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                  {setting.label}
                </span>

                {setting.multiline ? (
                  <textarea
                    name={setting.name}
                    defaultValue={value}
                    placeholder={setting.placeholder}
                    rows={3}
                    className="min-h-24 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400/40 focus:bg-white/[0.07]"
                  />
                ) : (
                  <input
                    name={setting.name}
                    defaultValue={value}
                    placeholder={setting.placeholder}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400/40 focus:bg-white/[0.07]"
                  />
                )}

                <span className="text-xs leading-5 text-gray-500">
                  {setting.hint}
                </span>
              </label>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {booleanSettings.map((setting) => {
            const checked = getSettingValue(settings, setting.key) === "true";

            return (
              <label
                key={setting.key}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4"
              >
                <input
                  type="checkbox"
                  name={setting.name}
                  defaultChecked={checked}
                  className="mt-1 h-4 w-4 accent-violet-500"
                />

                <span>
                  <span className="block text-sm font-black text-white">
                    {setting.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-gray-500">
                    {setting.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            Save bot settings
          </button>
        </div>
      </form>
    </section>
  );
}
