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
      className={`mb-8 rounded-3xl border p-5 shadow-2xl shadow-black/20 ${
        isError
          ? "border-red-400/25 bg-red-500/10 text-red-200"
          : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      <p
        className={`text-sm font-black uppercase tracking-[0.16em] ${
          isError ? "text-red-300" : "text-emerald-300"
        }`}
      >
        {isError ? messages.failed : messages.success}
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-300">{error || message}</p>
    </div>
  );
}
