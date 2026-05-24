import { signIn, signOut } from "@/auth";

export function DiscordLoginButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("discord", { redirectTo: "/admin" });
      }}
    >
      <button
        type="submit"
        className="px-6 py-3 text-sm font-black text-white transition hover:opacity-90"
        style={{ background: "var(--asc-accent-2)", boxShadow: "0 0 16px var(--asc-accent-glow)" }}
      >
        Login with Discord
      </button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/admin" });
      }}
    >
      <button
        type="submit"
        className="border px-6 py-3 text-sm font-black transition hover:opacity-90"
        style={{ borderColor: "var(--asc-line-soft)", color: "var(--asc-fg-2)", background: "transparent" }}
      >
        Logout
      </button>
    </form>
  );
}
