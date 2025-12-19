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
    post_type?: 'update' | 'memory' | 'announcement';
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
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                </div>
                <h3 className="text-gray-900 font-serif font-medium mb-1">No updates</h3>
                <p className="text-gray-500 text-sm">This family member hasn't shared any updates yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-8">
                {posts.map(post => (
                    <article key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-8">
                            {/* Meta */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                <time className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                                    {new Date(post.created_at).toLocaleDateString(undefined, { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </time>
                                <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                    post.post_type === 'memory' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                    post.post_type === 'announcement' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    'bg-gray-50 text-gray-600 border-gray-100'
                                }`}>
                                    {post.post_type || 'Update'}
                                </span>
                            </div>
                            
                            {/* Content */}
                            {post.content && (
                                <div className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap mb-6 font-serif">
                                    {post.content}
                                </div>
                            )}

                            {/* Media Grid */}
                            {post.media_urls && post.media_urls.length > 0 && (
                                <div className={`grid gap-2 mb-6 ${
                                    post.media_urls.length === 1 ? 'grid-cols-1' : 
                                    post.media_urls.length === 2 ? 'grid-cols-2' : 
                                    'grid-cols-2 md:grid-cols-3'
                                }`}>
                                    {post.media_urls.map((url, idx) => (
                                        <div key={idx} className="relative aspect-square bg-gray-50 border border-gray-100">
                                            <Image 
                                                src={url} 
                                                alt="Post media" 
                                                fill 
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reactions Removed for Calm/Archival Tone */}

                            {/* Comments Section */}
                            <div className="pt-6 border-t border-gray-100">
                                <PostComments postId={post.id} />
                            </div>
                        </div>
                    </article>
                ))}
            </div>


            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => loadPosts()}
                        disabled={loadingMore}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingMore ? 'Loading updates...' : 'Load previous entries'}
                    </button>
                </div>
            )}
        </div>
    );
}

