'use client';

import { useState } from 'react';
import { ViewModeOptions } from './types';

interface TreeControlPanelProps {
  viewMode: ViewModeOptions;
  onViewModeChange: (mode: Partial<ViewModeOptions>) => void;
  hasSelection: boolean;
}

export default function TreeControlPanel({
  viewMode,
  onViewModeChange,
  hasSelection,
}: TreeControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10 flex flex-col items-end pointer-events-none">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="pointer-events-auto bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors mb-2"
        aria-label={isExpanded ? 'Collapse controls' : 'Expand controls'}
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 space-y-3 min-w-[200px] animate-fade-in origin-top-right">
          {/* Panel Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">View Controls</span>
          </div>

          {/* Show All Generations Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none">
              Show All Generations
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={viewMode.showAllGenerations}
                onChange={(e) => onViewModeChange({ showAllGenerations: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-indigo-500 peer-focus:ring-2 peer-focus:ring-indigo-300 transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
          </label>

          {/* Focus Lineage Mode Toggle */}
          <label className={`flex items-center justify-between cursor-pointer group ${!hasSelection ? 'opacity-50' : ''}`}>
            <div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none">
                Focus Lineage
              </span>
              {!hasSelection && (
                <p className="text-[10px] text-gray-400 mt-0.5">Select a person first</p>
              )}
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={viewMode.focusLineageMode}
                onChange={(e) => onViewModeChange({ focusLineageMode: e.target.checked })}
                disabled={!hasSelection}
                className="sr-only peer"
              />
              <div className={`w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 peer-focus:ring-2 peer-focus:ring-amber-300 transition-colors ${!hasSelection ? 'cursor-not-allowed' : ''}`}></div>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
          </label>

          {/* Generation Labels Toggle */}
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none">
              Generation Labels
            </span>
            <div className="relative">
              <input
                type="checkbox"
                checked={viewMode.showGenerationLabels}
                onChange={(e) => onViewModeChange({ showGenerationLabels: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-focus:ring-2 peer-focus:ring-green-300 transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
          </label>

          {/* Legend */}
          <div className="pt-2 border-t border-gray-100 space-y-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Legend</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-600"></div>
              <span className="text-xs text-gray-500">Male</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-pink-100 border border-pink-600"></div>
              <span className="text-xs text-gray-500">Female</span>
            </div>
            {viewMode.focusLineageMode && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-100 border-2 border-amber-500"></div>
                <span className="text-xs text-gray-500">Direct Lineage</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
