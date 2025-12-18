'use client';

import { useState } from 'react';
import Image from 'next/image';
import cloudinaryLoader from './cloudinaryLoader';
import Lightbox from './Lightbox';

interface Photo {
  id: string;
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  caption?: string;
  album_title?: string;
  created_at: string;
  tags?: string[];
}

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const nextPhoto = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };
  
  const prevPhoto = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg">
        No photos found.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
          >
            <Image
              loader={cloudinaryLoader}
              src={photo.secure_url}
              alt={photo.caption || `Photo ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            
            {/* Caption Overlay */}
            {(photo.caption || photo.album_title) && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.caption && (
                  <p className="text-white text-sm font-medium truncate">{photo.caption}</p>
                )}
                {photo.album_title && (
                  <p className="text-white/80 text-xs truncate">{photo.album_title}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <Lightbox
          photo={photos[selectedIndex]}
          onClose={closeLightbox}
          onNext={nextPhoto}
          onPrev={prevPhoto}
          hasNext={selectedIndex < photos.length - 1}
          hasPrev={selectedIndex > 0}
        />
      )}
    </>
  );
}
