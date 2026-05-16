import type { Metadata } from "next";
import { auth } from "@/auth";
import Footer from "@/components/Footer";
import LoginWithDiscordButton from "@/components/LoginWithDiscordButton";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to RTN with Discord.",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/profile");
  }

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      <Navbar />

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-indigo-400">
          RTN Login
        </p>

        <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
          Login with Discord.
        </h1>

        <p className="mt-6 max-w-2xl leading-8 text-gray-300">
          Use your Discord account to access your RTN profile, teams, and future
          tournament features.
        </p>

        <div className="mt-10">
          <LoginWithDiscordButton />
        </div>
      </section>

      <Footer />
    </main>
  );
}
