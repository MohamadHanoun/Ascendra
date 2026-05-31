import { queueBotSendMessageInline } from "@/actions/adminBotEventInlineActions";
import { prisma } from "@/lib/prisma";

const channelSettingKeys = [
  { key: "bot.config.announcementChannelId", label: "Announcements" },
  { key: "bot.config.botLogChannelId", label: "Bot logs" },
  { key: "bot.config.tournamentLogChannelId", label: "Tournament logs" },
  { key: "bot.config.inviteChannelId", label: "Invite channel" },
];

async function sendMessageFormAction(formData: FormData) {
  "use server";
  await queueBotSendMessageInline(formData);
}

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default async function AdminBotMessagePanel() {
  const settings = await prisma.serverSetting.findMany({
    where: { key: { in: channelSettingKeys.map((setting) => setting.key) } },
  });

  const channels = channelSettingKeys
    .map((setting) => ({
      ...setting,
      value: settings.find((item) => item.key === setting.key)?.value.trim() || "",
    }))
    .filter((setting) => setting.value);

  const defaultChannelId = channels[0]?.value || "";

  return (
    <section
      className="overflow-hidden border shadow-2xl shadow-black/20"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Discord message</p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Send message</h2>
      </div>

      <form action={sendMessageFormAction} className="grid gap-5 p-5">
        <datalist id="bot-message-channels">
          {channels.map((channel) => (
            <option key={`${channel.key}-${channel.value}`} value={channel.value} label={channel.label} />
          ))}
        </datalist>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Channel ID</span>
            <input
              name="channelId"
              defaultValue={defaultChannelId}
              list="bot-message-channels"
              placeholder="Discord channel ID"
              className="border px-4 py-3 text-sm font-bold outline-none transition"
              style={inputStyle}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Title</span>
            <input
              name="title"
              placeholder="Optional title"
              maxLength={256}
              className="border px-4 py-3 text-sm font-bold outline-none transition"
              style={inputStyle}
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Message</span>
          <textarea
            name="message"
            placeholder="Write the message"
            rows={5}
            maxLength={3900}
            className="min-h-32 resize-y border px-4 py-3 text-sm font-bold leading-6 outline-none transition"
            style={inputStyle}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Button label</span>
            <input name="buttonLabel" placeholder="Optional" maxLength={80} className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle} />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Button URL</span>
            <input name="buttonUrl" placeholder="https://..." className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle} />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>Image URL</span>
            <input name="imageUrl" placeholder="https://..." className="border px-4 py-3 text-sm font-bold outline-none transition" style={inputStyle} />
          </label>
        </div>

        <button
          type="submit"
          className="w-fit px-5 py-3 text-sm font-black transition hover:opacity-90"
          style={{ background: "var(--asc-accent-2)", color: "var(--asc-on-accent)" }}
        >
          Queue message
        </button>
      </form>
    </section>
  );
}
