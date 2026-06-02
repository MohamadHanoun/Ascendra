"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--asc-bg-0)", color: "var(--asc-fg-1)" }}
    >
      <p
        className="mb-4 text-sm font-black uppercase tracking-[0.24em]"
        style={{ color: "var(--asc-accent)" }}
      >
        Something went wrong
      </p>

      <h1
        className="mb-4 text-4xl font-black uppercase leading-tight tracking-tight md:text-5xl"
        style={{ color: "var(--asc-fg-0)" }}
      >
        An unexpected error occurred.
      </h1>

      <p
        className="mb-8 max-w-md text-sm leading-7"
        style={{ color: "var(--asc-fg-2)" }}
      >
        Something went wrong on our end. You can try again or head back to the
        home page.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center px-6 py-3 text-sm font-black text-white transition hover:opacity-90"
          style={{ background: "var(--asc-accent-2)" }}
        >
          Try Again
        </button>

        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 text-sm font-black transition hover:opacity-80"
          style={{
            border: "1px solid var(--asc-line)",
            color: "var(--asc-fg-2)",
          }}
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
