'use client';

import { useEffect, useState } from 'react';
import { fetchStories } from '../lib/api';
import StoryCard from '../stories/StoryCard';

export default function StoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchStories();
        setStories(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading stories...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">Family Stories</h1>
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}
