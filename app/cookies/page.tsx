import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cookie Policy | Ascendra",
  description: "Ascendra cookie policy.",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#070811] text-white">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-10">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-300">
          Legal
        </p>

        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-5xl">
          Cookie Policy
        </h1>

        <div className="mt-8 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-gray-300">
          <section>
            <h2 className="text-xl font-black text-white">
              1. What cookies are
            </h2>
            <p className="mt-2">
              Cookies are small files stored in your browser to help websites
              remember information and provide essential functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">
              2. How Ascendra uses cookies
            </h2>
            <p className="mt-2">
              Ascendra may use cookies or similar storage for login sessions,
              authentication, security, user preferences, and basic website
              functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">3. Discord login</h2>
            <p className="mt-2">
              When you sign in with Discord, authentication cookies may be used
              to keep you logged in and connect your Discord account with your
              Ascendra profile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">
              4. Managing cookies
            </h2>
            <p className="mt-2">
              You can clear or block cookies in your browser settings. Some
              Ascendra features, such as login and profile management, may not
              work correctly if required cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-white">5. Updates</h2>
            <p className="mt-2">
              This cookie policy may be updated as Ascendra develops and new
              platform features are added.
            </p>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
