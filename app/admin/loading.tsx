export default function AdminLoading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      style={{ background: "var(--asc-bg-0)" }}
    >
      <div
        className="h-0.5 w-20 animate-pulse"
        style={{ background: "var(--asc-accent)" }}
      />
      <p
        className="text-xs font-black uppercase tracking-[0.3em]"
        style={{ color: "var(--asc-fg-3)" }}
      >
        Loading
      </p>
    </div>
  );
}
