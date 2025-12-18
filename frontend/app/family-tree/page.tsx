'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import TreeCanvas, { TreeCanvasRef } from './TreeCanvas';
import NodeDetailModal from './NodeDetailModal';
import SearchBar from './SearchBar';
import ExportButtons from './ExportButtons';
import TreeControlPanel from './TreeControlPanel';
import { FamilyTreeData, PositionedNode, ViewModeOptions } from './types';
import { parseFamilyData } from './parser';

export default function FamilyTreePage() {
  const [data, setData] = useState<FamilyTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);
  const [showHint, setShowHint] = useState(true);

  // UX Deluxe: View mode state
  const [viewMode, setViewMode] = useState<ViewModeOptions>({
    showAllGenerations: true,
    focusLineageMode: false,
    showGenerationLabels: true,
  });

  const treeCanvasRef = useRef<TreeCanvasRef>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/data/familyTree.json');
        if (!res.ok) throw new Error('Failed to load family tree data');
        const json = await res.json();
        
        // Transform the data format
        const treeData = parseFamilyData(json);
        setData(treeData);
      } catch (err: any) {
        console.error('Data loading error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Hide hint after 5 seconds
    const timer = setTimeout(() => setShowHint(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleNodeSelect = useCallback((node: PositionedNode | null) => {
    setSelectedNode(node);
    // Reset focus lineage mode when deselecting
    if (!node) {
      setViewMode(prev => ({ ...prev, focusLineageMode: false }));
    }
  }, []);

  const closeModal = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSearchSelect = useCallback((nodeId: string) => {
    treeCanvasRef.current?.focusOnNode(nodeId);
  }, []);

  const handleExportPNG = useCallback(() => {
    treeCanvasRef.current?.exportPNG();
  }, []);

  const handleExportPDF = useCallback(() => {
    treeCanvasRef.current?.exportPDF();
  }, []);

  const handleViewModeChange = useCallback((changes: Partial<ViewModeOptions>) => {
    setViewMode(prev => ({ ...prev, ...changes }));
  }, []);

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Failed to Load</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col bg-slate-50 h-dvh"
    >
      {/* Header - Compact on mobile */}
      <header className="bg-white border-b border-gray-200 px-3 py-2 md:px-4 md:py-3 shadow-sm z-20 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
          {/* Title Section */}
          <div className="flex items-center justify-between md:flex-shrink-0">
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
                {data?.meta.familyName || 'Family'} Tree
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {data?.nodes.length || 0} members • v{data?.meta.version || 1}
              </p>
            </div>
            <a
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium md:hidden flex-shrink-0 ml-2"
            >
              ← Home
            </a>
          </div>

          {/* Search Bar */}
          <div className="flex-1 md:max-w-md md:mx-4">
            {data && (
              <SearchBar
                nodes={data.nodes}
                onSelect={handleSearchSelect}
              />
            )}
          </div>

          {/* Home Link (Desktop) */}
          <a
            href="/"
            className="hidden md:block text-sm text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0"
          >
            ← Home
          </a>
        </div>
      </header>

      {/* Canvas Container - Takes remaining height */}
      <main className="flex-1 relative overflow-hidden min-h-0">
        <TreeCanvas
          ref={treeCanvasRef}
          data={data}
          onNodeSelect={handleNodeSelect}
          viewMode={viewMode}
        />

        {/* Instruction Hint Overlay */}
        {showHint && (
          <div
            className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium shadow-lg pointer-events-none animate-pulse z-10"
            role="status"
          >
            <span className="hidden sm:inline">Drag to move • Pinch to zoom • Tap to view details</span>
            <span className="sm:hidden">Pinch to zoom • Tap for details</span>
          </div>
        )}

        {/* Tree Control Panel (top-right) */}
        <TreeControlPanel
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          hasSelection={selectedNode !== null}
        />

        {/* Export Buttons */}
        <ExportButtons
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
        />
      </main>

      {/* Node Detail Modal */}
      {selectedNode && data && (
        <NodeDetailModal
          node={selectedNode}
          data={data}
          onClose={closeModal}
        />
      )}

      {/* Info / Disclaimer Banner */}
      <div className="absolute bottom-0 left-0 right-0 bg-amber-50/95 backdrop-blur-sm border-t border-amber-200 p-2 md:p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <p className="text-xs text-amber-900 leading-relaxed md:pr-8">
            <span className="font-semibold">System Update in Progress:</span> Information about the Bhuiyan family is being verified.
            Some features are under construction. Developer: bayzidalim@gmail.com
          </p>
          <a 
            href="mailto:bayzidalim@gmail.com"
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Developer
          </a>
        </div>
      </div>
    </div>
  );
}
