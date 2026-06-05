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

// Reset the typeahead buffer if the user pauses this long between keystrokes.
const TYPEAHEAD_RESET_MS = 700;

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

// Normalizes a label for typeahead matching: drops leading flag emoji (regional
// indicators) and variation selectors so "🇸🇪 Sweden" matches on "swe".
function getSearchText(label: string): string {
  return label
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{FE0F}]/gu, "")
    .trim()
    .toLowerCase();
}

function isPrintableKey(event: React.KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
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
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const typeaheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: "",
    timer: null,
  });

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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

  function openMenu() {
    updateDropdownPosition();
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function selectOption(value: string) {
    setSelectedValue(value);
    setOpen(false);
  }

  function moveHighlight(direction: 1 | -1) {
    if (options.length === 0) {
      return;
    }
    setHighlightedIndex((current) => {
      const start = current < 0 ? (direction === 1 ? -1 : 0) : current;
      const next = start + direction;
      if (next < 0) {
        return 0;
      }
      if (next > options.length - 1) {
        return options.length - 1;
      }
      return next;
    });
  }

  function runTypeahead(char: string) {
    const state = typeaheadRef.current;
    const buffer = state.buffer + char.toLowerCase();
    state.buffer = buffer;

    if (state.timer) {
      clearTimeout(state.timer);
    }
    state.timer = setTimeout(() => {
      state.buffer = "";
    }, TYPEAHEAD_RESET_MS);

    const startsWithIndex = options.findIndex((option) =>
      getSearchText(option.label).startsWith(buffer),
    );
    const matchIndex =
      startsWithIndex >= 0
        ? startsWithIndex
        : options.findIndex((option) => getSearchText(option.label).includes(buffer));

    if (matchIndex >= 0) {
      setHighlightedIndex(matchIndex);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (options.length === 0) {
      return;
    }

    const { key } = event;

    if (key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        openMenu();
        return;
      }
      if (!isPrintableKey(event)) {
        return;
      }
      // Printable key while closed: open, then fall through to typeahead.
      openMenu();
    }

    if (key === "ArrowDown") {
      event.preventDefault();
      moveHighlight(1);
      return;
    }
    if (key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        selectOption(options[highlightedIndex].value);
      }
      return;
    }
    if (isPrintableKey(event)) {
      // Stop Space from triggering the trigger button's click toggle.
      if (key === " ") {
        event.preventDefault();
      }
      runTypeahead(key);
    }
  }

  useLayoutEffect(() => {
    if (open) {
      updateDropdownPosition();
    }
  }, [open]);

  // Keep the highlighted option scrolled into view during keyboard navigation.
  useEffect(() => {
    if (open && highlightedIndex >= 0) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlightedIndex]);

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
                options.map((option, index) => {
                  const active = option.value === selectedValue;
                  const highlighted = index === highlightedIndex;

                  const style = active
                    ? { border: "1px solid var(--asc-accent-border)", background: "var(--asc-accent-dim)", color: "var(--asc-fg-0)" }
                    : highlighted
                      ? { background: "var(--asc-bg-2)", color: "var(--asc-fg-0)" }
                      : { color: "var(--asc-fg-2)" };

                  return (
                    <button
                      key={option.value}
                      ref={(element) => {
                        optionRefs.current[index] = element;
                      }}
                      type="button"
                      onClick={() => {
                        selectOption(option.value);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className="grid w-full gap-1 px-4 py-3 text-left transition"
                      style={style}
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
          if (open) {
            setOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleKeyDown}
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
