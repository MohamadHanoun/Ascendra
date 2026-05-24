"use client";

import { useMemo, useState } from "react";
import AnnouncementCard from "@/components/AnnouncementCard";

type AnnouncementItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  important: boolean;
  createdAt: string;
};

type AnnouncementBrowserProps = {
  announcements: AnnouncementItem[];
};

const categoryFilters = ["All", "Update", "Tournaments", "Bot", "Community", "Maintenance"];
const importanceFilters = ["All", "Important", "Normal"];

const inputStyle: React.CSSProperties = {
  borderColor: "var(--asc-line-soft)",
  background: "var(--asc-bg-2)",
  color: "var(--asc-fg-0)",
};

export default function AnnouncementBrowser({ announcements }: AnnouncementBrowserProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [importance, setImportance] = useState("All");

  const filteredAnnouncements = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return announcements.filter((announcement) => {
      const matchesSearch =
        !searchValue ||
        announcement.title.toLowerCase().includes(searchValue) ||
        announcement.category.toLowerCase().includes(searchValue) ||
        announcement.description.toLowerCase().includes(searchValue);

      const matchesCategory = category === "All" || announcement.category === category;
      const matchesImportance =
        importance === "All" ||
        (importance === "Important" && announcement.important) ||
        (importance === "Normal" && !announcement.important);

      return matchesSearch && matchesCategory && matchesImportance;
    });
  }, [announcements, search, category, importance]);

  return (
    <>
      <div className="mb-10 border p-6" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Search announcements
            </span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, category, or description..."
              className="border px-4 py-3 text-white outline-none transition"
              style={inputStyle}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Category
            </span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="border px-4 py-3 text-white outline-none transition"
              style={inputStyle}
            >
              {categoryFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: "var(--asc-fg-3)" }}>
              Importance
            </span>

            <select
              value={importance}
              onChange={(event) => setImportance(event.target.value)}
              className="border px-4 py-3 text-white outline-none transition"
              style={inputStyle}
            >
              {importanceFilters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-5 text-sm" style={{ color: "var(--asc-fg-3)" }}>
          Showing {filteredAnnouncements.length} of {announcements.length} announcements.
        </p>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div className="border p-8 text-center" style={{ borderColor: "var(--asc-line-soft)", background: "var(--asc-bg-1)" }}>
          <h2 className="mb-3 text-2xl font-black" style={{ color: "var(--asc-fg-0)" }}>No announcements found</h2>
          <p style={{ color: "var(--asc-fg-2)" }}>Try changing the search text or filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </>
  );
}
