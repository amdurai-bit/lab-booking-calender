"use client";
import { useRef, useState, useEffect } from "react";
import type { LineData } from "@/types";

interface Props {
  src: string;
  lineData: LineData[];
  imageWidth?: number;
  imageHeight?: number;
  highlightedLine?: number | null;
  onLineClick?: (lineNum: number) => void;
}

export function ImageViewer({ src, lineData, imageWidth, imageHeight, highlightedLine, onLineClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [renderedSize, setRenderedSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const updateSize = () => setRenderedSize({ w: img.offsetWidth, h: img.offsetHeight });
    img.addEventListener("load", updateSize);
    updateSize();
    return () => img.removeEventListener("load", updateSize);
  }, [src]);

  const scaleX = renderedSize.w / (imageWidth || renderedSize.w || 1);
  const scaleY = renderedSize.h / (imageHeight || renderedSize.h || 1);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.2, Math.min(8, s * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - translateX, y: e.clientY - translateY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setTranslateX(e.clientX - dragStart.x);
    setTranslateY(e.clientY - dragStart.y);
  };

  const resetView = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
  };

  return (
    <div className="flex flex-col h-full bg-parchment-100">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-parchment-200 border-b border-parchment-300 text-xs shrink-0 flex-wrap">
        <button onClick={() => setScale((s) => Math.min(8, s * 1.25))} className="px-2 py-1 bg-parchment-50 border border-parchment-300 rounded hover:bg-white">+</button>
        <button onClick={() => setScale((s) => Math.max(0.2, s * 0.8))} className="px-2 py-1 bg-parchment-50 border border-parchment-300 rounded hover:bg-white">−</button>
        <span className="text-ink-500">{Math.round(scale * 100)}%</span>
        <button onClick={() => setRotation((r) => (r + 90) % 360)} className="px-2 py-1 bg-parchment-50 border border-parchment-300 rounded hover:bg-white">↻</button>
        <button onClick={resetView} className="px-2 py-1 bg-parchment-50 border border-parchment-300 rounded hover:bg-white text-ink-500">Reset</button>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-ink-400">☀</span>
          <input type="range" min={50} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-20 accent-ink-700" />
          <span className="text-ink-400">◑</span>
          <input type="range" min={50} max={200} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-20 accent-ink-700" />
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
            transition: dragging ? "none" : "transform 0.05s",
          }}
        >
          <div className="relative inline-block">
            <img
              ref={imgRef}
              src={src}
              alt="Document scan"
              draggable={false}
              style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)`, maxWidth: "100%", display: "block" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/api/placeholder/400/600"; }}
            />
            {/* OCR bounding box overlays */}
            {lineData.map((line) => {
              if (!line.bbox || renderedSize.w === 0) return null;
              const [x1, y1, x2, y2] = line.bbox;
              return (
                <div
                  key={line.line}
                  className={`ocr-highlight ${highlightedLine === line.line ? "active" : ""}`}
                  style={{
                    left: x1 * scaleX,
                    top: y1 * scaleY,
                    width: (x2 - x1) * scaleX,
                    height: (y2 - y1) * scaleY,
                  }}
                  onClick={() => onLineClick?.(line.line)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
