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
        className="w-full rounded-xl bg-violet-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
      >
        {label}
      </button>
    </form>
  );
}
