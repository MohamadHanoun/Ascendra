const steps = [
  { number: "1", title: "Create", description: "Choose a team name and game." },
  { number: "2", title: "Invite", description: "Invite registered Ascendra players." },
  { number: "3", title: "Review", description: "Submit the team for admin approval." },
  { number: "4", title: "Approved", description: "Join future tournaments as an official team." },
];

export default function TeamFlowGuide() {
  return (
    <section className="border p-6 md:p-8" style={{ borderColor: "oklch(0.50 0.20 285 / 0.4)", background: "var(--asc-accent-dim)" }}>
      <p className="mb-3 text-sm font-black uppercase tracking-[0.25em]" style={{ color: "var(--asc-accent)" }}>
        Team System
      </p>

      <h2 className="text-3xl font-black" style={{ color: "var(--asc-fg-0)" }}>How teams work</h2>

      <p className="mt-4 leading-7" style={{ color: "var(--asc-fg-2)" }}>
        Create a draft team, invite your players, then submit it for admin review. After approval, your team becomes official inside Ascendra.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <article
            key={step.number}
            className="border p-4"
            style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="px-3 py-2 text-xs font-black"
                style={{ background: "var(--asc-accent-2)", color: "#fff" }}
              >
                {step.number}
              </span>
              <h3 className="font-bold" style={{ color: "var(--asc-fg-0)" }}>{step.title}</h3>
            </div>
            <p className="text-sm leading-6" style={{ color: "var(--asc-fg-3)" }}>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
