import Link from 'next/link';
import Image from 'next/image';
import cloudinaryLoader from './components/cloudinaryLoader';
import PhotoGrid from './components/PhotoGrid';

async function getAlbums() {
  const res = await fetch('http://localhost:4000/api/media/albums', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

async function getRecentPhotos() {
  const res = await fetch('http://localhost:4000/api/media/photos?limit=12', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch photos');
  return res.json();
}

export default async function MediaGalleryPage() {
  const [albums, photos] = await Promise.all([
    getAlbums().catch(() => []),
    getRecentPhotos().catch(() => [])
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Placeholder */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">We Bhuiyans</Link>
            <nav className="flex space-x-4">
              <Link href="/family-tree" className="text-gray-600 hover:text-gray-900">Family Tree</Link>
              <Link href="/media" className="text-indigo-600 font-medium">Gallery</Link>
            </nav>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Family Gallery</h1>
          <p className="mt-2 text-gray-600">Preserving our memories for generations</p>
        </div>

        {/* Albums Section */}
        {albums.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Photo Albums
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums.map((album: any) => (
                <Link 
                  key={album.id} 
                  href={`/media/albums/${album.id}`}
                  className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video relative bg-gray-100 overflow-hidden">
                    {album.cover_url ? (
                      <Image
                        loader={cloudinaryLoader}
                        src={album.cover_url}
                        alt={album.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {album.photo_count} photos
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {album.title}
                    </h3>
                    {album.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{album.description}</p>
                    )}
                    <p className="mt-3 text-xs text-gray-400">
                      {new Date(album.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Photos Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Recent Uploads
            </h2>
          </div>
          <PhotoGrid photos={photos} />
        </section>
      </main>
    </div>
  );
}
