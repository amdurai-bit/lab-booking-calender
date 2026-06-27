"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  getDocument, getDocumentTranscriptions, getOCREngines, startOCR,
  getDocumentJobs, updateTranscription, exportDocument,
} from "@/lib/api";
import { getImageUrl, downloadBlob, formatDate, OCR_STATUS_COLORS } from "@/lib/utils";
import type { Document, Transcription, OCRJob } from "@/types";
import { ImageViewer } from "@/components/editor/ImageViewer";
import { TranscriptionEditor } from "@/components/editor/TranscriptionEditor";

const EXPORT_FORMATS = [
  { id: "txt", label: "Plain Text (.txt)" },
  { id: "json", label: "JSON (.json)" },
  { id: "tei", label: "TEI XML (.xml)" },
  { id: "docx", label: "Word Document (.docx)" },
];

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedEngine, setSelectedEngine] = useState("tesseract");
  const [selectedLang, setSelectedLang] = useState("English");
  const [ocrRunning, setOcrRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "metadata" | "history">("editor");

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ["document", id],
    queryFn: () => getDocument(id),
  });

  const { data: transcriptions = [] } = useQuery<Transcription[]>({
    queryKey: ["transcriptions", id],
    queryFn: () => getDocumentTranscriptions(id),
    enabled: !!id,
  });

  const { data: engines = [] } = useQuery({
    queryKey: ["ocr-engines"],
    queryFn: getOCREngines,
  });

  const { data: jobs = [] } = useQuery<OCRJob[]>({
    queryKey: ["ocr-jobs", id],
    queryFn: () => getDocumentJobs(id),
    enabled: !!id,
    refetchInterval: ocrRunning ? 3000 : false,
  });

  const currentImage = doc?.images[selectedImageIdx];
  const currentTranscription = transcriptions.find(
    (t) => t.image_id === currentImage?.id
  ) || transcriptions[selectedImageIdx];

  const handleStartOCR = async () => {
    if (!doc) return;
    setOcrRunning(true);
    try {
      await startOCR(id, {
        engine: selectedEngine,
        language: selectedLang,
        image_ids: currentImage ? [currentImage.id] : null,
      });
      toast.success("OCR job queued");
      qc.invalidateQueries({ queryKey: ["ocr-jobs", id] });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to start OCR");
      setOcrRunning(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      const resp = await exportDocument(id, format);
      const ext = format === "tei" ? "tei.xml" : format;
      downloadBlob(resp.data, `${doc?.reference_number}.${ext}`);
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-ink-400">Loading document…</div>;
  }
  if (!doc) {
    return <div className="p-10 text-center text-red-500">Document not found.</div>;
  }

  const activeJob = jobs.find((j) =>
    j.image_id === currentImage?.id &&
    (j.status === "queued" || j.status === "processing")
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-ink-800 text-parchment-100 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/documents" className="text-parchment-400 hover:text-parchment-100 text-sm">
            ← Archive
          </Link>
          <div>
            <p className="font-bold font-serif text-sm">{doc.reference_number}</p>
            {doc.title && <p className="text-parchment-400 text-xs">{doc.title}</p>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${OCR_STATUS_COLORS[doc.ocr_status] || "bg-gray-100"}`}>
            {doc.ocr_status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* OCR controls */}
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value)}
            className="text-xs px-2 py-1 bg-ink-700 text-parchment-200 border border-ink-600 rounded"
          >
            {engines.map((e: any) => (
              <option key={e.id} value={e.id} disabled={!e.available}>
                {e.name}{e.available ? "" : " (unavailable)"}
              </option>
            ))}
          </select>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="text-xs px-2 py-1 bg-ink-700 text-parchment-200 border border-ink-600 rounded"
          >
            {["English", "Tamil", "Malayalam", "Mixed"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button
            onClick={handleStartOCR}
            disabled={!!activeJob}
            className="px-3 py-1 bg-parchment-500 text-parchment-50 rounded text-xs font-medium hover:bg-parchment-400 disabled:opacity-50 transition-colors"
          >
            {activeJob ? `Processing… ${activeJob.progress}%` : "▶ Run OCR"}
          </button>

          {/* Export */}
          <div className="relative group">
            <button className="px-3 py-1 border border-ink-600 text-parchment-300 rounded text-xs hover:bg-ink-700 transition-colors">
              Export ▾
            </button>
            <div className="absolute right-0 top-full mt-1 bg-ink-800 border border-ink-600 rounded shadow-xl z-50 hidden group-hover:block w-48">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleExport(f.id)}
                  className="block w-full text-left px-4 py-2 text-xs text-parchment-300 hover:bg-ink-700 hover:text-parchment-100"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-parchment-100 border-b border-parchment-200 px-6 flex gap-0 shrink-0">
        {(["editor", "metadata", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-ink-700 text-ink-800"
                : "border-transparent text-ink-400 hover:text-ink-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main workspace */}
      {activeTab === "editor" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Image viewer */}
          <div className="w-1/2 border-r border-parchment-200 flex flex-col overflow-hidden">
            {/* Page thumbnails */}
            {doc.images.length > 1 && (
              <div className="flex gap-2 p-3 bg-parchment-100 border-b border-parchment-200 overflow-x-auto shrink-0">
                {doc.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(i)}
                    className={`shrink-0 border-2 rounded overflow-hidden transition-all ${
                      i === selectedImageIdx ? "border-ink-600" : "border-parchment-300 opacity-70"
                    }`}
                  >
                    <img
                      src={img.thumbnail_path ? getImageUrl(img.thumbnail_path) : "/placeholder.svg"}
                      alt={`Page ${i + 1}`}
                      className="w-12 h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image viewer */}
            <div className="flex-1 overflow-hidden">
              {currentImage ? (
                <ImageViewer
                  src={getImageUrl(currentImage.file_path)}
                  lineData={currentTranscription?.line_data || []}
                  imageWidth={currentImage.width}
                  imageHeight={currentImage.height}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-ink-400 text-sm">
                  No image available
                </div>
              )}
            </div>
          </div>

          {/* Right: Transcription editor */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <TranscriptionEditor
              transcription={currentTranscription}
              documentId={id}
              imageId={currentImage?.id}
            />
          </div>
        </div>
      )}

      {activeTab === "metadata" && (
        <div className="flex-1 overflow-auto p-8 max-w-2xl">
          <div className="archive-card p-6 space-y-4">
            <h2 className="font-semibold text-ink-700 font-serif text-lg">Document Metadata</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Reference", doc.reference_number],
                ["Missionary", doc.missionary?.name || "—"],
                ["Year", String(doc.year)],
                ["Month", doc.month ? String(doc.month) : "—"],
                ["Genre", doc.genre?.name || "—"],
                ["Language", doc.language],
                ["Pages", String(doc.page_count)],
                ["OCR Engine", doc.ocr_engine || "—"],
                ["Added", formatDate(doc.created_at)],
                ["Modified", formatDate(doc.updated_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-ink-400 text-xs uppercase tracking-wide font-medium">{k}</dt>
                  <dd className="text-ink-700 mt-0.5 font-serif">{v}</dd>
                </div>
              ))}
            </dl>
            {doc.keywords?.length > 0 && (
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.keywords.map((kw) => (
                    <span key={kw} className="px-2 py-0.5 bg-parchment-200 text-ink-700 rounded text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {doc.notes && (
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-wide font-medium mb-1">Notes</p>
                <p className="text-ink-700 text-sm leading-relaxed">{doc.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="flex-1 overflow-auto p-8 max-w-3xl">
          <div className="archive-card overflow-hidden">
            <div className="px-5 py-4 border-b border-parchment-200">
              <h2 className="font-semibold text-ink-700 font-serif">OCR Job History</h2>
            </div>
            <div className="divide-y divide-parchment-100">
              {jobs.length === 0 && (
                <p className="px-5 py-6 text-ink-400 text-sm text-center">No OCR jobs yet.</p>
              )}
              {jobs.map((job) => (
                <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-700 font-serif">
                      {job.engine} · {job.language}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {formatDate(job.queued_at)}
                      {job.processing_time_ms && ` · ${(job.processing_time_ms / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.confidence != null && (
                      <span className="text-xs text-ink-500">
                        {(job.confidence * 100).toFixed(1)}% conf.
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${OCR_STATUS_COLORS[job.status] || "bg-gray-100"}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcription versions */}
          {currentTranscription && currentTranscription.versions.length > 0 && (
            <div className="archive-card overflow-hidden mt-4">
              <div className="px-5 py-4 border-b border-parchment-200">
                <h2 className="font-semibold text-ink-700 font-serif">Transcription Versions</h2>
              </div>
              <div className="divide-y divide-parchment-100">
                {currentTranscription.versions.map((v) => (
                  <div key={v.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-ink-700">Version {v.version_number}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {formatDate(v.saved_at)} · {v.change_summary || "No summary"}
                    </p>
                    {v.text_snapshot && (
                      <p className="text-xs text-ink-500 mt-1 line-clamp-2 italic">{v.text_snapshot}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
