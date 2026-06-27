"use client";
import { useQuery } from "@tanstack/react-query";
import { getStats, getDocuments } from "@/lib/api";
import { formatDate, OCR_STATUS_COLORS } from "@/lib/utils";
import Link from "next/link";
import type { DashboardStats, DocumentListItem } from "@/types";

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="archive-card p-5">
      <p className="text-xs font-medium text-ink-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-ink-800 mt-1 font-serif">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: getStats,
  });

  const { data: recentDocs } = useQuery<DocumentListItem[]>({
    queryKey: ["documents", "recent"],
    queryFn: () => getDocuments({ limit: 8 }),
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-800 font-serif">Archive Dashboard</h1>
        <p className="text-ink-500 mt-1">Overview of the missionary letter collection</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Documents" value={stats.total_documents} />
          <StatCard label="Transcribed" value={stats.ocr_completed} sub={`${stats.ocr_success_rate}% success rate`} />
          <StatCard label="Awaiting OCR" value={stats.ocr_pending} />
          <StatCard label="Transcriptions" value={stats.total_transcriptions} />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/documents/upload"
          className="px-5 py-2.5 bg-ink-700 text-parchment-100 rounded font-medium hover:bg-ink-600 transition-colors text-sm"
        >
          ↑ Upload Documents
        </Link>
        <Link
          href="/search"
          className="px-5 py-2.5 border border-ink-300 text-ink-700 rounded font-medium hover:bg-parchment-100 transition-colors text-sm"
        >
          ⌕ Search Archive
        </Link>
        <Link
          href="/missionaries"
          className="px-5 py-2.5 border border-ink-300 text-ink-700 rounded font-medium hover:bg-parchment-100 transition-colors text-sm"
        >
          ✦ Missionaries
        </Link>
      </div>

      {/* Recent documents */}
      <div className="archive-card overflow-hidden">
        <div className="px-5 py-4 border-b border-parchment-200 flex items-center justify-between">
          <h2 className="font-semibold text-ink-700 font-serif">Recently Added</h2>
          <Link href="/documents" className="text-xs text-ink-400 hover:text-ink-600 underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-parchment-100">
          {recentDocs?.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-parchment-50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-800 group-hover:text-ink-600 truncate font-serif">
                  {doc.title || doc.reference_number}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">
                  {doc.missionary?.name} · {doc.year} · {doc.genre?.name}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    OCR_STATUS_COLORS[doc.ocr_status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {doc.ocr_status}
                </span>
                <span className="text-xs text-ink-400">{formatDate(doc.created_at)}</span>
              </div>
            </Link>
          ))}
          {!recentDocs?.length && (
            <p className="px-5 py-8 text-center text-ink-400 text-sm">
              No documents yet.{" "}
              <Link href="/documents/upload" className="underline text-ink-600">
                Upload your first letter
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
