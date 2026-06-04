import { createGameInline } from "@/actions/adminGameInlineActions";
import InlineAdminGameForm from "@/components/InlineAdminGameForm";

const platforms = ["PC", "Console", "Mobile", "Cross-platform"];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
      {children}
    </span>
  );
}

export default function AdminGameForm() {
  return (
    <section className="overflow-hidden border shadow-2xl shadow-black/20" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--asc-line-soft)" }}>
        <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: "var(--asc-accent)" }}>Games</p>
        <h2 className="mt-1 text-xl font-black" style={{ color: "var(--asc-fg-0)" }}>Add new game</h2>
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
              <input name="name" required placeholder="Example: Valorant" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Slug</FieldLabel>
              <input name="slug" required placeholder="Example: valorant" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>
          </div>

          <label className="grid gap-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              name="description"
              placeholder="Short public description for the games registry"
              className="min-h-24 resize-y border px-4 py-3 text-sm leading-6 outline-none transition"
              style={inputStyle}
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_160px_160px]">
            <label className="grid gap-2">
              <FieldLabel>Short name</FieldLabel>
              <input name="shortName" placeholder="Example: VAL" className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Platform</FieldLabel>
              <select name="platform" defaultValue="" className="border px-4 py-3 outline-none transition" style={inputStyle}>
                <option value="">Select platform</option>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <FieldLabel>Team size</FieldLabel>
              <input name="defaultTeamSize" type="number" min={1} max={20} defaultValue={5} className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>

            <label className="grid gap-2">
              <FieldLabel>Substitutes</FieldLabel>
              <input name="defaultSubstitutes" type="number" min={0} max={10} defaultValue={0} className="border px-4 py-3 outline-none transition" style={inputStyle} />
            </label>
          </div>
        </InlineAdminGameForm>
      </div>
    </section>
  );
}
