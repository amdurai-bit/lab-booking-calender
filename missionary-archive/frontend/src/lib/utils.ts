import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getImageUrl(filePath: string): string {
  if (!filePath) return "";
  const rel = filePath.replace(/\\/g, "/");
  const idx = rel.indexOf("/storage/");
  if (idx !== -1) return rel.substring(idx);
  return `/storage/${rel}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const OCR_STATUS_COLORS: Record<string, string> = {
  pending: "bg-parchment-200 text-parchment-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export const LANGUAGES = ["English", "Tamil", "Malayalam", "Mixed"];
