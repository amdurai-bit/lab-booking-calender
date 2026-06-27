"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { getMissionaries, getGenres, createDocument, uploadImages, createMissionary } from "@/lib/api";
import type { Missionary, Genre } from "@/types";

const LANGUAGES = ["English", "Tamil", "Malayalam", "Mixed"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewMissionary, setShowNewMissionary] = useState(false);
  const [newMissionaryName, setNewMissionaryName] = useState("");

  const [form, setForm] = useState({
    missionary_id: "",
    year: new Date().getFullYear() - 150,
    month: "",
    genre_id: "",
    language: "English",
    title: "",
    description: "",
    notes: "",
    keywords: "",
  });

  const { data: missionaries = [], refetch: refetchMissionaries } = useQuery<Missionary[]>({
    queryKey: ["missionaries"],
    queryFn: getMissionaries,
  });
  const { data: genres = [] } = useQuery<Genre[]>({ queryKey: ["genres"], queryFn: getGenres });

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/tiff": [".tiff", ".tif"],
      "application/pdf": [".pdf"],
    },
    multiple: true,
  });

  const handleAddMissionary = async () => {
    if (!newMissionaryName.trim()) return;
    try {
      const m = await createMissionary({ name: newMissionaryName.trim() });
      await refetchMissionaries();
      setForm((f) => ({ ...f, missionary_id: m.id }));
      setShowNewMissionary(false);
      setNewMissionaryName("");
      toast.success(`Added missionary: ${m.name}`);
    } catch {
      toast.error("Failed to add missionary");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.missionary_id) return toast.error("Please select a missionary");
    if (!form.genre_id) return toast.error("Please select a genre");
    if (files.length === 0) return toast.error("Please upload at least one image");

    setLoading(true);
    try {
      const docData = {
        missionary_id: form.missionary_id,
        year: Number(form.year),
        month: form.month ? Number(form.month) : null,
        genre_id: form.genre_id,
        language: form.language,
        title: form.title || null,
        description: form.description || null,
        notes: form.notes || null,
        keywords: form.keywords ? form.keywords.split(",").map((k) => k.trim()) : [],
      };

      const doc = await createDocument(docData);
      await uploadImages(doc.id, files);

      toast.success("Document uploaded successfully!");
      router.push(`/documents/${doc.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-ink-800 font-serif">Upload Document</h1>
        <p className="text-ink-500 text-sm mt-1">Add scanned letters to the archive</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File upload */}
        <div className="archive-card p-5">
          <h2 className="font-semibold text-ink-700 mb-3 font-serif">Scanned Images</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-ink-500 bg-parchment-100" : "border-parchment-300 hover:border-ink-400"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-4xl mb-3">📄</p>
            <p className="text-ink-600 font-medium">
              {isDragActive ? "Drop the files here…" : "Drag & drop images or click to select"}
            </p>
            <p className="text-xs text-ink-400 mt-1">JPEG, PNG, TIFF, PDF · Max 100MB each</p>
          </div>

          {files.length > 0 && (
            <ul className="mt-3 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm text-ink-600 bg-parchment-100 px-3 py-1.5 rounded">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-ink-400 hover:text-red-600 ml-2 shrink-0"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Metadata */}
        <div className="archive-card p-5 space-y-4">
          <h2 className="font-semibold text-ink-700 font-serif">Document Metadata</h2>

          {/* Missionary */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Missionary *</label>
            <div className="flex gap-2">
              <select
                required
                value={form.missionary_id}
                onChange={(e) => setForm({ ...form, missionary_id: e.target.value })}
                className="flex-1 px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
              >
                <option value="">Select missionary…</option>
                {missionaries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowNewMissionary(!showNewMissionary)}
                className="px-3 py-2 border border-parchment-300 rounded text-ink-600 text-sm hover:bg-parchment-100"
              >
                + New
              </button>
            </div>
            {showNewMissionary && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Missionary name…"
                  value={newMissionaryName}
                  onChange={(e) => setNewMissionaryName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-parchment-300 rounded text-sm bg-parchment-50 text-ink-800"
                />
                <button
                  type="button"
                  onClick={handleAddMissionary}
                  className="px-3 py-1.5 bg-ink-700 text-parchment-100 rounded text-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Year *</label>
              <input
                type="number"
                required
                min={1700}
                max={1950}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Month</label>
              <select
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
              >
                <option value="">Unknown</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Genre *</label>
              <select
                required
                value={form.genre_id}
                onChange={(e) => setForm({ ...form, genre_id: e.target.value })}
                className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
              >
                <option value="">Select genre…</option>
                {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Language</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Letter to the Mission Secretary"
              className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Keywords</label>
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="comma-separated: Travancore, conversion, medical"
              className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Archival notes, condition, provenance…"
              className="w-full px-3 py-2 border border-parchment-300 rounded bg-parchment-50 text-ink-800 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-ink-700 text-parchment-100 rounded font-medium hover:bg-ink-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Uploading…" : "Upload to Archive"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-parchment-300 text-ink-600 rounded hover:bg-parchment-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
