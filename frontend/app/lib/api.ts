import { supabase } from './supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
console.log('API_BASE', API_BASE);

/**
 * Helper to fetch data from the Admin API.
 * Automatically attaches 'Authorization: Bearer <token>' from current Supabase session.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    // If a session exists, include the token; otherwise proceed without auth (useful for internal admin routes).
    const token = session?.access_token;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            console.warn('Authentication invalid. Signing out...');
            await supabase.auth.signOut();
            // Optional: Redirect to login if client-side
            if (typeof window !== 'undefined') {
                window.location.href = '/auth';
            }
        }

        const text = await response.text();
        console.error('API ERROR:', endpoint, text);
        throw new Error(text || `API Error: ${response.status}`);
    }

    return response.json();
}

/**
 * Helper specifically for Admin API endpoints.
 * Prefixes with /admin and handles auth automatically.
 */
// Stories API helpers
export async function fetchStories() {
    return fetchPublicAPI('/stories');
}

export async function fetchStory(id: string) {
    return fetchPublicAPI(`/stories/${id}`);
}

export async function createStory(data: any) {
    return fetchAdminAPI('/stories', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateStory(id: string, data: any) {
    return fetchAdminAPI(`/stories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteStory(id: string) {
    return fetchAdminAPI(`/stories/${id}`, {
        method: 'DELETE',
    });
}

export async function uploadStoryImage(storyId: string, imageData: any) {
    return fetchAdminAPI(`/stories/${storyId}/images`, {
        method: 'POST',
        body: JSON.stringify(imageData),
    });
}

// Ensure endpoint starts with /admin
export async function fetchAdminAPI(endpoint: string, options: RequestInit = {}) {
    // Ensure endpoint starts with /admin
    const adminEndpoint = endpoint.startsWith('/admin') ? endpoint : `/admin${endpoint}`;
    return apiFetch(adminEndpoint, options);
}

/**
 * Helper for Public API endpoints.
 * No auth required.
 */
export async function fetchPublicAPI(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        },
    });

    if (!response.ok) {
        let errorMessage = `API Error: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.error) errorMessage = errorData.error;
        } catch (_) { }
        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * Unified Search API
 * Public endpoint - no auth required
 */
export async function fetchSearch(query: string) {
    if (!query.trim()) {
        return { members: [], stories: [], photos: [] };
    }
    return fetchPublicAPI(`/search?q=${encodeURIComponent(query)}`);
}

// =========================================================
// Notification API Helpers (Admin Only)
// =========================================================

export interface Notification {
    id: string;
    type: 'guest_signup' | 'story_submission' | 'media_upload';
    title: string;
    message: string;
    metadata: Record<string, any> | null;
    is_read: boolean;
    created_at: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    pagination: {
        total: number;
        unread: number;
        limit: number;
        offset: number;
    };
}

/**
 * Fetch notifications for admin
 */
export async function fetchNotifications(options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
} = {}): Promise<NotificationsResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    if (options.unreadOnly) params.set('unread_only', 'true');

    const queryString = params.toString();
    return fetchAdminAPI(`/notifications${queryString ? `?${queryString}` : ''}`);
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
    return fetchAdminAPI(`/notifications/${id}/read`, { method: 'POST' });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ success: boolean; updated: number }> {
    return fetchAdminAPI('/notifications/read-all', { method: 'POST' });
}
// Profile API helpers
export async function fetchProfile(memberId: string) {
    return apiFetch(`/profile/${memberId}`);
}

export async function updateProfile(memberId: string, data: any) {
    return fetchAdminAPI(`/profile/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// Post API helpers
export async function fetchMemberPosts(memberId: string, params: any = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return apiFetch(`/profile/${memberId}/posts${suffix}`);
}


export async function createMemberPost(memberId: string, data: any) {
    return fetchAdminAPI(`/profile/${memberId}/posts`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function deleteMemberPost(postId: string) {
    return fetchAdminAPI(`/posts/${postId}`, {
        method: 'DELETE',
    });
}

export async function reactToPost(postId: string, type: 'like' | 'respect') {
    return apiFetch(`/posts/${postId}/react`, {
        method: 'POST',
        body: JSON.stringify({ type }),
    });
}

// Feed API
export async function fetchActivityFeed(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    const suffix = query ? `?${query}` : '';
    return apiFetch(`/feed${suffix}`);
}

// Comment API
export async function fetchPostComments(postId: string) {
    return apiFetch(`/posts/${postId}/comments`);
}

export async function addPostComment(postId: string, data: { author_name: string; content: string; author_platform_member_id?: string }) {
    return apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function deleteComment(commentId: string) {
    return fetchAdminAPI(`/comments/${commentId}`, {
        method: 'DELETE',
    });
}

// Platform Members API
export async function fetchPlatformMembers() {
    return fetchAdminAPI('/platform-members');
}

export async function createPlatformMember(data: any) {
    return fetchAdminAPI('/platform-members', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updatePlatformMember(id: string, data: any) {
    return fetchAdminAPI(`/platform-members/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deletePlatformMember(id: string) {
    return fetchAdminAPI(`/platform-members/${id}`, {
        method: 'DELETE',
    });
}

