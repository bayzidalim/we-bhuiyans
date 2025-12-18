'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PositionedNode, FamilyTreeData, TreeEdge } from './types';


interface NodeDetailModalProps {
    node: PositionedNode;
    data: FamilyTreeData;
    onClose: () => void;
}

// Helper function to get relationship info
function getRelationships(node: PositionedNode, data: FamilyTreeData) {
    const edges = data.edges;
    const nodes = data.nodes;

    // Build lookup maps
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const spouse: string[] = [];
    const children: string[] = [];
    const parents: string[] = [];

    edges.forEach((edge: TreeEdge) => {
        if (edge.type === 'spouse') {
            if (edge.from === node.id) {
                const spouseName = nodeMap.get(edge.to)?.name;
                if (spouseName) spouse.push(spouseName);
            } else if (edge.to === node.id) {
                const spouseName = nodeMap.get(edge.from)?.name;
                if (spouseName) spouse.push(spouseName);
            }
        } else if (edge.type === 'parent') {
            // edge.from is parent, edge.to is child
            if (edge.from === node.id) {
                const childName = nodeMap.get(edge.to)?.name;
                if (childName) children.push(childName);
            } else if (edge.to === node.id) {
                const parentName = nodeMap.get(edge.from)?.name;
                if (parentName) parents.push(parentName);
            }
        }
    });

    // Remove duplicates
    return {
        spouse: [...new Set(spouse)],
        children: [...new Set(children)],
        parents: [...new Set(parents)],
    };
}

export default function NodeDetailModal({ node, data, onClose }: NodeDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const relationships = getRelationships(node, data);
    const isLiving = node.status === 'living' || (!node.deathYear && node.status !== 'deceased');

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Focus trap for accessibility
    useEffect(() => {
        const modal = modalRef.current;
        if (modal) {
            modal.focus();
        }
    }, []);

    // Swipe down gesture for mobile
    useEffect(() => {
        const modal = modalRef.current;
        if (!modal) return;

        let startY = 0;
        let currentY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            startY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            if (diff > 0) {
                modal.style.transform = `translateY(${diff}px)`;
            }
        };

        const handleTouchEnd = () => {
            const diff = currentY - startY;
            if (diff > 100) {
                onClose();
            } else {
                modal.style.transform = '';
            }
            startY = 0;
            currentY = 0;
        };

        modal.addEventListener('touchstart', handleTouchStart);
        modal.addEventListener('touchmove', handleTouchMove);
        modal.addEventListener('touchend', handleTouchEnd);

        return () => {
            modal.removeEventListener('touchstart', handleTouchStart);
            modal.removeEventListener('touchmove', handleTouchMove);
            modal.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onClose]);

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                ref={modalRef}
                className="relative bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl z-10 
                    animate-slide-up md:animate-fade-scale overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
            >
                {/* Swipe Indicator (Mobile) */}
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full 
                        bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="px-6 py-6 md:py-8">
                    {/* Gender Icon */}
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 
                            ${node.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}
                    >
                        <span className="text-3xl" role="img" aria-label={node.gender}>
                            {node.gender === 'male' ? '♂' : '♀'}
                        </span>
                    </div>

                    {/* Name */}
                    <h2
                        id="modal-title"
                        className="text-2xl font-bold text-gray-900 text-center mb-2 font-[Inter]"
                    >
                        {node.name}
                    </h2>

                    {/* Gender Badge */}
                    <div className="flex justify-center mb-4">
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                                ${node.gender === 'male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}
                        >
                            {node.gender}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-3 mb-6">
                        {/* Birth Year */}
                        {node.birthYear && (
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-500 font-medium">Birth Year</span>
                                <span className="text-sm text-gray-900">{node.birthYear}</span>
                            </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500 font-medium">Status</span>
                            <span className={`text-sm font-medium ${isLiving ? 'text-green-600' : 'text-gray-600'}`}>
                                {isLiving 
                                    ? '🌱 Living' 
                                    : node.deathYear 
                                        ? `🕊️ Deceased (${node.deathYear})`
                                        : '🕊️ Deceased'}
                            </span>
                        </div>

                        {/* Generation */}
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-500 font-medium">Generation</span>
                            <span className="text-sm text-gray-900">
                                {node.generation === 0 ? 'Founding' : `${getOrdinal(node.generation + 1)}`}
                            </span>
                        </div>
                    </div>

                    {/* Relationships Section */}
                    <div className="space-y-4">
                        {/* Parents */}
                        {relationships.parents.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Parents
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {relationships.parents.map((name, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-white rounded-lg text-sm text-gray-700 shadow-sm border border-gray-100"
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Spouse */}
                        {relationships.spouse.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Spouse
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {relationships.spouse.map((name, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-white rounded-lg text-sm text-gray-700 shadow-sm border border-gray-100"
                                        >
                                            💍 {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Children */}
                        {relationships.children.length > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Children ({relationships.children.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {relationships.children.map((name, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-white rounded-lg text-sm text-gray-700 shadow-sm border border-gray-100"
                                        >
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* No relationships message */}
                        {relationships.parents.length === 0 &&
                            relationships.spouse.length === 0 &&
                            relationships.children.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    No relationships recorded yet.
                                </p>
                            )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 pb-6 flex flex-col gap-3">
                    <Link
                        href={`/profile/${node.id}`}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
                            text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-center"
                    >
                        View Full Profile
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 
                            text-gray-700 font-semibold rounded-xl transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}

// Helper to get ordinal suffix
function getOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + ' Generation';
}
