'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { TreeNode } from './types';

interface SearchBarProps {
    nodes: TreeNode[];
    onSelect: (nodeId: string) => void;
}

export default function SearchBar({ nodes, onSelect }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Filter nodes based on query
    const filteredNodes = query.trim()
        ? nodes.filter((node) =>
            node.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8) // Limit to 8 results
        : [];

    // Reset highlight when results change
    useEffect(() => {
        setHighlightedIndex(0);
    }, [filteredNodes.length]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!isOpen || filteredNodes.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev < filteredNodes.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredNodes.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredNodes[highlightedIndex]) {
                        handleSelect(filteredNodes[highlightedIndex].id);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    inputRef.current?.blur();
                    break;
            }
        },
        [isOpen, filteredNodes, highlightedIndex]
    );

    const handleSelect = (nodeId: string) => {
        onSelect(nodeId);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(e.target as Node) &&
                listRef.current &&
                !listRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current && isOpen) {
            const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement;
            if (highlightedItem) {
                highlightedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex, isOpen]);

    return (
        <div className="relative w-full max-w-md">
            {/* Search Input */}
            <div className="relative">
                {/* Search Icon */}
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search family member…"
                    className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl
                        text-gray-900 placeholder-gray-400 font-medium
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        shadow-sm hover:shadow-md transition-shadow duration-200"
                    aria-label="Search family members"
                    aria-expanded={isOpen && filteredNodes.length > 0}
                    aria-autocomplete="list"
                    aria-controls="search-results"
                    role="combobox"
                />

                {/* Clear Button */}
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            inputRef.current?.focus();
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && filteredNodes.length > 0 && (
                <ul
                    ref={listRef}
                    id="search-results"
                    role="listbox"
                    className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl
                        overflow-hidden max-h-80 overflow-y-auto animate-fade-in"
                >
                    {filteredNodes.map((node, index) => (
                        <li
                            key={node.id}
                            role="option"
                            aria-selected={index === highlightedIndex}
                            onClick={() => handleSelect(node.id)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors
                                ${index === highlightedIndex
                                    ? 'bg-indigo-50'
                                    : 'hover:bg-gray-50'
                                }`}
                        >
                            {/* Gender Icon */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                    ${node.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}
                            >
                                <span className="text-lg">
                                    {node.gender === 'male' ? '♂' : '♀'}
                                </span>
                            </div>

                            {/* Name and Meta */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {node.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {node.birthYear ? `b. ${node.birthYear}` : 'Birth year unknown'}
                                    {node.deathYear && ` • d. ${node.deathYear}`}
                                </p>
                            </div>

                            {/* Arrow indicator */}
                            <svg
                                className={`w-5 h-5 text-indigo-500 transition-opacity
                                    ${index === highlightedIndex ? 'opacity-100' : 'opacity-0'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </li>
                    ))}
                </ul>
            )}

            {/* No results message */}
            {isOpen && query.trim() && filteredNodes.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center">
                    <p className="text-gray-500 text-sm">No family member found</p>
                    <p className="text-gray-400 text-xs mt-1">Try a different name</p>
                </div>
            )}
        </div>
    );
}
