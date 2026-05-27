import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getRiotIntegrationReadiness } from "@/lib/riotIntegrationReadiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Riot Status | Admin | Ascendra",
  description: "Riot RSO account linking and tournament API integration status.",
};

function ConfigBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "red" | "neutral";
}) {
  const style =
    tone === "green"
      ? {
          borderColor: "oklch(0.55 0.14 150 / 0.5)",
          background: "oklch(0.25 0.12 150 / 0.18)",
          color: "var(--asc-green)",
        }
      : tone === "red"
        ? {
            borderColor: "oklch(0.50 0.20 25 / 0.5)",
            background: "oklch(0.25 0.18 25 / 0.18)",
            color: "var(--asc-live)",
          }
        : {
            borderColor: "var(--asc-line-soft)",
            background: "var(--asc-bg-2)",
            color: "var(--asc-fg-3)",
          };

  return (
    <span
      className="inline-flex w-fit border px-3 py-1 text-xs font-black uppercase tracking-[0.10em]"
      style={style}
    >
      {label}
    </span>
  );
}

function StatusPanelItem({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: ReactNode;
}) {
  return (
    <div
      className="grid gap-3 border px-5 py-4"
      style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
    >
      <p
        className="text-[11px] font-black uppercase tracking-[0.14em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        {label}
      </p>
      {badge ?? (
        <p className="font-mono text-sm font-bold" style={{ color: "var(--asc-fg-1)" }}>
          {value}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p
        className="text-sm font-black uppercase tracking-[0.18em]"
        style={{ color: "var(--asc-accent)" }}
      >
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>
        {title}
      </h2>
    </div>
  );
}

export default async function AdminRiotStatusPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/admin");

  const rso = getRiotIntegrationReadiness();

  const riotApiKeyConfigured = Boolean(process.env.RIOT_API_KEY?.trim());
  const riotCallbackSecretConfigured = Boolean(
    process.env.RIOT_LOL_CALLBACK_SECRET?.trim(),
  );
  const rawMode = (process.env.RIOT_TOURNAMENT_MODE ?? "stub").toLowerCase();
  const tournamentMode = rawMode === "production" ? "Production" : "Stub";

  return (
    <main
      className="asc-ambient min-h-screen overflow-hidden text-white"
      style={{ background: "var(--asc-bg-0)" }}
    >
      <Navbar />

      <section className="relative min-h-[430px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/backgrounds/admin-hero.webp")' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg,oklch(0.06 0.03 287 / 0.92) 0%,oklch(0.06 0.03 287 / 0.66) 44%,oklch(0.06 0.03 287 / 0.82) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-44"
          style={{ background: "linear-gradient(to bottom, transparent, var(--asc-bg-0))" }}
        />

        <div className="relative z-10 mx-auto max-w-[1440px] px-6 pb-24 pt-20 lg:px-10">
          <Link
            href="/admin"
            className="mb-6 inline-flex items-center gap-2 text-sm font-black transition hover:opacity-90"
            style={{ color: "var(--asc-fg-3)" }}
          >
            ← Back to admin
          </Link>

          <p
            className="mb-4 text-sm font-black uppercase tracking-[0.22em]"
            style={{ color: "var(--asc-accent)" }}
          >
            Ascendra admin panel
          </p>

          <h1
            className="max-w-5xl text-5xl font-black uppercase leading-[1.04] tracking-tight md:text-6xl"
            style={{ color: "var(--asc-fg-0)" }}
          >
            Riot Status.
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7" style={{ color: "var(--asc-fg-2)" }}>
            Riot RSO and tournament API configuration status. Secret values are never displayed.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <span
              className="border px-3 py-1 font-black"
              style={{
                borderColor: "oklch(0.55 0.14 150 / 0.5)",
                background: "oklch(0.25 0.12 150 / 0.18)",
                color: "var(--asc-green)",
              }}
            >
              Admin
            </span>
            <span
              className="border px-3 py-1 font-bold"
              style={{
                borderColor: "var(--asc-line-soft)",
                background: "var(--asc-bg-2)",
                color: "var(--asc-fg-2)",
              }}
            >
              {session.user.name}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-10 px-6 pb-16 lg:px-10">

        <div className="grid gap-6">
          <SectionHeader eyebrow="Riot RSO — account linking" title="RSO Credentials" />

          <p className="max-w-3xl text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>
            All three credentials are required for players to link their Riot accounts from the profile page.
          </p>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatusPanelItem
              label="RSO Client ID"
              badge={
                <ConfigBadge
                  label={rso.riotClientConfigured ? "Configured" : "Missing"}
                  tone={rso.riotClientConfigured ? "green" : "red"}
                />
              }
            />
            <StatusPanelItem
              label="RSO Client Secret"
              badge={
                <ConfigBadge
                  label={rso.riotSecretConfigured ? "Configured" : "Missing"}
                  tone={rso.riotSecretConfigured ? "green" : "red"}
                />
              }
            />
            <StatusPanelItem
              label="RSO Redirect URI"
              badge={
                <ConfigBadge
                  label={rso.riotCallbackConfigured ? "Configured" : "Missing"}
                  tone={rso.riotCallbackConfigured ? "green" : "red"}
                />
              }
            />
            <StatusPanelItem
              label="Account linking"
              badge={
                <ConfigBadge
                  label={rso.riotFeatureReady ? "Ready" : "Not ready"}
                  tone={rso.riotFeatureReady ? "green" : "red"}
                />
              }
            />
          </div>

          <div
            className="border px-5 py-4"
            style={
              rso.riotFeatureReady
                ? {
                    borderColor: "oklch(0.55 0.14 150 / 0.5)",
                    background: "oklch(0.25 0.12 150 / 0.18)",
                    color: "var(--asc-green)",
                  }
                : {
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-1)",
                    color: "var(--asc-fg-3)",
                  }
            }
          >
            <p className="text-sm font-black">
              {rso.riotFeatureReady
                ? "RSO credentials are configured. Players can link their Riot accounts from their profile."
                : `Account linking requires ${rso.missing.length} missing credential${rso.missing.length !== 1 ? "s" : ""}. Configure RIOT_RSO_CLIENT_ID, RIOT_RSO_CLIENT_SECRET, and RIOT_RSO_REDIRECT_URI.`}
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <SectionHeader eyebrow="Riot Tournament API — League of Legends" title="Tournament Integration" />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <StatusPanelItem
              label="Tournament API key"
              badge={
                <ConfigBadge
                  label={riotApiKeyConfigured ? "Configured" : "Missing"}
                  tone={riotApiKeyConfigured ? "green" : "red"}
                />
              }
            />
            <StatusPanelItem
              label="Tournament mode"
              badge={
                <ConfigBadge
                  label={tournamentMode}
                  tone={tournamentMode === "Production" ? "green" : "neutral"}
                />
              }
            />
            <StatusPanelItem
              label="LoL callback secret"
              badge={
                <ConfigBadge
                  label={riotCallbackSecretConfigured ? "Configured" : "Missing"}
                  tone={riotCallbackSecretConfigured ? "green" : "red"}
                />
              }
            />
          </div>

          <div
            className="border px-5 py-4"
            style={
              tournamentMode === "Stub"
                ? {
                    borderColor: "var(--asc-line-soft)",
                    background: "var(--asc-bg-1)",
                    color: "var(--asc-fg-3)",
                  }
                : {
                    borderColor: "oklch(0.55 0.14 150 / 0.5)",
                    background: "oklch(0.25 0.12 150 / 0.18)",
                    color: "var(--asc-green)",
                  }
            }
          >
            <p className="text-sm font-black">
              {tournamentMode === "Stub"
                ? "Tournament mode is set to Stub. Codes are generated but game results will not be processed. Set RIOT_TOURNAMENT_MODE=production for live tournaments."
                : "Tournament mode is Production. Live LoL game results will be processed via the callback."}
            </p>
          </div>
        </div>

      </section>

      <Footer />
    </main>
  );
}
