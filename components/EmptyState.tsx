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
    <div
      className="p-10 text-center shadow-2xl shadow-black/20"
      style={{ border: "1px solid var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
    >
      <div
        className="relative mx-auto mb-6 grid h-20 w-20 place-items-center shadow-2xl"
        style={{ border: "1px solid var(--asc-accent-border)", background: "radial-gradient(circle at center,var(--asc-accent-glow),transparent)" }}
      >
        <div className="absolute inset-0 opacity-20 blur-2xl" style={{ background: "var(--asc-accent)" }} />

        <Image
          src="/images/brand/site-icon-512.png"
          alt="Ascendra"
          width={52}
          height={52}
          className="relative z-10 object-contain"
        />
      </div>

      <p className="mb-3 text-sm font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>
        {messages.label}
      </p>

      <h2 className="mb-3 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{title}</h2>

      <p className="mx-auto max-w-xl leading-7" style={{ color: "var(--asc-fg-1)" }}>{description}</p>

      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-7 inline-block px-6 py-3 font-black text-white shadow-lg transition"
          style={{ background: "var(--asc-accent-2)" }}
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}

