"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { search, getMissionaries, getGenres } from "@/lib/api";
import { formatDate, OCR_STATUS_COLORS } from "@/lib/utils";
import type { SearchResult, Missionary, Genre } from "@/types";
import { Sidebar } from "@/components/layout/Sidebar";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: missionaries = [] } = useQuery<Missionary[]>({ queryKey: ["missionaries"], queryFn: getMissionaries });
  const { data: genres = [] } = useQuery<Genre[]>({ queryKey: ["genres"], queryFn: getGenres });

  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: ["search", submitted, filters],
    queryFn: () => search({ q: submitted || undefined, ...filters }),
    enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-parchment-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-ink-800 font-serif mb-6">Search Archive</h1>

          <form onSubmit={handleSubmit} className="archive-card p-5 mb-6 space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transcriptions, notes, keywords…"
                className="flex-1 px-4 py-2.5 border border-parchment-300 rounded bg-parchment-50 text-ink-800 focus:outline-none focus:ring-2 focus:ring-ink-400"
              />
              <button type="submit" className="px-6 py-2.5 bg-ink-700 text-parchment-100 rounded font-medium hover:bg-ink-600 transition-colors">
                Search
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
                onChange={(e) => setFilters((f) => ({ ...f, missionary_id: e.target.value }))}
              >
                <option value="">All missionaries</option>
                {missionaries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select
                className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
                onChange={(e) => setFilters((f) => ({ ...f, genre_id: e.target.value }))}
              >
                <option value="">All genres</option>
                {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input
                type="number"
                placeholder="From year"
                className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700 w-28"
                onChange={(e) => setFilters((f) => ({ ...f, year_from: e.target.value }))}
              />
              <input
                type="number"
                placeholder="To year"
                className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700 w-28"
                onChange={(e) => setFilters((f) => ({ ...f, year_to: e.target.value }))}
              />
              <select
                className="px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-700"
                onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
              >
                <option value="">All languages</option>
                {["English","Tamil","Malayalam","Mixed"].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </form>

          {results && (
            <p className="text-sm text-ink-500 mb-4">
              {results.total} result{results.total !== 1 ? "s" : ""}
              {submitted ? ` for "${submitted}"` : ""}
            </p>
          )}

          <div className="space-y-3">
            {isLoading && <p className="text-ink-400 text-center py-8">Searching…</p>}
            {results?.results.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="archive-card p-4 flex items-center justify-between hover:bg-parchment-100 transition-colors block"
              >
                <div>
                  <p className="font-semibold text-ink-700 font-serif">
                    {doc.title || doc.reference_number}
                  </p>
                  <p className="text-xs text-ink-400 mt-1">
                    {doc.missionary?.name} · {doc.year} · {doc.genre?.name} · {doc.language}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${OCR_STATUS_COLORS[doc.ocr_status] || ""}`}>
                    {doc.ocr_status}
                  </span>
                  <span className="text-xs text-ink-400">{formatDate(doc.created_at)}</span>
                </div>
              </Link>
            ))}
            {results?.results.length === 0 && (
              <p className="text-ink-400 text-center py-12">No documents match your search.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
