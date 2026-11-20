import React, { useState, useEffect } from 'react';
import { Maximize2, X, ZoomIn } from 'lucide-react';
import { ClinicalImage } from '../../types';

interface ClinicalImageGalleryProps {
  images?: ClinicalImage[];
}

export const ClinicalImageGallery: React.FC<ClinicalImageGalleryProps> = ({ images }) => {
  const [activeImage, setActiveImage] = useState<ClinicalImage | null>(null);

  useEffect(() => {
    if (!activeImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage]);

  if (!images || images.length === 0) return null;

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Diagnostic Imaging &amp; ECG Tracings
        </span>
        <span className="text-[10px] font-mono text-slate-400">
          Click image to enlarge
        </span>
      </div>

      <div className="space-y-3">
        {images.map((img) => (
          <div
            key={img.id}
            className="rounded border border-slate-200 bg-white overflow-hidden shadow-2xs"
          >
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">{img.title}</span>
              <button
                type="button"
                onClick={() => setActiveImage(img)}
                className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Inspect full-resolution clinical image"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Enlarge</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveImage(img)}
              className="group relative block w-full bg-white text-left cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-inset"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-auto max-h-[420px] object-contain mx-auto bg-white"
                loading="lazy"
              />
              <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-slate-900/75 px-2 py-1 text-[10px] font-mono text-white opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="w-3 h-3" />
                <span>Full View</span>
              </span>
            </button>

            {img.caption && (
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40 text-[11px] text-slate-600 leading-relaxed">
                {img.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.title}
        >
          <div
            className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-lg border border-slate-300 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                  {activeImage.title}
                </h4>
                {activeImage.caption && (
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {activeImage.caption}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveImage(null)}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Close full-resolution image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 overflow-auto flex-1 flex items-center justify-center">
              <img
                src={activeImage.url}
                alt={activeImage.title}
                className="max-w-full max-h-[78vh] w-auto h-auto object-contain rounded border border-slate-200 bg-white shadow-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
