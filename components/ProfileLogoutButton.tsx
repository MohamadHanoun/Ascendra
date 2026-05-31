import { signOut } from "@/auth";

export default function ProfileLogoutButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signOut({
          redirectTo: "/login",
        });
      }}
    >
      <button
        type="submit"
        className="border px-5 py-3 font-bold transition hover:opacity-90"
        style={{ borderColor: "var(--asc-live-border)", color: "var(--asc-live)", background: "transparent" }}
      >
        Logout
      </button>
    </form>
  );
}
