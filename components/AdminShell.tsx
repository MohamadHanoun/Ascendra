import type { ReactNode } from "react";

import AdminSidebarNav from "@/components/AdminSidebarNav";

type AdminShellProps = {
  userName?: string | null;
  eyebrow?: string;
  title: string;
  description?: string;
  headerMeta?: ReactNode;
  children: ReactNode;
};

export default function AdminShell({
  userName,
  eyebrow = "Ascendra admin panel",
  title,
  description,
  headerMeta,
  children,
}: AdminShellProps) {
  return (
    <main
      className="asc-admin-page min-h-screen overflow-hidden"
      style={{ background: "var(--asc-bg-0)" }}
    >
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "var(--asc-admin-ambient)" }}
      />

      <AdminSidebarNav userName={userName} />

      <div className="relative z-10 min-h-screen lg:pl-[286px]">
        <header
          className="border-b px-6 py-6 lg:px-10"
          style={{
            borderColor: "var(--asc-line-soft)",
            background:
              "linear-gradient(180deg, rgb(15 14 12 / 0.96), rgb(15 14 12 / 0.72))",
            backdropFilter: "blur(18px) saturate(140%)",
          }}
        >
          <div className="mx-auto flex max-w-[1440px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p
                className="text-xs font-black uppercase tracking-[0.20em]"
                style={{ color: "var(--asc-accent)" }}
              >
                {eyebrow}
              </p>
              <h1
                className="mt-2 truncate text-3xl font-black uppercase leading-tight md:text-4xl"
                style={{ color: "var(--asc-fg-0)" }}
              >
                {title}
              </h1>
              {description && (
                <p
                  className="mt-2 max-w-3xl text-sm leading-6"
                  style={{ color: "var(--asc-fg-3)" }}
                >
                  {description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
              <span
                className="border px-3 py-1 font-black"
                style={{
                  borderColor: "var(--asc-green-border)",
                  background: "var(--asc-green-bg)",
                  color: "var(--asc-green)",
                }}
              >
                Admin
              </span>
              {userName && (
                <span
                  className="max-w-[220px] truncate border px-3 py-1 font-bold"
                  style={{
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-2)",
                    color: "var(--asc-fg-2)",
                  }}
                >
                  {userName}
                </span>
              )}
              {headerMeta}
            </div>
          </div>
        </header>

        <div className="py-8">{children}</div>
      </div>
    </main>
  );
}
