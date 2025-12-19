'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchActivityFeed } from '@/app/lib/api';

interface ActivityItem {
    id: string;
    type: 'tree_person' | 'platform_member' | 'post' | 'media';
    created_at: string;
    data: any;
}

const ITEMS_PER_PAGE = 15;

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        loadActivities(true);
    }, []);

    async function loadActivities(reset = false) {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const currentOffset = reset ? 0 : offset;
            const data = await fetchActivityFeed({ 
                limit: ITEMS_PER_PAGE, 
                offset: currentOffset 
            });

            if (reset) {
                setActivities(data);
                setOffset(data.length);
            } else {
                setActivities(prev => [...prev, ...data]);
                setOffset(prev => prev + data.length);
            }

            if (data.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (err) {
            console.error('Failed to load activities:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const renderActivity = (activity: ActivityItem) => {
        const timestamp = new Date(activity.created_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        switch (activity.type) {
            case 'tree_person':
                return (
                    <div key={activity.id} className="bg-white p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 flex items-center justify-center text-xl font-serif text-gray-400 bg-gray-50 rounded-full border border-gray-100`}>
                                {activity.data.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between mb-1">
                                    <h3 className="text-base font-semibold text-gray-900 font-serif">
                                        {activity.data.full_name}
                                    </h3>
                                    <time className="text-xs text-gray-400 font-medium">{timestamp}</time>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Added to family tree. <span className="text-gray-500">Born {activity.data.birth_year || 'Unknown'}.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'platform_member':
                return (
                    <Link href={`/profile/${activity.data.member_id}`} key={activity.id} className="block hover:bg-gray-50/50 transition-colors">
                        <div className="bg-white p-6 border-b border-gray-100 last:border-0">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 flex items-center justify-center text-xl text-gray-400 bg-gray-50 rounded-full border border-gray-100 font-serif">
                                    {activity.data.full_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <h3 className="text-base font-semibold text-gray-900 font-serif">
                                            {activity.data.full_name}
                                        </h3>
                                        <time className="text-xs text-gray-400 font-medium">{timestamp}</time>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Joined family portal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                );

            case 'post':
                return (
                    <Link href={`/profile/${activity.data.member_id}`} key={activity.id} className="block hover:bg-gray-50/50 transition-colors">
                        <div className="bg-white p-6 border-b border-gray-100 last:border-0">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 flex items-center justify-center text-xl text-gray-500 bg-gray-50 rounded-full border border-gray-100">
                                    ✍️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-semibold text-gray-900 font-serif">
                                                {activity.data.member_name}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                                activity.data.post_type === 'memory' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                activity.data.post_type === 'announcement' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>
                                                {activity.data.post_type || 'Update'}
                                            </span>
                                        </div>
                                        <time className="text-xs text-gray-400 font-medium">{timestamp}</time>
                                    </div>
                                    <p className="text-sm text-gray-800 leading-relaxed font-serif text-opacity-90">
                                        {activity.data.content || 'Posted an update'}
                                    </p>
                                    {activity.data.media_count > 0 && (
                                        <div className="mt-2 text-xs text-gray-500 italic">
                                            Included {activity.data.media_count} {activity.data.media_count === 1 ? 'photo' : 'photos'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                );

            case 'media':
                return (
                    <div key={activity.id} className="bg-white p-6 border-b border-gray-100 last:border-0">
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 flex items-center justify-center text-xl text-gray-500 bg-gray-50 rounded-full border border-gray-100">
                                📷
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between mb-2">
                                    <h3 className="text-base font-semibold text-gray-900 font-serif">
                                        New Photo
                                    </h3>
                                    <time className="text-xs text-gray-400 font-medium">{timestamp}</time>
                                </div>
                                <div className="relative h-48 w-full sm:w-64 bg-gray-100 rounded-md overflow-hidden mb-2 border border-gray-200">
                                    <Image 
                                        src={activity.data.secure_url} 
                                        alt={activity.data.caption || 'Photo'} 
                                        fill 
                                        className="object-cover"
                                    />
                                </div>
                                {activity.data.caption && (
                                    <p className="text-sm text-gray-600 italic">"{activity.data.caption}"</p>
                                )}
                            </div>
                         </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">Family Updates</h1>
                        </div>
                        <Link 
                            href="/" 
                            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
                        >
                            ← Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-32 bg-gray-100 rounded"></div>
                                        <div className="h-4 w-full bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-sm shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-gray-400">
                            📭
                        </div>
                        <h2 className="text-xl font-serif text-gray-900 mb-2">The board is empty</h2>
                        <p className="text-gray-500">No updates have been posted yet.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
                        {activities.map(renderActivity)}

                        {hasMore && (
                            <div className="flex justify-center p-6 border-t border-gray-100 bg-gray-50/30">
                                <button
                                    onClick={() => loadActivities()}
                                    disabled={loadingMore}
                                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loadingMore ? 'Loading...' : 'Load older updates'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
