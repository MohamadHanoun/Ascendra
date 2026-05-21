import { signIn, signOut } from "@/auth";

export function DiscordLoginButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signIn("discord", {
          redirectTo: "/admin",
        });
      }}
    >
      <button
        type="submit"
        className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
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

        await signOut({
          redirectTo: "/admin",
        });
      }}
    >
      <button
        type="submit"
        className="rounded-xl border border-white/10 bg-black/25 px-6 py-3 text-sm font-black text-gray-300 transition hover:bg-white/10 hover:text-white"
      >
        Logout
      </button>
    </form>
  );
}
