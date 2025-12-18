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
                    <div key={activity.id} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all duration-500">
                        <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                                activity.data.gender === 'female' ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {activity.data.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest">
                                        Tree Updated
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {activity.data.full_name} added to Tree
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    Historical Record • Born {activity.data.birth_year || 'Unknown'}
                                </p>
                                <time className="text-xs text-gray-400 font-medium mt-2 block">{timestamp}</time>
                            </div>
                        </div>
                    </div>
                );

            case 'platform_member':
                return (
                    <Link href={`/profile/${activity.data.member_id}`} key={activity.id}>
                        <div className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-200/20 transition-all duration-500 cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-500 flex items-center justify-center text-2xl font-black shadow-lg">
                                    {activity.data.full_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest">
                                            New Social Member
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
                                        {activity.data.full_name} joined
                                    </h3>
                                    <p className="text-sm text-gray-500 font-medium capitalize">
                                        Role: {activity.data.role}
                                    </p>
                                    <time className="text-xs text-gray-400 font-medium mt-2 block">{timestamp}</time>
                                </div>
                            </div>
                        </div>
                    </Link>
                );

            case 'post':
                return (
                    <Link href={`/profile/${activity.data.member_id}`} key={activity.id}>
                        <div className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-200/20 transition-all duration-500 cursor-pointer">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-500 flex items-center justify-center text-2xl shadow-lg">
                                    📝
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-block px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest">
                                            Platform Post
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">
                                        {activity.data.member_name}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                        {activity.data.content || 'Shared media'}
                                    </p>
                                    {activity.data.media_count > 0 && (
                                        <span className="text-xs text-gray-400 font-medium">
                                            📸 {activity.data.media_count} {activity.data.media_count === 1 ? 'photo' : 'photos'}
                                        </span>
                                    )}
                                    <time className="text-xs text-gray-400 font-medium mt-2 block">{timestamp}</time>
                                </div>
                            </div>
                        </div>
                    </Link>
                );

            case 'media':
                return (
                    <div key={activity.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-200/20 transition-all duration-500">
                        <div className="relative h-56 bg-gray-100">
                            <Image 
                                src={activity.data.secure_url} 
                                alt={activity.data.caption || 'Photo'} 
                                fill 
                                className="object-cover"
                            />
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-black uppercase tracking-widest">
                                    Media Upload
                                </span>
                            </div>
                            {activity.data.caption && (
                                <p className="text-gray-700 font-medium mb-2">{activity.data.caption}</p>
                            )}
                            {activity.data.album_title && (
                                <p className="text-sm text-gray-500">
                                    Album: <span className="font-bold">{activity.data.album_title}</span>
                                </p>
                            )}
                            <time className="text-xs text-gray-400 font-medium mt-2 block">{timestamp}</time>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Family Activity</h1>
                            <p className="text-gray-500 font-medium text-sm">A living history of our family</p>
                        </div>
                        <Link 
                            href="/" 
                            className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
                        >
                            ← Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-6 h-32 border border-gray-100 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 w-32 bg-gray-100 rounded"></div>
                                        <div className="h-6 w-48 bg-gray-50 rounded"></div>
                                        <div className="h-3 w-20 bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                            📰
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Activity Yet</h2>
                        <p className="text-gray-500 font-medium">Check back soon for family updates!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activities.map(renderActivity)}

                        {hasMore && (
                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={() => loadActivities()}
                                    disabled={loadingMore}
                                    className="px-10 py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-xs"
                                >
                                    {loadingMore ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span>Loading...</span>
                                        </>
                                    ) : (
                                        <span>Load More Activity</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
