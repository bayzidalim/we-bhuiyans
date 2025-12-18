'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchProfile } from '@/app/lib/api';
import MemberTimeline from './MemberTimeline';


interface MemberProfile {
    id: string;
    full_name: string;
    role: string;
    claimed_tree_person_id: string | null;
    tree_person_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    visibility: 'public' | 'family';
}

export default function ProfilePage() {
    const { memberId } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!memberId) return;

        async function loadProfile() {
            try {
                setLoading(true);
                const data = await fetchProfile(memberId as string);
                setProfile(data);
            } catch (err: any) {
                console.error('Failed to load profile:', err);
                if (err.message.includes('403')) {
                    setError('family_only');
                } else if (err.message.includes('404')) {
                    setError('not_found');
                } else {
                    setError('fetch_error');
                }
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [memberId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-indigo-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (error === 'family_only') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Family Only Access</h1>
                    <p className="text-gray-600 mb-8">This profile is private and can only be viewed by family members. Please log in to continue.</p>
                    <Link href="/auth" className="block w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                        Log In to View
                    </Link>
                    <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-medium hover:underline">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (error === 'not_found' || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Member Not Found</h1>
                    <p className="text-gray-600 mb-8">The platform member profile you are looking for doesn't exist.</p>
                    <button onClick={() => router.back()} className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition-colors">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Cover */}
            <div className="relative h-[250px] md:h-[400px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden shadow-inner">
                {profile.cover_url ? (
                    <Image 
                        src={profile.cover_url} 
                        alt="Cover" 
                        fill 
                        className="object-cover opacity-90 transition-opacity duration-700" 
                        priority
                    />
                ) : (
                    <div className="absolute inset-0 bg-opacity-20 bg-pattern flex items-center justify-center opacity-30">
                        <div className="text-white text-9xl font-bold select-none opacity-20">WE BHUIYANS</div>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Back Button */}
                <button 
                    onClick={() => router.back()}
                    className="absolute top-6 left-6 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/30"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
            </div>

            {/* Profile Info Container */}
            <div className="max-w-4xl mx-auto px-4 md:px-0 -mt-20 md:-mt-24 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-8 pt-0">
                        {/* Avatar Wrapper */}
                        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
                            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-3xl overflow-hidden border-4 border-white shadow-2xl -mt-16 md:-mt-24 group">
                                {profile.avatar_url ? (
                                    <Image 
                                        src={profile.avatar_url} 
                                        alt={profile.full_name} 
                                        fill 
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl md:text-7xl bg-indigo-50 text-indigo-200">
                                        👤
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 pb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1 font-[Inter]">
                                    {profile.full_name}
                                </h1>
                                <p className="text-lg text-indigo-500 font-bold uppercase tracking-widest text-sm">
                                    {profile.role} Member
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-gray-100">
                            {/* Bio / About */}
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">About</h3>
                                    <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap font-[Inter]">
                                        {profile.bio || (
                                            <p className="italic text-gray-400">No biography provided for this member yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline Section */}
                                <div className="pt-10 border-t border-gray-100">
                                    <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-8">Timeline</h3>
                                    <MemberTimeline memberId={memberId as string} />
                                </div>
                            </div>

                            {/* Sidebar Info */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Platform Info</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-lg">
                                                🛡️
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Role</p>
                                                <p className="text-sm font-semibold text-gray-700 capitalize">{profile.role}</p>
                                            </div>
                                        </li>
                                        {profile.tree_person_name && (
                                            <li className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-lg">
                                                    🌳
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase font-bold">Represents in Tree</p>
                                                    <p className="text-sm font-semibold text-indigo-600">{profile.tree_person_name}</p>
                                                </div>
                                            </li>
                                        )}
                                        <li className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-lg">
                                                🌍
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Visibility</p>
                                                <p className="text-sm font-semibold text-gray-700 capitalize">{profile.visibility}</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
