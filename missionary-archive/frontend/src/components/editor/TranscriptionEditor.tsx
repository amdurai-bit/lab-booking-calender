"use client";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateTranscription } from "@/lib/api";
import type { Transcription } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  transcription?: Transcription;
  documentId: string;
  imageId?: string;
}

export function TranscriptionEditor({ transcription, documentId, imageId }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = transcription?.corrected_text ?? transcription?.raw_text ?? "";
    setText(t);
    setIsDirty(false);
  }, [transcription?.id]);

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => updateTranscription(id, data),
    onSuccess: () => {
      toast.success("Transcription saved");
      setIsDirty(false);
      qc.invalidateQueries({ queryKey: ["transcriptions", documentId] });
    },
    onError: () => toast.error("Failed to save"),
  });

  const handleSave = () => {
    if (!transcription?.id) return;
    mutation.mutate({
      id: transcription.id,
      data: { corrected_text: text, change_summary: "Manual edit" },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
    // Ctrl+F to find
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      setShowSearch((s) => !s);
    }
  };

  const handleFindReplace = (find: string, replace: string) => {
    const updated = text.replaceAll(find, replace);
    setText(updated);
    setIsDirty(true);
  };

  const rawText = transcription?.raw_text;
  const isFromOCR = !transcription?.corrected_text && !!rawText;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-parchment-50 border-b border-parchment-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-600 font-serif">Transcription</span>
          {transcription && (
            <span className="text-xs text-ink-400">
              v{transcription.version} ·{" "}
              {transcription.ocr_confidence != null && `${(transcription.ocr_confidence * 100).toFixed(1)}% conf. · `}
              {transcription.ocr_engine}
            </span>
          )}
          {isFromOCR && (
            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
              Raw OCR — edit to correct
            </span>
          )}
          {isDirty && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSearch((s) => !s)}
            className="px-2 py-1 text-xs border border-parchment-300 rounded text-ink-600 hover:bg-parchment-100"
            title="Find & Replace (Ctrl+F)"
          >
            ⌕
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || mutation.isPending || !transcription}
            className="px-3 py-1 bg-ink-700 text-parchment-100 rounded text-xs font-medium disabled:opacity-40 hover:bg-ink-600 transition-colors"
          >
            {mutation.isPending ? "Saving…" : "Save (Ctrl+S)"}
          </button>
        </div>
      </div>

      {/* Find & Replace */}
      {showSearch && (
        <FindReplace onReplace={handleFindReplace} onClose={() => setShowSearch(false)} />
      )}

      {/* Text area */}
      {transcription ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setIsDirty(true);
          }}
          onKeyDown={handleKeyDown}
          spellCheck
          className="flex-1 p-5 resize-none outline-none manuscript-text border-0 bg-white"
          placeholder="Transcription will appear here after OCR…"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-ink-400 gap-3 p-8 text-center">
          <p className="text-5xl">📝</p>
          <p className="text-sm font-medium text-ink-500">No transcription yet</p>
          <p className="text-xs text-ink-400">Run OCR to generate a transcription, or this image has no OCR results.</p>
        </div>
      )}

      {/* Footer info */}
      {transcription && (
        <div className="px-4 py-2 bg-parchment-50 border-t border-parchment-200 flex items-center justify-between text-xs text-ink-400 shrink-0">
          <span>{text.split(/\s+/).filter(Boolean).length} words · {text.length} chars</span>
          <span>Modified {formatDate(transcription.updated_at)}</span>
        </div>
      )}
    </div>
  );
}

function FindReplace({ onReplace, onClose }: { onReplace: (f: string, r: string) => void; onClose: () => void }) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-parchment-100 border-b border-parchment-300 shrink-0">
      <input
        type="text"
        placeholder="Find…"
        value={find}
        onChange={(e) => setFind(e.target.value)}
        className="px-2 py-1 border border-parchment-300 rounded text-xs bg-white text-ink-800 w-36"
        autoFocus
      />
      <input
        type="text"
        placeholder="Replace with…"
        value={replace}
        onChange={(e) => setReplace(e.target.value)}
        className="px-2 py-1 border border-parchment-300 rounded text-xs bg-white text-ink-800 w-36"
      />
      <button
        onClick={() => find && onReplace(find, replace)}
        className="px-2 py-1 bg-ink-700 text-parchment-100 rounded text-xs"
      >
        Replace all
      </button>
      <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-sm ml-auto">✕</button>
    </div>
  );
}
