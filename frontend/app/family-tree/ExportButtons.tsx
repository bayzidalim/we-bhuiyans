'use client';

import { useState } from 'react';

interface ExportButtonsProps {
    onExportPNG: () => void;
    onExportPDF: () => void;
}

export default function ExportButtons({ onExportPNG, onExportPDF }: ExportButtonsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type: 'png' | 'pdf') => {
        setIsExporting(true);
        setIsOpen(false);

        // Small delay to show loading state
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (type === 'png') {
            onExportPNG();
        } else {
            onExportPDF();
        }

        // Reset loading state after a brief moment
        setTimeout(() => setIsExporting(false), 500);
    };

    return (
        <div className="fixed bottom-24 right-4 z-40">
            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 mb-2 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[160px]">
                        {/* PNG Button */}
                        <button
                            onClick={() => handleExport('png')}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Export PNG</p>
                                <p className="text-xs text-gray-500">High-res image</p>
                            </div>
                        </button>

                        {/* Divider */}
                        <div className="border-t border-gray-100" />

                        {/* PDF Button */}
                        <button
                            onClick={() => handleExport('pdf')}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Export PDF</p>
                                <p className="text-xs text-gray-500">A4 Landscape</p>
                            </div>
                        </button>
                    </div>

                    {/* Arrow pointer */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45" />
                </div>
            )}

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
                    ${isExporting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isOpen
                            ? 'bg-gray-800 rotate-45'
                            : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
                    }`}
                aria-label={isOpen ? 'Close export menu' : 'Open export menu'}
            >
                {isExporting ? (
                    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                ) : (
                    <svg
                        className={`w-6 h-6 text-white transition-transform ${isOpen ? '' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                    </svg>
                )}
            </button>
        </div>
    );
}
