import { serverFeatures } from "@/data/features";

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="mb-10 text-4xl font-black" style={{ color: "var(--asc-fg-0)" }}>Server Features</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {serverFeatures.map((feature) => (
          <div
            key={feature.title}
            className="asc-card border p-8 transition hover:opacity-90"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}
          >
            <h3 className="mb-4 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>{feature.title}</h3>
            <p className="leading-7" style={{ color: "var(--asc-fg-2)" }}>{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
