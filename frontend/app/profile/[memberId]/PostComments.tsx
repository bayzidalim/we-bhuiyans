'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchPostComments, addPostComment } from '@/app/lib/api';

interface Comment {
    id: string;
    author_name: string;
    content: string;
    created_at: string;
    member_full_name: string | null;
}

export default function PostComments({ postId }: { postId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [authorName, setAuthorName] = useState('');
    const [commentText, setCommentText] = useState('');
    const [error, setError] = useState('');
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadComments();
    }, [postId]);

    async function loadComments() {
        try {
            const data = await fetchPostComments(postId);
            setComments(data);
        } catch (err) {
            console.error('Failed to load comments:', err);
        } finally {
            setLoading(false);
        }
    }

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmedName = authorName.trim();
        const trimmedComment = commentText.trim();

        if (!trimmedName || !trimmedComment) {
            setError('Name and comment are required');
            return;
        }

        if (trimmedComment.length > 500) {
            setError('Comment must be 500 characters or less');
            return;
        }

        setSubmitting(true);
        try {
            const newComment = await addPostComment(postId, {
                author_name: trimmedName,
                content: trimmedComment,
            });
            setComments(prev => [...prev, newComment]);
            setCommentText('');
            setTimeout(scrollToBottom, 100);
        } catch (err: any) {
            setError(err.message || 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pt-8 border-t border-gray-100 space-y-6">
            {/* Comments Header */}
            <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </h4>
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="space-y-3 animate-pulse">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-gray-50 rounded-2xl p-4">
                            <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-full bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : comments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="font-bold text-gray-900 text-sm">
                                    {comment.member_full_name || comment.author_name}
                                </span>
                                <time className="text-xs text-gray-400">
                                    {new Date(comment.created_at).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </time>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                            </p>
                        </div>
                    ))}
                    <div ref={commentsEndRef} />
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic text-center py-4">No comments yet. Be the first!</p>
            )}

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Your name"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none text-sm"
                    maxLength={100}
                />

                <textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="w-full h-24 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none text-sm leading-relaxed"
                    maxLength={500}
                />

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        {commentText.length}/500 characters
                    </span>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm shadow-lg shadow-indigo-600/20"
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </div>
            </form>
        </div>
    );
}
