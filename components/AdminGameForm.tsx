import { createGameInline } from "@/actions/adminGameInlineActions";
import InlineAdminGameForm from "@/components/InlineAdminGameForm";

const platforms = ["PC", "Console", "Mobile", "Cross-platform"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold text-gray-200">{children}</span>;
}

function inputClass() {
  return "rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400";
}

export default function AdminGameForm() {
  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Games
        </p>

        <h2 className="mt-1 text-xl font-black text-white">Add new game</h2>
      </div>

      <div className="p-5">
        <InlineAdminGameForm
          action={createGameInline}
          buttonLabel="Add game"
          pendingLabel="Adding..."
          resetOnSuccess
          className="grid gap-5"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <FieldLabel>Name</FieldLabel>

              <input
                name="name"
                required
                placeholder="Example: Valorant"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Slug</FieldLabel>

              <input
                name="slug"
                required
                placeholder="Example: valorant"
                className={inputClass()}
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_160px_160px]">
            <label className="grid gap-2">
              <FieldLabel>Short name</FieldLabel>

              <input
                name="shortName"
                placeholder="Example: VAL"
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Platform</FieldLabel>

              <select
                name="platform"
                defaultValue=""
                className={inputClass()}
              >
                <option value="">Select platform</option>

                {platforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Team size</FieldLabel>

              <input
                name="defaultTeamSize"
                type="number"
                min={1}
                max={20}
                defaultValue={5}
                className={inputClass()}
              />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Substitutes</FieldLabel>

              <input
                name="defaultSubstitutes"
                type="number"
                min={0}
                max={10}
                defaultValue={0}
                className={inputClass()}
              />
            </label>
          </div>
        </InlineAdminGameForm>
      </div>
    </section>
  );
}
