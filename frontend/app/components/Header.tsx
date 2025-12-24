'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import UnifiedSearch from './UnifiedSearch';

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Derive display name
  // profile.name is from new API contract
  const displayName = profile?.display_name || profile?.name || profile?.full_name || user?.user_metadata?.full_name || 'Member';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            <Link href="/" className="text-xl font-serif font-bold text-gray-900 tracking-tight">We Bhuiyans</Link>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:block w-72">
                <UnifiedSearch />
              </div>

              {/* Auth Section */}
              {loading ? (
                // Loading Placeholder
                <div className="w-20 h-10 bg-gray-100/50 animate-pulse rounded-full"></div>
              ) : user ? (
                // Logged In State
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                     {avatarUrl ? (
                         <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full border border-gray-200" />
                     ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                     )}
                     <span className="text-sm font-medium text-gray-700 hidden sm:block truncate max-w-[100px]">{displayName}</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 border border-gray-100 ring-1 ring-black ring-opacity-5 animate-scale-in origin-top-right overflow-hidden">
                        {/* Identity Block */}
                        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/30">
                            <p className="text-base font-bold text-gray-900 truncate tracking-tight">{displayName}</p>
                            <p className="text-sm text-gray-500 truncate mb-1">{user.email}</p>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {(profile?.role === 'admin' || profile?.is_admin) ? 'Family archivist' : 'Family member'}
                            </span>
                        </div>
                        
                        <div className="py-2">
                            {/* Primary Actions */}
                            <Link 
                                href={profile?.id ? `/profile/${profile.id}` : '#'} 
                                className={`block px-5 py-3 transition-colors group ${!profile?.id ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">My Profile</div>
                                <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                                    {(profile?.role === 'admin' || profile?.is_admin) ? 'Your personal information' : 'Your personal information and activity'}
                                </div>
                            </Link>

                            <Link 
                                href={profile?.id ? `/profile/${profile.id}` : '#'} 
                                className={`block px-5 py-3 transition-colors group ${!profile?.id ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50'}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">My Contributions</div>
                                <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">Stories and memories you’ve shared</div>
                            </Link>

                            {/* Admin Section */}
                            {(profile?.role === 'admin' || profile?.is_admin) && (
                                <>
                                    <div className="my-2 border-t border-gray-100 mx-5"></div>
                                    <div className="bg-gray-50/50 -mx-0 px-0 py-1">
                                        <div className="px-5 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            Admin
                                        </div>
                                        <Link 
                                            href="/admin" 
                                            className="block px-5 py-3 hover:bg-white hover:shadow-sm transition-all group"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">Manage Family Archive</div>
                                            <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">Members, stories, media, and moderation</div>
                                        </Link>
                                        <Link 
                                            href="/admin" 
                                            className="block px-5 py-3 hover:bg-white hover:shadow-sm transition-all group"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-900">Notifications</div>
                                            <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">Pending reviews and updates</div>
                                        </Link>
                                    </div>
                                </>
                            )}

                            <div className="my-1 border-t border-gray-100 mx-5"></div>
                            
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    signOut();
                                }}
                                className="block w-full text-left px-5 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                  )}

                  {/* Close menu when clicking outside (simple overlay) */}
                  {menuOpen && (
                      <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)}></div>
                  )}
                </div>
              ) : (
                // Logged Out State
                <Link
                    href="/auth"
                    className="px-6 py-3 text-sm font-medium text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-all duration-300"
                >
                    Sign In
                </Link>
              )}
            </div>
        </div>
    </nav>
  );
}
