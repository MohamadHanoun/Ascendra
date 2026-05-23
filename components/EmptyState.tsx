import Image from "next/image";

import { getLocale } from "@/lib/i18nServer";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

const emptyStateMessages = {
  en: {
    label: "No data yet",
  },
  ar: {
    label: "لا توجد بيانات حاليًا",
  },
};

export default async function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  const locale = await getLocale();
  const messages = emptyStateMessages[locale];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl shadow-black/20">
      <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-violet-400/25 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),rgba(255,255,255,0.04))] shadow-2xl shadow-violet-950/30">
        <div className="absolute inset-0 rounded-3xl bg-violet-500/20 blur-2xl" />

        <Image
          src="/images/brand/site-icon-512.png"
          alt="Ascendra"
          width={52}
          height={52}
          className="relative z-10 rounded-2xl object-contain"
        />
      </div>

      <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-violet-300">
        {messages.label}
      </p>

      <h2 className="mb-3 text-2xl font-black text-white">{title}</h2>

      <p className="mx-auto max-w-xl leading-7 text-gray-300">{description}</p>

      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-7 inline-block rounded-xl bg-violet-600 px-6 py-3 font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

