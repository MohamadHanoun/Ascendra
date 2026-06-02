"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
import { createPortal } from "react-dom";

type CustomSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type CustomSelectProps = {
  name: string;
  options: CustomSelectOption[];
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
  emptyLabel?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function getCookieValue(name: string) {
  const cookies = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean);

  const targetCookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!targetCookie) {
    return "";
  }

  return decodeURIComponent(targetCookie.split("=").slice(1).join("="));
}

function getDefaultEmptyLabel() {
  if (typeof document === "undefined") {
    return "No options available";
  }

  const locale = getCookieValue("ascendra_locale");

  return locale === "ar" ? "لا توجد خيارات متاحة" : "No options available";
}

export default function CustomSelect({
  name,
  options,
  placeholder,
  defaultValue = "",
  required = false,
  emptyLabel,
}: CustomSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [position, setPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 280,
  });

  if (prevDefaultValue !== defaultValue) {
    setPrevDefaultValue(defaultValue);
    setSelectedValue(defaultValue);
  }

  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  function updateDropdownPosition() {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spacing = 8;
    const bottomSpace = viewportHeight - rect.bottom - spacing;
    const topSpace = rect.top - spacing;

    const shouldOpenUp = bottomSpace < 220 && topSpace > bottomSpace;

    const maxHeight = Math.max(
      180,
      Math.min(320, shouldOpenUp ? topSpace : bottomSpace),
    );

    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight,
      top: shouldOpenUp
        ? Math.max(spacing, rect.top - maxHeight - spacing)
        : rect.bottom + spacing,
    });
  }


  useLayoutEffect(() => {
    if (open) {
      updateDropdownPosition();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(target instanceof HTMLElement && target.closest("[data-select-menu]"))
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handleReposition() {
      if (open) {
        updateDropdownPosition();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const dropdown =
    mounted && open
      ? createPortal(
          <div
            data-select-menu
            className="fixed z-[99999] border p-2 shadow-2xl shadow-black/80"
            style={{
              borderColor: "var(--asc-accent-border)",
              background: "var(--asc-bg-1)",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            <div
              className="overflow-y-auto pr-1"
              style={{
                maxHeight: position.maxHeight,
              }}
            >
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm font-bold" style={{ color: "var(--asc-fg-3)" }}>
                  {emptyLabel || getDefaultEmptyLabel()}
                </div>
              ) : (
                options.map((option) => {
                  const active = option.value === selectedValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedValue(option.value);
                        setOpen(false);
                      }}
                      className="grid w-full gap-1 px-4 py-3 text-left transition"
                      style={
                        active
                          ? { border: "1px solid var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)" }
                          : { color: "var(--asc-fg-2)" }
                      }
                    >
                      <span className="font-black">{option.label}</span>

                      {option.description && (
                        <span className="text-xs font-bold" style={{ color: "var(--asc-fg-3)" }}>
                          {option.description}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
      />

      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          updateDropdownPosition();
          setOpen((current) => !current);
        }}
        className="flex w-full items-center justify-between gap-4 border px-4 py-3 text-left transition"
        style={
          open
            ? { borderColor: "var(--asc-accent)", background: "var(--asc-bg-1)" }
            : { borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-2)" }
        }
      >
        <span
          className="block truncate font-bold"
          style={{ color: selectedOption ? "var(--asc-fg-0)" : "var(--asc-fg-3)" }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span
          className={`transition ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--asc-accent)" }}
        >
          ▾
        </span>
      </button>

      {dropdown}
    </div>
  );
}
