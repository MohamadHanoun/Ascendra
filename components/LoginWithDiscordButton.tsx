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
        className="w-full px-6 py-4 text-sm font-black text-white shadow-lg shadow-black/30 transition"
        style={{ background: "var(--asc-accent-2)" }}
      >
        {label}
      </button>
    </form>
  );
}
