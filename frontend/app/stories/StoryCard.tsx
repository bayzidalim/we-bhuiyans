// Story Card Component
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function StoryCard({ story }: { story: any }) {
  const excerpt = story.excerpt || story.content?.slice(0, 200);
  const language = story.language || 'en';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        <Link href={`/stories/${story.id}`}>{story.title}</Link>
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-3" dir={language === 'bn' ? 'rtl' : 'ltr'}>
        {excerpt}
      </p>
      <div className="text-sm text-gray-500 dark:text-gray-400">{new Date(story.created_at).toLocaleDateString()}</div>
    </div>
  );
}
