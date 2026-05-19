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

      router.replace(nextUrl, {
        scroll: false,
      });
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [message, pathname, router, searchParams]);

  if (!visible || !message) {
    return null;
  }

  const styles =
    type === "error"
      ? "border-red-400/30 bg-red-500/15 text-red-200"
      : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";

  return (
    <div className="fixed right-6 top-6 z-50 w-[calc(100%-3rem)] max-w-sm">
      <div
        className={`rounded-3xl border px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur ${styles}`}
      >
        <p className="font-black">
          {type === "error" ? "Something went wrong" : "Success"}
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-200">{message}</p>
      </div>
    </div>
  );
}
