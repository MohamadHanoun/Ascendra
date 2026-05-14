import { serverFeatures } from "@/data/features";

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <h2 className="mb-10 text-4xl font-black">Server Features</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {serverFeatures.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:bg-white/10"
          >
            <h3 className="mb-4 text-2xl font-bold">{feature.title}</h3>
            <p className="leading-7 text-gray-300">{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}