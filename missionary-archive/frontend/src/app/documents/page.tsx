"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getDocuments, getMissionaries, getGenres } from "@/lib/api";
import { formatDate, OCR_STATUS_COLORS } from "@/lib/utils";
import type { DocumentListItem, Missionary, Genre } from "@/types";

const LANGUAGES = ["English", "Tamil", "Malayalam", "Mixed"];
const OCR_STATUSES = ["pending", "processing", "completed", "failed"];

export default function DocumentsPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: docs = [], isLoading } = useQuery<DocumentListItem[]>({
    queryKey: ["documents", filters],
    queryFn: () => getDocuments(filters),
  });
  const { data: missionaries = [] } = useQuery<Missionary[]>({ queryKey: ["missionaries"], queryFn: getMissionaries });
  const { data: genres = [] } = useQuery<Genre[]>({ queryKey: ["genres"], queryFn: getGenres });

  const setFilter = (key: string, val: string) =>
    setFilters((f) => (val ? { ...f, [key]: val } : Object.fromEntries(Object.entries(f).filter(([k]) => k !== key))));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-ink-800 font-serif">Archive</h1>
          <p className="text-ink-500 text-sm mt-1">{docs.length} documents</p>
        </div>
        <Link
          href="/documents/upload"
          className="px-4 py-2 bg-ink-700 text-parchment-100 rounded text-sm font-medium hover:bg-ink-600 transition-colors"
        >
          ↑ Upload
        </Link>
      </div>

      {/* Filters */}
      <div className="archive-card p-4 mb-6 flex flex-wrap gap-3">
        <select
          className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
          onChange={(e) => setFilter("missionary_id", e.target.value)}
        >
          <option value="">All missionaries</option>
          {missionaries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
          onChange={(e) => setFilter("genre_id", e.target.value)}
        >
          <option value="">All genres</option>
          {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
          onChange={(e) => setFilter("language", e.target.value)}
        >
          <option value="">All languages</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
          onChange={(e) => setFilter("ocr_status", e.target.value)}
        >
          <option value="">All statuses</option>
          {OCR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="number"
          placeholder="Year"
          className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700 w-24"
          onChange={(e) => setFilter("year", e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="archive-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-ink-400">Loading archive…</div>
        ) : docs.length === 0 ? (
          <div className="p-10 text-center text-ink-400">
            No documents found.{" "}
            <Link href="/documents/upload" className="underline">Upload some letters</Link>.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-parchment-100 border-b border-parchment-200">
              <tr>
                {["Reference", "Missionary", "Year", "Genre", "Language", "Pages", "OCR Status", "Added"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-parchment-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/documents/${doc.id}`} className="font-medium text-ink-700 hover:text-ink-500 font-serif">
                      {doc.reference_number}
                    </Link>
                    {doc.title && <p className="text-xs text-ink-400 truncate max-w-[180px]">{doc.title}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{doc.missionary?.name || "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{doc.year}</td>
                  <td className="px-4 py-3 text-ink-600">{doc.genre?.name || "—"}</td>
                  <td className="px-4 py-3 text-ink-600">{doc.language}</td>
                  <td className="px-4 py-3 text-ink-600 text-center">{doc.page_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${OCR_STATUS_COLORS[doc.ocr_status] || "bg-gray-100"}`}>
                      {doc.ocr_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-400 text-xs">{formatDate(doc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
