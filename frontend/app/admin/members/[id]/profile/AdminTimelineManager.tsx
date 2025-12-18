'use client';

import { useState, useEffect } from 'react';
import { fetchMemberPosts, createMemberPost, deleteMemberPost } from '@/app/lib/api';
import { supabase } from '@/app/lib/supabaseClient';
import Image from 'next/image';

export default function AdminTimelineManager({ memberId }: { memberId: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [memberId]);

    async function loadPosts() {
        try {
            const data = await fetchMemberPosts(memberId);
            setPosts(data);
        } catch (err) {
            console.error('Failed to load posts:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleUpload = async (file: File) => {
        try {
            setSaving(true);
            const { data: { session } } = await supabase.auth.getSession();
            const formData = new FormData();
            formData.append('file', file);
            
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${API_BASE}/admin/uploads/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
                body: formData,
            });

            const result = await response.json();
            setMediaUrls(prev => [...prev, result.data.secure_url]);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content && mediaUrls.length === 0) return;
        
        setSaving(true);
        try {
            await createMemberPost(memberId, { content, media_urls: mediaUrls });
            setContent('');
            setMediaUrls([]);
            loadPosts();
        } catch (err) {
            console.error('Failed to create post:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await deleteMemberPost(postId);
            loadPosts();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-400 font-medium">Loading timeline...</div>;

    return (
        <div className="space-y-12">
            {/* Create Post Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 space-y-6">
                <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Add Timeline Post</h3>
                    <textarea
                        className="w-full h-32 px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none text-gray-700 font-medium leading-relaxed"
                        placeholder="What's new with this family member?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>
                
                {/* Media Preview */}
                {mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {mediaUrls.map((url, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-gray-100">
                                <Image src={url} alt="Preview" fill className="object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-2xl cursor-pointer text-sm font-bold text-gray-700 transition-all">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Add Media</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            multiple 
                            onChange={e => {
                                const files = Array.from(e.target.files || []);
                                files.forEach(handleUpload);
                                e.target.value = ''; // Reset for same file re-upload
                            }} 
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={saving || (!content && mediaUrls.length === 0)}
                        className="w-full sm:w-auto px-10 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-600/20 transition-all uppercase tracking-widest text-xs"
                    >
                        {saving ? 'Processing...' : 'Post to Timeline'}
                    </button>
                </div>
            </form>

            {/* Post List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Timeline Feed</h3>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{posts.length} Posts</span>
                </div>
                
                {posts.length === 0 ? (
                    <div className="p-16 text-center text-gray-400 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 italic font-medium">
                        No history available.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
                                <div className="flex-1">
                                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                                        {new Date(post.created_at).toLocaleString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                    {post.content && <p className="text-gray-700 mb-4 font-medium leading-relaxed">{post.content}</p>}
                                    {post.media_urls?.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {post.media_urls.map((url: string, idx: number) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-50">
                                                    <Image src={url} alt="Media" fill className="object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Post"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
