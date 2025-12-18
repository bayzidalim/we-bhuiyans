'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchMemberPosts, reactToPost, fetchPostComments, addPostComment } from '@/app/lib/api';
import PostComments from './PostComments';



interface Post {
    id: string;
    content: string;
    media_urls: string[];
    created_at: string;
    reaction_like: number;
    reaction_respect: number;
}

interface Comment {
    id: string;
    post_id: string;
    author_name: string;
    author_member_id: string | null;
    member_full_name: string | null;
    content: string;
    created_at: string;
}


const POSTS_PER_PAGE = 5;

export default function MemberTimeline({ memberId }: { memberId: string }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        loadPosts(true);
    }, [memberId]);

    async function loadPosts(reset = false) {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const currentOffset = reset ? 0 : offset;
            const data = await fetchMemberPosts(memberId, { 
                limit: POSTS_PER_PAGE, 
                offset: currentOffset 
            });

            
            if (reset) {
                setPosts(data);
                setOffset(data.length);
            } else {
                setPosts(prev => [...prev, ...data]);
                setOffset(prev => prev + data.length);
            }

            if (data.length < POSTS_PER_PAGE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (err) {
            console.error('Failed to load posts:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }

    const handleReact = async (postId: string, type: 'like' | 'respect') => {
        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const key = `reaction_${type}` as keyof Post;
                return {
                    ...p,
                    [key]: (p[key] as number) + 1
                };
            }
            return p;
        }));

        try {
            await reactToPost(postId, type);
        } catch (err) {
            console.error('Failed to react:', err);
            // Optionally rollback here, but for anonymous likes it's less critical
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-8 h-64 border border-gray-100">
                        <div className="h-4 w-32 bg-gray-100 rounded mb-6"></div>
                        <div className="h-4 w-full bg-gray-50 rounded mb-2"></div>
                        <div className="h-4 w-3/4 bg-gray-50 rounded mb-8"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                </div>
                <h3 className="text-gray-900 font-bold mb-1">No timeline posts</h3>
                <p className="text-gray-400 text-sm font-medium">This member hasn't shared any updates yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-8">
                {posts.map(post => (
                    <article key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500">
                        <div className="p-8">
                            {/* Meta */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                <time className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                                    {new Date(post.created_at).toLocaleDateString(undefined, { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </time>
                            </div>
                            
                            {/* Content */}
                            {post.content && (
                                <div className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap mb-8 font-medium">
                                    {post.content}
                                </div>
                            )}

                            {/* Media Grid */}
                            {post.media_urls && post.media_urls.length > 0 && (
                                <div className={`grid gap-3 mb-8 ${
                                    post.media_urls.length === 1 ? 'grid-cols-1' : 
                                    post.media_urls.length === 2 ? 'grid-cols-2' : 
                                    'grid-cols-2 md:grid-cols-3'
                                }`}>
                                    {post.media_urls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group cursor-zoom-in">
                                            <Image 
                                                src={url} 
                                                alt="Post media" 
                                                fill 
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reactions */}
                            <div className="flex items-center gap-2 pt-6 border-t border-gray-50">
                                <button
                                    onClick={() => handleReact(post.id, 'like')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-all group/rxn"
                                >
                                    <span className="text-lg group-hover/rxn:scale-125 transition-transform">❤️</span>
                                    {post.reaction_like > 0 && (
                                        <span className="text-sm font-bold">{post.reaction_like}</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleReact(post.id, 'respect')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded-full transition-all group/rxn"
                                >
                                    <span className="text-lg group-hover/rxn:scale-125 transition-transform">🫡</span>
                                    {post.reaction_respect > 0 && (
                                        <span className="text-sm font-bold">{post.reaction_respect}</span>
                                    )}
                                </button>
                            </div>

                            {/* Comments Section */}
                            <PostComments postId={post.id} />
                        </div>
                    </article>
                ))}
            </div>


            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => loadPosts()}
                        disabled={loadingMore}
                        className="px-10 py-4 bg-white border border-gray-200 text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 flex items-center gap-3 uppercase tracking-widest text-xs"
                    >
                        {loadingMore ? (
                            <>
                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading More...</span>
                            </>
                        ) : (
                            <span>Load Older Updates</span>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

