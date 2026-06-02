"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notificationActions";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
const CUT8 =
  "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)";
const CUT6 =
  "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  ok: boolean;
  unreadCount?: number;
  notifications?: NotificationItem[];
  error?: string;
};

type NotificationsDropdownProps = {
  isLoggedIn: boolean;
};

const signInMessage = "Sign in to view notifications.";
const unavailableMessage = "Notifications are temporarily unavailable.";

function formatCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

async function parseNotificationsResponse(response: Response) {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error(unavailableMessage);
  }

  try {
    return JSON.parse(body) as NotificationsResponse;
  } catch {
    throw new Error(unavailableMessage);
  }
}

export default function NotificationsDropdown({
  isLoggedIn,
}: NotificationsDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotificationsRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      setNotifications([]);
      setUnreadCount(0);
      setHasFetched(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications?limit=10", {
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await parseNotificationsResponse(response);

      if (response.status === 401) {
        throw new Error(signInMessage);
      }

      if (!response.ok) {
        throw new Error(unavailableMessage);
      }

      if (!payload.ok) {
        throw new Error(
          payload.error === "Unauthorized" ? signInMessage : unavailableMessage,
        );
      }

      setUnreadCount(payload.unreadCount ?? 0);
      setNotifications(payload.notifications ?? []);
      setHasFetched(true);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : unavailableMessage,
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  });

  useEffect(() => {
    void fetchNotificationsRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

    useRealtimeEvents({
      audience: "public",
      intervalSeconds: 2,
      onEvents(events) {
        if (!isLoggedIn) {
          return;
        }

        const hasNotificationEvent = events.some(
          (event) =>
            event.type === "notification.created" ||
            event.type === "notification.updated" ||
            event.entityType === "notification",
        );

        if (hasNotificationEvent) {
          void fetchNotifications();
        }
      },
    });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function toggleDropdown() {
    const nextOpen = !isOpen;

    setIsOpen(nextOpen);

    if (nextOpen && isLoggedIn) {
      void fetchNotifications();
    }
  }

  function markReadLocally(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readAt: notification.readAt || new Date().toISOString(),
            }
          : notification,
      ),
    );
    setUnreadCount((count) => Math.max(count - 1, 0));
  }

  function handleNotificationClick(notification: NotificationItem) {
    const wasUnread = !notification.readAt;

    if (wasUnread) {
      markReadLocally(notification.id);
    }

    startTransition(async () => {
      if (wasUnread) {
        const formData = new FormData();
        formData.set("notificationId", notification.id);
        await markNotificationReadAction(formData);
      }

      setIsOpen(false);

      if (notification.href) {
        router.push(notification.href);
      }
    });
  }

  function handleMarkAllRead() {
    if (notifications.length === 0 || unreadCount === 0) {
      return;
    }

    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt || now,
      })),
    );
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        onClick={toggleDropdown}
        className="grid"
        style={{
          placeItems: "center",
          width: 36,
          height: 36,
          flexShrink: 0,
          background: isOpen ? "var(--asc-bg-2)" : "var(--asc-bg-1)",
          border: "1px solid var(--asc-line-soft)",
          color: "var(--asc-fg-1)",
          clipPath: CUT8,
          cursor: "pointer",
          position: "relative",
        }}
      >
        <svg
          width={15}
          height={15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              background: "var(--asc-accent)",
              color: "var(--asc-fg-0)",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 9,
              fontWeight: 600,
              padding: "1px 4px",
              lineHeight: 1.4,
            }}
          >
            {formatCount(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute mt-2 w-80 overflow-hidden shadow-2xl ltr:right-0 rtl:left-0"
          style={{
            zIndex: 60,
            border: "1px solid var(--asc-line)",
            background: "var(--asc-bg-2)",
            clipPath: CUT8,
          }}
        >
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{
              borderBottom: "1px solid var(--asc-line-soft)",
              background: "var(--asc-bg-1)",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--asc-fg-0)",
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Notifications
              </p>
              <p
                style={{
                  color: "var(--asc-fg-3)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 10,
                }}
              >
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={!isLoggedIn || unreadCount === 0 || isPending}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                color:
                  unreadCount > 0 && isLoggedIn
                    ? "var(--asc-accent)"
                    : "var(--asc-fg-3)",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                cursor: unreadCount > 0 && isLoggedIn ? "pointer" : "default",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            {!isLoggedIn ? (
              <div className="px-4 py-6 text-sm" style={{ color: "var(--asc-fg-2)" }}>
                Sign in to view notifications.
              </div>
            ) : isLoading ? (
              <div className="px-4 py-6 text-sm" style={{ color: "var(--asc-fg-2)" }}>
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm" style={{ color: "var(--asc-fg-2)" }}>
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm" style={{ color: "var(--asc-fg-2)" }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.readAt;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="mb-1 block w-full p-3 text-start transition last:mb-0"
                    style={{
                      background: isUnread
                        ? "var(--asc-accent-dim)"
                        : "transparent",
                      border: "1px solid var(--asc-line-soft)",
                      clipPath: CUT6,
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className="min-w-0 flex-1 truncate"
                        style={{
                          color: "var(--asc-fg-0)",
                          fontFamily: "var(--font-display, sans-serif)",
                          fontSize: 12,
                          fontWeight: 700,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {notification.title}
                      </p>
                      <span
                        style={{
                          color: "var(--asc-fg-3)",
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 9,
                          flexShrink: 0,
                        }}
                      >
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p
                      className="mt-1 line-clamp-2 text-xs"
                      style={{
                        color: "var(--asc-fg-2)",
                        lineHeight: 1.45,
                      }}
                    >
                      {notification.message}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
