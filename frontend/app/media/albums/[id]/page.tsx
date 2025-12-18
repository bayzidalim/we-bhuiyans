import Link from 'next/link';
import { notFound } from 'next/navigation';
import PhotoGrid from '../../components/PhotoGrid';

async function getAlbum(id: string) {
  const res = await fetch(`http://localhost:4000/api/media/albums/${id}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch album');
  return res.json();
}

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const album = await getAlbum(params.id);

  if (!album) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Placeholder */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link 
                href="/media"
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Back to Gallery"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                {album.title}
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">Home</Link>
            </nav>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Album Header */}
        <div className="mb-8">
          {album.description && (
            <p className="text-gray-600 max-w-3xl mb-4 text-lg">
              {album.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{new Date(album.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
            <span>•</span>
            <span>{album.photos.length} photos</span>
          </div>
        </div>

        {/* Photos */}
        <PhotoGrid photos={album.photos} />
      </main>
    </div>
  );
}
