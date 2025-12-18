'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAdminAPI, fetchNotifications, Notification } from '../lib/api';

interface PublishResult {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
  data?: {
    version: number;
    exportedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
}

interface MemberStats {
  treeTotal: number;
  platformTotal: number;
  loading: boolean;
}

export default function AdminDashboard() {
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [memberStats, setMemberStats] = useState<MemberStats>({ treeTotal: 0, platformTotal: 0, loading: true });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Fetch member counts on load
  useEffect(() => {
    async function loadStats() {
      try {
        const [treePeople, platformMembers] = await Promise.all([
            fetchAdminAPI('/members'),
            fetchAdminAPI('/platform-members')
        ]);
        setMemberStats({ 
            treeTotal: Array.isArray(treePeople) ? treePeople.length : 0, 
            platformTotal: Array.isArray(platformMembers) ? platformMembers.length : 0,
            loading: false 
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setMemberStats({ treeTotal: 0, platformTotal: 0, loading: false });
      }
    }
    async function loadNotifications() {
      try {
        const data = await fetchNotifications();
        setNotifications(data.notifications ?? []);
        setNotifLoading(false);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setNotifError((err as Error).message);
        setNotifications([]);
        setNotifLoading(false);
      }
    }
    loadStats();
    loadNotifications();
  }, []);


  const handlePublish = useCallback(async () => {
    setShowConfirmDialog(false);
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const result = await fetchAdminAPI('/publish-tree', {
        method: 'POST',
      });
      setPublishResult(result as PublishResult);
    } catch (err: any) {
      setPublishResult({
        success: false,
        error: 'Failed to publish family tree',
        details: err.message,
      });
    } finally {
      setIsPublishing(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h2>
        <p className="text-gray-600">
          Manage your family tree data and publish changes for public viewing.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Tree People</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {memberStats.loading ? '...' : memberStats.treeTotal}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Social Members</h3>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {memberStats.loading ? '...' : memberStats.platformTotal}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">System Status</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
        </div>
      </div>


      {/* Publish Section */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Publish Family Tree</h3>
            <p className="text-sm text-gray-500 mt-1">
              Export the current family tree data for public viewing. This will create a new version snapshot.
            </p>
          </div>
          <button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isPublishing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPublishing ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Publish Family Tree</span>
              </>
            )}
          </button>
        </div>
        {/* Notifications Section */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-700 mb-2">Admin Notifications</h4>
          {notifLoading ? (
            <p className="text-gray-500">Loading notifications...</p>
          ) : notifError ? (
            <p className="text-red-600">Error loading notifications: {notifError}</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500">No notifications available.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="p-2 bg-gray-50 rounded">
                  <strong className="block text-sm font-semibold">{n.title}</strong>
                  <span className="block text-xs text-gray-600">{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Success Toast */}
        {publishResult?.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-green-800">Family tree published successfully!</span>
            </div>
            {publishResult.data && (
              <div className="mt-2 text-sm text-green-700 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="font-medium">Version:</span> {publishResult.data.version}
                </div>
                <div>
                  <span className="font-medium">Nodes:</span> {publishResult.data.nodeCount}
                </div>
                <div>
                  <span className="font-medium">Edges:</span> {publishResult.data.edgeCount}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="font-medium">Time:</span>{' '}
                  {new Date(publishResult.data.exportedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Toast */}
        {publishResult && !publishResult.success && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-red-800">{publishResult.error}</span>
            </div>
            {publishResult.details && (
              <p className="mt-1 text-sm text-red-600">{publishResult.details}</p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Publish Family Tree</h3>
              </div>
              <p className="text-gray-600">
                This will publish the current family tree for public viewing. A new version snapshot will be created.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                The public tree at <code className="bg-gray-100 px-1 rounded">/family-tree</code> will be updated immediately.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Yes, Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
