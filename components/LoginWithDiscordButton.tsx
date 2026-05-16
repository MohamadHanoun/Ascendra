import { signIn } from "@/auth";

export default function LoginWithDiscordButton() {
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
        className="rounded-xl bg-indigo-500 px-7 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-indigo-400"
      >
        Login with Discord
      </button>
    </form>
  );
}
