'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAdminAPI } from '../../../lib/api';
import { supabase } from '../../../lib/supabaseClient';

interface Album {
  id: string;
  title: string;
  description?: string;
}

interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

type UploadStatus = 'idle' | 'uploading' | 'saving' | 'success' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Albums
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [showNewAlbum, setShowNewAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  
  // Upload state
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // Load albums on mount
  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      const data = await fetchAdminAPI('/albums');
      setAlbums(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load albums:', err);
    } finally {
      setLoadingAlbums(false);
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setStatus('idle');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  }, [handleFileSelect]);

  // Create new album
  const createAlbum = async () => {
    if (!newAlbumTitle.trim()) {
      setError('Album title is required');
      return;
    }

    try {
      const album = await fetchAdminAPI('/albums', {
        method: 'POST',
        body: JSON.stringify({
          title: newAlbumTitle.trim(),
          description: newAlbumDescription.trim() || null,
        }),
      });
      
      setAlbums([album as Album, ...albums]);
      setSelectedAlbumId((album as Album).id);
      setShowNewAlbum(false);
      setNewAlbumTitle('');
      setNewAlbumDescription('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress (since XHR progress events work better than fetch)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload to Cloudinary via backend
      const response = await fetch('http://localhost:4000/api/admin/uploads/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.details || 'Upload failed');
      }

      const result = await response.json();
      setProgress(100);
      setUploadResult(result.data);

      // Save metadata to database
      setStatus('saving');
      
      await fetchAdminAPI('/photos', {
        method: 'POST',
        body: JSON.stringify({
          album_id: selectedAlbumId || null,
          public_id: result.data.public_id,
          secure_url: result.data.secure_url,
          width: result.data.width,
          height: result.data.height,
          format: result.data.format,
          caption: caption.trim() || null,
        }),
      });

      setStatus('success');
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setStatus('error');
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setStatus('idle');
    setProgress(0);
    setError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/media"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Photo</h1>
      </div>

      {/* Success State */}
      {status === 'success' && uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800">Upload Successful!</h3>
          <p className="text-sm text-green-600 mt-1">
            {uploadResult.width}×{uploadResult.height} • {uploadResult.format.toUpperCase()}
          </p>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Upload Another
            </button>
            <Link
              href="/admin/media"
              className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              View Library
            </Link>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {status !== 'success' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* File Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer transition-colors ${
              preview 
                ? 'bg-gray-900' 
                : 'bg-gray-50 hover:bg-gray-100 border-b border-gray-200'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {preview ? (
              <div className="relative aspect-video flex items-center justify-center">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-80 max-w-full object-contain"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {selectedFile && (
                  <div className="absolute bottom-3 left-3 bg-black/50 text-white text-sm px-3 py-1.5 rounded-lg">
                    {selectedFile.name} • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-700">
                  Click or drag to upload
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  JPEG, PNG, GIF, WebP up to 5MB
                </p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-5">
            {/* Caption */}
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-1.5">
                Caption (optional)
              </label>
              <input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Album Selector */}
            <div>
              <label htmlFor="album" className="block text-sm font-medium text-gray-700 mb-1.5">
                Album (optional)
              </label>
              <div className="flex gap-2">
                <select
                  id="album"
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  disabled={loadingAlbums}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">No album</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewAlbum(!showNewAlbum)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Create new album"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* New Album Form */}
            {showNewAlbum && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                <h4 className="font-medium text-gray-900">Create New Album</h4>
                <input
                  type="text"
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  placeholder="Album title *"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={newAlbumDescription}
                  onChange={(e) => setNewAlbumDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={createAlbum}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Create Album
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAlbum(false);
                      setNewAlbumTitle('');
                      setNewAlbumDescription('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Progress Bar */}
            {(status === 'uploading' || status === 'saving') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {status === 'uploading' ? 'Uploading to Cloudinary...' : 'Saving metadata...'}
                  </span>
                  <span className="text-indigo-600 font-medium">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || status === 'uploading' || status === 'saving'}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {status === 'uploading' || status === 'saving' ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{status === 'uploading' ? 'Uploading...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Upload Photo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Images are automatically optimized for web</li>
          <li>• Maximum file size is 5MB</li>
          <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
          <li>• Add photos to albums to keep them organized</li>
        </ul>
      </div>
    </div>
  );
}
