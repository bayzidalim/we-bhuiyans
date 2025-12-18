'use client';

import { useTreeRenderer } from './useTreeRenderer';
import { FamilyTreeData, PositionedNode, ViewModeOptions } from './types';
import { forwardRef, useImperativeHandle } from 'react';

interface TreeCanvasProps {
  data: FamilyTreeData | null;
  onNodeSelect?: (node: PositionedNode | null) => void;
  viewMode: ViewModeOptions;
}

export interface TreeCanvasRef {
  focusOnNode: (nodeId: string) => void;
  exportPNG: () => void;
  exportPDF: () => void;
  resetView: () => void;
}

const TreeCanvas = forwardRef<TreeCanvasRef, TreeCanvasProps>(
  function TreeCanvas({ data, onNodeSelect, viewMode }, ref) {
    const { 
      canvasRef, 
      containerRef, 
      handlers, 
      resetView, 
      focusOnNode, 
      exportPNG, 
      exportPDF,
      deviceType 
    } = useTreeRenderer({
      data,
      onNodeSelect,
      viewMode,
    });

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      focusOnNode,
      exportPNG,
      exportPDF,
      resetView,
    }), [focusOnNode, exportPNG, exportPDF, resetView]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-slate-50 overflow-hidden"
        style={{ 
          touchAction: 'none',
          // Ensure container fills parent completely
          position: 'absolute',
          inset: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-grab active:cursor-grabbing"
          {...handlers}
        />

        {/* Reset View Button - Responsive positioning */}
        <button
          onClick={resetView}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded-lg shadow-md text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          aria-label="Reset view to fit all nodes"
        >
          <span className="hidden sm:inline">Reset View</span>
          <span className="sm:hidden">Fit</span>
        </button>

        {/* Device indicator (debug - can be removed in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 px-2 py-1 bg-black/50 text-white text-xs rounded opacity-50">
            {deviceType}
          </div>
        )}
      </div>
    );
  }
);

export default TreeCanvas;
