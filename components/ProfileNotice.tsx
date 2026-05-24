import { getLocale } from "@/lib/i18nServer";

type ProfileNoticeProps = {
  message?: string;
  error?: string;
};

const noticeMessages = {
  en: {
    success: "Success",
    failed: "Action failed",
  },
  ar: {
    success: "تم بنجاح",
    failed: "فشل الإجراء",
  },
};

export default async function ProfileNotice({
  message,
  error,
}: ProfileNoticeProps) {
  if (!message && !error) {
    return null;
  }

  const locale = await getLocale();
  const messages = noticeMessages[locale];
  const isError = Boolean(error);

  return (
    <div
      className="mb-8 p-5 shadow-2xl shadow-black/20"
      style={
        isError
          ? { border: "1px solid oklch(0.65 0.22 25 / 0.25)", background: "oklch(0.65 0.22 25 / 0.10)", color: "oklch(0.88 0.10 25)" }
          : { border: "1px solid oklch(0.74 0.16 150 / 0.25)", background: "oklch(0.74 0.16 150 / 0.10)", color: "oklch(0.88 0.10 150)" }
      }
    >
      <p
        className="text-sm font-black uppercase tracking-[0.16em]"
        style={{ color: isError ? "oklch(0.65 0.22 25)" : "oklch(0.74 0.16 150)" }}
      >
        {isError ? messages.failed : messages.success}
      </p>

      <p className="mt-2 text-sm leading-6" style={{ color: "var(--asc-fg-1)" }}>{error || message}</p>
    </div>
  );
}
