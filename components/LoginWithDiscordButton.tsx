import { signIn } from "@/auth";

type LoginWithDiscordButtonProps = {
  label?: string;
};

export default function LoginWithDiscordButton({
  label = "Login with Discord",
}: LoginWithDiscordButtonProps) {
  return (
    <form
      action={async () => {
        "use server";

        await signIn("discord", {
          redirectTo: "/profile",
        });
      }}
    >
      <button
        type="submit"
        className="group relative isolate inline-flex w-full cursor-pointer items-center justify-center overflow-hidden border px-6 py-4 text-sm font-black uppercase tracking-[0.14em] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:ring-4 focus-visible:ring-[var(--asc-accent-glow)] active:translate-y-0 active:scale-[0.99] active:brightness-95"
        style={{
          borderColor: "var(--asc-accent-border-strong)",
          background:
            "linear-gradient(135deg, var(--asc-accent), var(--asc-accent-2))",
          clipPath:
            "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
          color: "var(--asc-fg-0)",
          boxShadow:
            "0 18px 40px rgba(0, 0, 0, 0.34), 0 0 26px var(--asc-accent-glow)",
          outlineColor: "var(--asc-accent)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(246, 238, 229, 0.18), transparent 46%, rgba(255, 255, 255, 0.08))",
          }}
        />
        <span className="relative z-10">{label}</span>
      </button>
    </form>
  );
}
