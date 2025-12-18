import { notFound } from 'next/navigation';
import { fetchStory } from '../../lib/api';
import Image from 'next/image';

export default async function StoryDetail({ params }: { params: { id: string } }) {
  const story = await fetchStory(params.id).catch(() => null);
  if (!story) {
    notFound();
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">{story.title}</h1>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {new Date(story.created_at).toLocaleDateString()}
      </div>
      <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: story.content }} />
      {story.images && story.images.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {story.images.map((img: any) => (
            <div key={img.id} className="rounded overflow-hidden">
              <Image
                src={img.secure_url}
                alt={img.caption || 'Story image'}
                width={img.width}
                height={img.height}
                className="object-cover w-full h-auto"
              />
              {img.caption && <p className="text-sm text-gray-600 mt-1">{img.caption}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
