'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiFetch, updateProfile } from '@/app/lib/api';
import { supabase } from '@/app/lib/supabaseClient';
import AdminTimelineManager from './AdminTimelineManager';


export default function MemberProfileEditor() {
    const params = useParams();
    const memberId = params.id as string;
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [member, setMember] = useState<any>(null);
    const [profile, setProfile] = useState({
        bio: '',
        avatar_url: '',
        cover_url: '',
        visibility: 'family' as 'public' | 'family',
    });

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                // Load member details and profile in parallel
                // If profile 404s, we use defaults
                const memberData = await apiFetch(`/admin/members/${memberId}`);
                setMember(memberData);

                try {
                    const profileData = await apiFetch(`/profile/${memberId}`);
                    setProfile({
                        bio: profileData.bio || '',
                        avatar_url: profileData.avatar_url || '',
                        cover_url: profileData.cover_url || '',
                        visibility: profileData.visibility || 'family',
                    });
                } catch (pErr) {
                    console.log('Profile not found, using defaults');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [memberId]);

    const handleUpload = async (file: File, type: 'avatar' | 'cover') => {
        try {
            setSaving(true);
            setError(null);
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            const formData = new FormData();
            formData.append('file', file);
            
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            
            const response = await fetch(`${API_BASE}/admin/uploads/image`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${session.access_token}` 
                },
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Upload failed');
            }
            
            const result = await response.json();
            
            setProfile(prev => ({
                ...prev,
                [type === 'avatar' ? 'avatar_url' : 'cover_url']: result.data.secure_url
            }));
            
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await updateProfile(memberId, profile);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Social Profile</h1>
                    <p className="text-gray-500 font-medium">Manage social details for <span className="text-indigo-600">{member?.full_name}</span></p>
                </div>
                <div className="flex gap-2">
                    <Link 
                        href={`/profile/${memberId}`} 
                        target="_blank"
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        <span>View Public</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                    <Link 
                        href="/admin/members" 
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
                    >
                        &larr; Members
                    </Link>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 animate-shake">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                </div>
            )}
            
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-2xl flex items-center gap-3 animate-fade-in">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Changes saved successfully!</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Visual Identity Section */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    {/* Cover Upload */}
                    <div className="relative h-56 md:h-72 bg-gray-100 group">
                        {profile.cover_url ? (
                            <Image 
                                src={profile.cover_url} 
                                alt="Cover Preview" 
                                fill 
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium">16:9 Cover Image</span>
                            </div>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
                            <div className="p-3 bg-white/20 rounded-full mb-2">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-sm">Update Cover Image</span>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(file, 'cover');
                                }} 
                            />
                        </label>
                    </div>

                    {/* Avatar Upload */}
                    <div className="px-8 pb-8 relative">
                        <div className="relative -mt-20 md:-mt-24 w-40 h-40 md:w-48 md:h-48 rounded-[2rem] border-8 border-white overflow-hidden shadow-2xl bg-white group ring-4 ring-gray-50">
                            {profile.avatar_url ? (
                                <Image 
                                    src={profile.avatar_url} 
                                    alt="Avatar Preview" 
                                    fill 
                                    className="object-cover"
                                />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center text-5xl font-black ${member?.gender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                                    {member?.full_name?.charAt(0)}
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                <svg className="w-8 h-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                </svg>
                                <span className="text-white font-bold text-xs uppercase tracking-widest">Update</span>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUpload(file, 'avatar');
                                    }} 
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Information Section */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 space-y-8">
                    {/* Bio */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Biography</label>
                            <span className="text-xs text-gray-400 font-medium">{profile.bio.length} characters</span>
                        </div>
                        <textarea
                            className="w-full h-48 px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none resize-none text-gray-700 leading-relaxed font-medium"
                            placeholder="Share their story, achievements, or a personal message..."
                            value={profile.bio}
                            onChange={e => setProfile({...profile, bio: e.target.value})}
                        />
                    </div>

                    {/* Visibility */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                        <label className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Privacy & Visibility</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'family', label: 'Family Only', icon: '🏠', desc: 'Private to family members' },
                                { id: 'public', label: 'Publicly Visible', icon: '🌍', desc: 'Visible to everyone' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setProfile({...profile, visibility: item.id as any})}
                                    className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                                        profile.visibility === item.id 
                                            ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-500/10' 
                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xl">{item.icon}</span>
                                        <span className={`font-bold ${profile.visibility === item.id ? 'text-indigo-900' : 'text-gray-900'}`}>{item.label}</span>
                                    </div>
                                    <p className={`text-xs ${profile.visibility === item.id ? 'text-indigo-600/80' : 'text-gray-500'}`}>{item.desc}</p>
                                    
                                    {profile.visibility === item.id && (
                                        <div className="absolute top-4 right-4 text-indigo-600">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-4 text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all uppercase tracking-widest text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3`}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <span>Save Social Profile</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Timeline Management Section */}
                <div className="pt-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-[2px] flex-1 bg-gray-100"></div>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">Timeline Management</h2>
                        <div className="h-[2px] flex-1 bg-gray-100"></div>
                    </div>
                    <AdminTimelineManager memberId={memberId} />
                </div>
            </form>
        </div>
    );
}
