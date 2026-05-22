const steps = [
  {
    number: "1",
    title: "Create",
    description: "Choose a team name and game.",
  },
  {
    number: "2",
    title: "Invite",
    description: "Invite registered Ascendra players.",
  },
  {
    number: "3",
    title: "Review",
    description: "Submit the team for admin approval.",
  },
  {
    number: "4",
    title: "Approved",
    description: "Join future tournaments as an official team.",
  },
];

export default function TeamFlowGuide() {
  return (
    <section className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-6 md:p-8">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
        Team System
      </p>

      <h2 className="text-3xl font-black">How teams work</h2>

      <p className="mt-4 leading-7 text-gray-300">
        Create a draft team, invite your players, then submit it for admin
        review. After approval, your team becomes official inside Ascendra.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <article
            key={step.number}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-xl bg-indigo-500 px-3 py-2 text-xs font-black text-white">
                {step.number}
              </span>

              <h3 className="font-bold">{step.title}</h3>
            </div>

            <p className="text-sm leading-6 text-gray-300">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
