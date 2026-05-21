import { saveAdminBotSettings } from "@/actions/adminBotSettingsActions";
import { prisma } from "@/lib/prisma";

const textSettings = [
  {
    key: "bot.config.announcementChannelId",
    name: "announcementChannelId",
    label: "Announcement channel ID",
    placeholder: "Example: 1506789622376562838",
    hint: "Public tournament announcements.",
  },
  {
    key: "bot.config.tournamentCategoryId",
    name: "TEAMROOMSCategoryId",
    label: "Team Rooms Category ID",
    placeholder: "Example: 1506789194914332722",
    hint: "Voice rooms are created inside this category.",
  },
  {
    key: "bot.config.tournamentStaffRoleIds",
    name: "tournamentStaffRoleIds",
    label: "Tournament staff role IDs",
    placeholder: "Example: 1506789882255900772,1506789882255900773",
    hint: "Comma-separated role IDs.",
    multiline: true,
  },
  {
    key: "bot.config.botLogChannelId",
    name: "botLogChannelId",
    label: "Bot log channel ID",
    placeholder: "Discord channel ID",
    hint: "Technical bot logs.",
  },
  {
    key: "bot.config.tournamentLogChannelId",
    name: "tournamentLogChannelId",
    label: "Tournament log channel ID",
    placeholder: "Discord channel ID",
    hint: "Approve, reject, create, and remove logs.",
  },
  {
    key: "bot.config.inviteChannelId",
    name: "inviteChannelId",
    label: "Invite channel ID",
    placeholder: "Discord channel ID",
    hint: "Used when the bot creates invite links.",
  },
];

const booleanSettings = [
  {
    key: "bot.config.enableAnnouncements",
    name: "enableAnnouncements",
    label: "Enable announcements",
    hint: "Allow tournament announcements.",
  },
  {
    key: "bot.config.enableDiscordAccess",
    name: "enableDiscordAccess",
    label: "Enable Discord access automation",
    hint: "Allow roles and team rooms for approved teams.",
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

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400";
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

  const configuredCount = textSettings.filter((setting) =>
    Boolean(getSettingValue(settings, setting.key)),
  ).length;

  const enabledCount = booleanSettings.filter(
    (setting) => getSettingValue(settings, setting.key) === "true",
  ).length;

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="grid gap-5 border-b border-white/10 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
            Bot settings
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Discord configuration
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Configure Discord IDs used by the bot. Secrets stay in environment
            variables only.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
              IDs set
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {configuredCount}/{textSettings.length}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
              Enabled
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {enabledCount}/{booleanSettings.length}
            </p>
          </div>
        </div>
      </div>

      <form action={saveAdminBotSettings} className="grid gap-5 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          {textSettings.map((setting) => {
            const value = getSettingValue(settings, setting.key);

            return (
              <label key={setting.key} className="grid gap-2">
                <span className="text-sm font-bold text-gray-200">
                  {setting.label}
                </span>

                {setting.multiline ? (
                  <textarea
                    name={setting.name}
                    defaultValue={value}
                    placeholder={setting.placeholder}
                    rows={3}
                    className={`${inputClass()} min-h-24 resize-y leading-6`}
                  />
                ) : (
                  <input
                    name={setting.name}
                    defaultValue={value}
                    placeholder={setting.placeholder}
                    className={inputClass()}
                  />
                )}

                <span className="text-xs leading-5 text-gray-500">
                  {setting.hint}
                </span>
              </label>
            );
          })}
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-5 lg:grid-cols-2">
          {booleanSettings.map((setting) => {
            const checked = getSettingValue(settings, setting.key) === "true";

            return (
              <label
                key={setting.key}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
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

        <button
          type="submit"
          className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
        >
          Save bot settings
        </button>
      </form>
    </section>
  );
}
