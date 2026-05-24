"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AdminToastProps = {
  message?: string;
  type?: "success" | "error";
};

export default function AdminToast({
  message,
  type = "success",
}: AdminToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("message");
      params.delete("type");

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      router.replace(nextUrl, { scroll: false });
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [message, pathname, router, searchParams]);

  if (!visible || !message) {
    return null;
  }

  const style: React.CSSProperties =
    type === "error"
      ? { borderColor: "oklch(0.50 0.20 25 / 0.5)", background: "oklch(0.25 0.18 25 / 0.18)", color: "var(--asc-live)" }
      : { borderColor: "oklch(0.55 0.14 150 / 0.5)", background: "oklch(0.25 0.12 150 / 0.18)", color: "var(--asc-green)" };

  return (
    <div className="fixed right-6 top-6 z-50 w-[calc(100%-3rem)] max-w-sm">
      <div className="border px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur" style={style}>
        <p className="font-black">
          {type === "error" ? "Something went wrong" : "Success"}
        </p>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--asc-fg-1)" }}>{message}</p>
      </div>
    </div>
  );
}
