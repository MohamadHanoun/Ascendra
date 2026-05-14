import { serverInfo } from "@/data/server";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-8 text-center text-gray-400">
      {serverInfo.footerText}
    </footer>
  );
}