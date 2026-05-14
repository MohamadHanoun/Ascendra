import { serverInfo } from "@/data/server";

export default function Navbar() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <a href="/" className="text-2xl font-bold tracking-wide">
        {serverInfo.shortName}
        <span className="text-indigo-400">{serverInfo.highlightedName}</span>
      </a>

      <div className="hidden gap-8 text-sm text-gray-300 md:flex">
        <a href="/#features" className="hover:text-white">
          Features
        </a>
        <a href="/#stats" className="hover:text-white">
          Stats
        </a>
        <a href="/#rules" className="hover:text-white">
          Rules
        </a>
        <a href="/tournaments" className="hover:text-white">
          Tournaments
        </a>
      </div>

      <a
        href={serverInfo.inviteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold transition hover:bg-indigo-400"
      >
        Join Discord
      </a>
    </nav>
  );
}