"use client";

import { useEffect, useRef, useState } from "react";

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
};

export default function CustomSelect({
  name,
  options,
  placeholder,
  defaultValue = "",
  required = false,
}: CustomSelectProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
      />

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${
          open
            ? "border-violet-400 bg-[#0b0d17] shadow-lg shadow-violet-950/30"
            : "border-white/10 bg-black/30 hover:border-violet-400/40 hover:bg-white/[0.04]"
        }`}
      >
        <span
          className={`block truncate font-bold ${
            selectedOption ? "text-white" : "text-gray-500"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <span
          className={`text-violet-300 transition ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-violet-400/25 bg-[#0b0d17] shadow-2xl shadow-black/60">
          <div className="max-h-72 overflow-y-auto p-2">
            {options.length === 0 ? (
              <div className="rounded-xl px-4 py-3 text-sm font-bold text-gray-500">
                No options available
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
                    className={`grid w-full gap-1 rounded-xl px-4 py-3 text-left transition ${
                      active
                        ? "border border-violet-400/30 bg-violet-500/15 text-white"
                        : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="font-black">{option.label}</span>

                    {option.description && (
                      <span className="text-xs font-bold text-gray-500">
                        {option.description}
                      </span>
                    )}
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