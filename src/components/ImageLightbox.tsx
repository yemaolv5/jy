import React from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl max-h-[85vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-lightbox-btn"
          type="button"
          onClick={onClose}
          aria-label="关闭预览"
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt="截图大图预览"
          className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl border border-white/10"
        />
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>点击背景或右上角关闭</span>
        </div>
      </div>
    </div>
  );
};
