'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  secure_url: string;
  width: number;
  height: number;
  caption?: string;
  format: string;
}

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function Lightbox({ photo, onClose, onNext, onPrev, hasNext, hasPrev }: LightboxProps) {
  // Handle keyboard events
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight' && hasNext) onNext();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev();
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Lock scroll
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/20 hover:bg-white/10 p-2 rounded-full transition-colors z-50"
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev Button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-white/10 p-2 rounded-full transition-colors z-50 hidden md:block"
          aria-label="Previous"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Main Content */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4">
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full max-w-full max-h-[85vh]">
            <Image
              src={photo.secure_url}
              alt={photo.caption || 'Photo'}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              quality={90}
            />
          </div>
        </div>

        {/* Caption */}
        {photo.caption && (
          <div className="absolute bottom-6 left-0 right-0 text-center px-4">
            <p className="text-white text-lg font-medium drop-shadow-md bg-black/40 inline-block px-4 py-2 rounded-lg">
              {photo.caption}
            </p>
          </div>
        )}
      </div>

      {/* Next Button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/20 hover:bg-white/10 p-2 rounded-full transition-colors z-50 hidden md:block"
          aria-label="Next"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
