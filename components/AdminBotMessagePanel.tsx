import { queueBotSendMessageInline } from "@/actions/adminBotEventInlineActions";
import { prisma } from "@/lib/prisma";

const channelSettingKeys = [
  {
    key: "bot.config.announcementChannelId",
    label: "Announcements",
  },
  {
    key: "bot.config.botLogChannelId",
    label: "Bot logs",
  },
  {
    key: "bot.config.tournamentLogChannelId",
    label: "Tournament logs",
  },
  {
    key: "bot.config.inviteChannelId",
    label: "Invite channel",
  },
];

async function sendMessageFormAction(formData: FormData) {
  "use server";

  await queueBotSendMessageInline(formData);
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400";
}

function labelClass() {
  return "text-sm font-bold text-gray-200";
}

export default async function AdminBotMessagePanel() {
  const settings = await prisma.serverSetting.findMany({
    where: {
      key: {
        in: channelSettingKeys.map((setting) => setting.key),
      },
    },
  });

  const channels = channelSettingKeys
    .map((setting) => ({
      ...setting,
      value:
        settings.find((item) => item.key === setting.key)?.value.trim() || "",
    }))
    .filter((setting) => setting.value);

  const defaultChannelId = channels[0]?.value || "";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Discord message
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Send message</h2>
      </div>

      <form action={sendMessageFormAction} className="grid gap-5 p-5">
        <datalist id="bot-message-channels">
          {channels.map((channel) => (
            <option
              key={`${channel.key}-${channel.value}`}
              value={channel.value}
              label={channel.label}
            />
          ))}
        </datalist>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass()}>Channel ID</span>

            <input
              name="channelId"
              defaultValue={defaultChannelId}
              list="bot-message-channels"
              placeholder="Discord channel ID"
              className={inputClass()}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass()}>Title</span>

            <input
              name="title"
              placeholder="Optional title"
              maxLength={256}
              className={inputClass()}
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className={labelClass()}>Message</span>

          <textarea
            name="message"
            placeholder="Write the message"
            rows={5}
            maxLength={3900}
            className={`${inputClass()} min-h-32 resize-y leading-6`}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className={labelClass()}>Button label</span>

            <input
              name="buttonLabel"
              placeholder="Optional"
              maxLength={80}
              className={inputClass()}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass()}>Button URL</span>

            <input
              name="buttonUrl"
              placeholder="https://..."
              className={inputClass()}
            />
          </label>

          <label className="grid gap-2">
            <span className={labelClass()}>Image URL</span>

            <input
              name="imageUrl"
              placeholder="https://..."
              className={inputClass()}
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
        >
          Queue message
        </button>
      </form>
    </section>
  );
}
