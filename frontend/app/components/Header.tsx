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
  const displayName = profile?.name || profile?.full_name || user?.user_metadata?.full_name || 'Member';
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
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 ring-1 ring-black ring-opacity-5 animate-scale-in origin-top-right">
                        <div className="px-4 py-2 border-b border-gray-50">
                            <p className="text-sm text-gray-900 font-medium truncate">{displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        {(profile?.role === 'admin' || profile?.is_admin) && (
                            <Link 
                                href="/admin" 
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setMenuOpen(false)}
                            >
                                Admin Dashboard
                            </Link>
                        )}
                        
                        <Link 
                            href={`/profile/${profile?.id}`} // Using platform ID
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpen(false)}
                        >
                            My Profile
                        </Link>
                        
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                signOut();
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            Sign Out
                        </button>
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
