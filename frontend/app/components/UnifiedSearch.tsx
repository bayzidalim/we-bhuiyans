'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSearch } from '../lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  tree_people: Array<{
    id: string;
    full_name: string;
    birth_year?: number;
    death_year?: number;
  }>;
  social_members: Array<{
    id: string;
    full_name: string;
    role: string;
  }>;
  stories: Array<{
    id: string;
    title: string;
    excerpt: string;
    language?: string;
  }>;
  photos: Array<{
    id: string;
    secure_url: string;
    caption?: string;
  }>;
}

export default function UnifiedSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const data = await fetchSearch(searchTerm);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults({ tree_people: [], social_members: [], stories: [], photos: [] });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const hasResults = results && (
    results.tree_people.length > 0 ||
    results.social_members.length > 0 ||
    results.stories.length > 0 ||
    results.photos.length > 0
  );

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search tree, members, stories..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          aria-label="Unified search"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isSearching && (
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-indigo-500 animate-spin"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {!isSearching && !hasResults && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}

          {/* Social Members */}
          {results && results.social_members.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950">
                <h3 className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">
                  Social Members
                </h3>
              </div>
              <div className="py-1">
                {results.social_members.map((member) => (
                  <Link
                    key={member.id}
                    href={`/profile/${member.id}`}
                    onClick={handleResultClick}
                    className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.full_name}
                      </span>
                      <span className="text-xs text-indigo-500 font-bold uppercase">
                        {member.role}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Family Tree People */}
          {results && results.tree_people.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Historical People (Tree)
                </h3>
              </div>
              <div className="py-1">
                {results.tree_people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/family-tree`}
                    onClick={handleResultClick}
                    className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {person.full_name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {person.birth_year}
                        {person.death_year && ` — ${person.death_year}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stories */}
          {results && results.stories.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stories
                </h3>
              </div>
              <div className="py-1">
                {results.stories.map((story) => (
                  <Link
                    key={story.id}
                    href={`/stories/${story.id}`}
                    onClick={handleResultClick}
                    className="block px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {story.title}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {story.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {results && results.photos.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Photos
                </h3>
              </div>
              <div className="py-1">
                {results.photos.map((photo) => (
                  <Link
                    key={photo.id}
                    href={`/media`}
                    onClick={handleResultClick}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <img
                      src={photo.secure_url}
                      alt={photo.caption || 'Photo'}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 line-clamp-2">
                      {photo.caption || 'Untitled photo'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
