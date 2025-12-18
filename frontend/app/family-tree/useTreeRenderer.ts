'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import {
    FamilyTreeData,
    TreeNode,
    PositionedNode,
    LayoutResult,
    ViewModeOptions,
    DESIGN,
    getDeviceType,
    getResponsiveDesign,
    DeviceType,
    ResponsiveDesign,
} from './types';

interface UseTreeRendererOptions {
    data: FamilyTreeData | null;
    onNodeSelect?: (node: PositionedNode | null) => void;
    viewMode: ViewModeOptions;
}

interface ViewState {
    offsetX: number;
    offsetY: number;
    scale: number;
}

// Relationship maps for quick lookup
interface RelationshipMaps {
    spouseMap: Map<string, string[]>;
    childrenMap: Map<string, string[]>;
    parentsMap: Map<string, string[]>;
}

// Build relationship maps from edges
function buildRelationshipMaps(data: FamilyTreeData): RelationshipMaps {
    const spouseMap = new Map<string, string[]>();
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();

    data.edges.forEach((e) => {
        if (e.type === 'spouse') {
            if (!spouseMap.has(e.from)) spouseMap.set(e.from, []);
            if (!spouseMap.has(e.to)) spouseMap.set(e.to, []);
            spouseMap.get(e.from)!.push(e.to);
            spouseMap.get(e.to)!.push(e.from);
        } else if (e.type === 'parent') {
            if (!childrenMap.has(e.from)) childrenMap.set(e.from, []);
            childrenMap.get(e.from)!.push(e.to);
            if (!parentsMap.has(e.to)) parentsMap.set(e.to, []);
            parentsMap.get(e.to)!.push(e.from);
        }
    });

    return { spouseMap, childrenMap, parentsMap };
}

// Get all ancestors of a node
function getAncestors(nodeId: string, parentsMap: Map<string, string[]>): Set<string> {
    const ancestors = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const parents = parentsMap.get(current) || [];
        for (const parent of parents) {
            if (!ancestors.has(parent)) {
                ancestors.add(parent);
                queue.push(parent);
            }
        }
    }

    return ancestors;
}

// Get all descendants of a node
function getDescendants(nodeId: string, childrenMap: Map<string, string[]>): Set<string> {
    const descendants = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = childrenMap.get(current) || [];
        for (const child of children) {
            if (!descendants.has(child)) {
                descendants.add(child);
                queue.push(child);
            }
        }
    }

    return descendants;
}

/**
 * RESPONSIVE LAYOUT ENGINE
 * Computes positions for all nodes based on device type
 */
/**
 * RESPONSIVE LAYOUT ENGINE (SUBTREE-BASED)
 * Computes positions recursively to ensure children are grouped under parents.
 */
function computeLayout(data: FamilyTreeData, design: ResponsiveDesign): LayoutResult {
    const { nodes, edges } = data;
    const nodeMap = new Map<string, TreeNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // RELATIONSHIP MAPS
    const spouseMap = new Map<string, string[]>();
    const childrenMap = new Map<string, string[]>(); // Parent -> Children
    const parentsMap = new Map<string, string[]>();  // Child -> Parents

    edges.forEach((e) => {
        if (e.type === 'spouse') {
            if (!spouseMap.has(e.from)) spouseMap.set(e.from, []);
            if (!spouseMap.has(e.to)) spouseMap.set(e.to, []);
            spouseMap.get(e.from)!.push(e.to);
            spouseMap.get(e.to)!.push(e.from);
        } else if (e.type === 'parent') {
            if (!childrenMap.has(e.from)) childrenMap.set(e.from, []);
            childrenMap.get(e.from)!.push(e.to);
            if (!parentsMap.has(e.to)) parentsMap.set(e.to, []);
            parentsMap.get(e.to)!.push(e.from);
        }
    });

    const positioned = new Map<string, PositionedNode>();
    const placedIds = new Set<string>();

    const CONFIG = {
        NODE_WIDTH: design.NODE_WIDTH,
        NODE_HEIGHT: design.NODE_HEIGHT,
        SIBLING_GAP: design.SIBLING_GAP,
        SPOUSE_GAP: design.SPOUSE_GAP,
        GENERATION_GAP: design.GENERATION_GAP,
        GROUP_GAP: design.SIBLING_GAP * 1.5, // Gap between cousin groups
    };

    /**
     * Recursive function to calculate the subtree width and place nodes.
     * Returns the total width of the subtree anchored at `rootId`.
     */
    function layoutSubtree(rootId: string, gen: number, startX: number): number {
        if (placedIds.has(rootId)) return 0; // Already handled (e.g. as spouse)

        // 1. Identify family unit (Root + Spouses)
        const spouses = spouseMap.get(rootId) || [];
        const familyIds = [rootId, ...spouses];

        // Mark all as placed immediately to avoid cycles or re-entry
        familyIds.forEach(id => placedIds.add(id));

        let familyBlockWidth = 0;
        familyIds.forEach((id, index) => {
            familyBlockWidth += CONFIG.NODE_WIDTH;
            if (index < familyIds.length - 1) familyBlockWidth += CONFIG.SPOUSE_GAP;
        });

        // 2. Identify children (grouped by creating parent pair if needed)
        const allChildren = new Set<string>();
        familyIds.forEach(pid => {
            const kids = childrenMap.get(pid) || [];
            kids.forEach(k => allChildren.add(k));
        });
        const childrenList = Array.from(allChildren);

        // 3. Layout children recursively to determine their total width
        let childrenTotalWidth = 0;
        const childWidths: Map<string, number> = new Map();

        if (childrenList.length > 0) {
            childrenList.forEach((childId, idx) => {
                const width = measureSubtree(childId);
                childWidths.set(childId, width);
                childrenTotalWidth += width;
                if (idx < childrenList.length - 1) childrenTotalWidth += CONFIG.GROUP_GAP;
            });
        }

        // 4. Determine final width of this tree node (max of family unit or children)
        const totalWidth = Math.max(familyBlockWidth, childrenTotalWidth);

        // 5. Place the Family Unit (Centered over `startX` + `totalWidth`)
        const centerX = startX + totalWidth / 2;
        const familyStartX = centerX - familyBlockWidth / 2;

        let currentX = familyStartX;
        familyIds.forEach((id) => {
            const node = nodeMap.get(id)!;
            // Determine spouse ID (simple logic: point to the other if pair, or first if multiple)
            let spouseIdTarget = undefined;
            if (familyIds.length > 1) {
                spouseIdTarget = familyIds.find(sid => sid !== id);
            }

            positioned.set(id, {
                ...node,
                x: currentX,
                y: design.INITIAL_PADDING + gen * (CONFIG.NODE_HEIGHT + CONFIG.GENERATION_GAP),
                width: CONFIG.NODE_WIDTH,
                height: CONFIG.NODE_HEIGHT,
                generation: gen,
                spouseId: spouseIdTarget,
                visible: true,
                opacity: DESIGN.FULL_OPACITY,
                isDirectLineage: false,
                isImmediate: false,
            });
            currentX += CONFIG.NODE_WIDTH + CONFIG.SPOUSE_GAP;
        });

        // 6. Place Children (Centered below family unit)
        if (childrenList.length > 0) {
            const childrenStartX = centerX - childrenTotalWidth / 2;
            let currentChildX = childrenStartX;

            childrenList.forEach((childId) => {
                const w = childWidths.get(childId)!;
                layoutSubtree(childId, gen + 1, currentChildX);
                currentChildX += w + CONFIG.GROUP_GAP;
            });
        }

        return totalWidth;
    }

    /**
     * Helper to measure subtree width without placing nodes.
     * Prevents double-placement recursion.
     */
    function measureSubtree(rootId: string): number {
        const spouses = spouseMap.get(rootId) || [];
        const familyIds = [rootId, ...spouses];
        let familyWidth = 0;
        familyIds.forEach((_, idx) => {
            familyWidth += CONFIG.NODE_WIDTH;
            if (idx < familyIds.length - 1) familyWidth += CONFIG.SPOUSE_GAP;
        });

        const allChildren = new Set<string>();
        familyIds.forEach(pid => {
            const kids = childrenMap.get(pid) || [];
            kids.forEach(k => allChildren.add(k));
        });
        const childrenList = Array.from(allChildren);

        if (childrenList.length === 0) return familyWidth;

        let childrenWidth = 0;
        childrenList.forEach((childId, idx) => {
            childrenWidth += measureSubtree(childId);
            if (idx < childrenList.length - 1) childrenWidth += CONFIG.GROUP_GAP;
        });

        return Math.max(familyWidth, childrenWidth);
    }

    // MAIN EXECUTION: Find roots and layout
    const allRoots = nodes.filter(n => !parentsMap.has(n.id));
    const processedRoots = new Set<string>();
    const trueRoots: string[] = [];

    // Filter to get only unique valid roots (handling spouses)
    allRoots.forEach(r => {
        if (processedRoots.has(r.id)) return;
        const spouses = spouseMap.get(r.id) || [];
        const existingSpouse = spouses.find(s => processedRoots.has(s));

        if (!existingSpouse) {
            trueRoots.push(r.id);
            processedRoots.add(r.id);
            spouses.forEach(s => processedRoots.add(s));
        }
    });

    // Layout distinct trees side-by-side
    let nextTreeX = design.INITIAL_PADDING;
    trueRoots.forEach(rootId => {
        // Reset placedIds for actual layout pass (measureSubtree doesn't track placedIds globally)
        // Wait, measureSubtree is oblivious to global placement. 
        // layoutSubtree checks placedIds. 
        // Since we are iterating distinct roots, we should be safe.
        const width = layoutSubtree(rootId, 0, nextTreeX);
        nextTreeX += width + CONFIG.GENERATION_GAP;
    });

    // Determine bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let maxGen = 0;

    positioned.forEach(n => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x + n.width);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y + n.height);
        maxGen = Math.max(maxGen, n.generation);
    });

    if (positioned.size === 0) {
        minX = maxX = minY = maxY = 0;
    }

    const generations = Array.from({ length: maxGen + 1 }, (_, i) => i);

    return {
        nodes: positioned,
        bounds: { minX, maxX, minY, maxY },
        generations
    };
}

// Round rect helper
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * CALCULATE FIT VIEW
 * Computes the optimal scale and offset to fit all nodes in viewport
 */
function calculateFitView(
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    canvasWidth: number,
    canvasHeight: number,
    padding: number = DESIGN.FIT_VIEW_PADDING,
    minZoom: number = DESIGN.MIN_ZOOM,
    maxZoom: number = DESIGN.MAX_ZOOM
): ViewState {
    const treeWidth = bounds.maxX - bounds.minX;
    const treeHeight = bounds.maxY - bounds.minY;

    // Handle empty or single-node trees
    if (treeWidth <= 0 || treeHeight <= 0) {
        return {
            scale: 1,
            offsetX: canvasWidth / 2,
            offsetY: canvasHeight / 2,
        };
    }

    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;

    // Calculate scale to fit
    const scaleX = availableWidth / treeWidth;
    const scaleY = availableHeight / treeHeight;
    const scale = Math.min(Math.max(Math.min(scaleX, scaleY), minZoom), maxZoom);

    // Center the tree
    const treeCenterX = (bounds.minX + bounds.maxX) / 2;
    const treeCenterY = (bounds.minY + bounds.maxY) / 2;
    const offsetX = canvasWidth / 2 / scale - treeCenterX;
    const offsetY = canvasHeight / 2 / scale - treeCenterY;

    return { scale, offsetX, offsetY };
}

export function useTreeRenderer({ data, onNodeSelect, viewMode }: UseTreeRendererOptions) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Device type and responsive design
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
    const [responsiveDesign, setResponsiveDesign] = useState<ResponsiveDesign>(getResponsiveDesign('desktop'));

    const [viewState, setViewState] = useState<ViewState>({
        offsetX: 0,
        offsetY: 0,
        scale: 1,
    });

    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
    const [layout, setLayout] = useState<LayoutResult | null>(null);
    const [relationMaps, setRelationMaps] = useState<RelationshipMaps | null>(null);
    const [initialFitDone, setInitialFitDone] = useState(false);
    const [resizeVersion, setResizeVersion] = useState(0);

    // Pulse animation state
    const [pulsePhase, setPulsePhase] = useState(0);
    const pulseRef = useRef<number | null>(null);

    // Animation refs
    const animationRef = useRef<number | null>(null);
    const isAnimating = useRef(false);

    // Interaction state refs
    const isDragging = useRef(false);
    const lastPointer = useRef({ x: 0, y: 0 });
    const lastPinchDist = useRef<number | null>(null);
    const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
    const dragStartPointer = useRef({ x: 0, y: 0 });

    // Double-tap detection for mobile
    const lastTapTime = useRef(0);
    const lastTapPosition = useRef({ x: 0, y: 0 });

    /**
     * RESPONSIVE RESIZE HANDLER
     * Detects device type and updates layout accordingly
     */
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const handleResize = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            const dpr = window.devicePixelRatio || 1;

            if (width === 0 || height === 0) return;

            // Update canvas dimensions
            if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
                setResizeVersion(v => v + 1);
            }

            // Detect device type
            const newDeviceType = getDeviceType(width);
            setDeviceType(prev => prev !== newDeviceType ? newDeviceType : prev);

            const newDesign = getResponsiveDesign(newDeviceType);
            setResponsiveDesign(newDesign);

            // If we have data and layout hasn't been fit yet, or device changed, recalculate
            if (data && !initialFitDone) {
                const newLayout = computeLayout(data, newDesign);
                setLayout(newLayout);
                setRelationMaps(buildRelationshipMaps(data));

                // Calculate fit view
                const fitView = calculateFitView(
                    newLayout.bounds,
                    width,
                    height,
                    newDesign.INITIAL_PADDING,
                    newDesign.MIN_ZOOM,
                    newDesign.MAX_ZOOM
                );
                setViewState(fitView);
                setInitialFitDone(true);
            }
        };

        // Initial setup
        handleResize();

        // Use ResizeObserver for responsive updates
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(handleResize);
        });
        resizeObserver.observe(container);

        // Also listen for orientation changes
        window.addEventListener('orientationchange', handleResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('orientationchange', handleResize);
        };
    }, [data, initialFitDone]);

    // Recompute layout when data or device type changes
    useEffect(() => {
        if (data && initialFitDone) {
            const newLayout = computeLayout(data, responsiveDesign);
            setLayout(newLayout);
            setRelationMaps(buildRelationshipMaps(data));
        }
    }, [data, responsiveDesign, initialFitDone]);

    // Compute visibility and opacity based on view mode and selection
    const computeVisibilityStates = useCallback(() => {
        if (!layout || !relationMaps || !data) return layout;

        const { showAllGenerations, focusLineageMode } = viewMode;
        const nodes = new Map(layout.nodes);

        // Reset all nodes first
        nodes.forEach((node, id) => {
            nodes.set(id, {
                ...node,
                visible: true,
                opacity: DESIGN.FULL_OPACITY,
                isDirectLineage: false,
                isImmediate: false,
            });
        });

        // If there's a selected node and not showing all generations, apply collapse
        if (selectedNode && !showAllGenerations) {
            const parents = relationMaps.parentsMap.get(selectedNode) || [];
            const children = relationMaps.childrenMap.get(selectedNode) || [];
            const spouses = relationMaps.spouseMap.get(selectedNode);

            // Handle array or string for spouses
            const spouseArray = Array.isArray(spouses) ? spouses : (spouses ? [spouses] : []);

            const immediateIds = new Set([selectedNode, ...parents, ...children, ...spouseArray]);

            nodes.forEach((node, id) => {
                const visible = immediateIds.has(id);
                nodes.set(id, { ...node, visible, isImmediate: immediateIds.has(id) });
            });
        }

        // Focus lineage mode
        if (selectedNode && focusLineageMode) {
            const ancestors = getAncestors(selectedNode, relationMaps.parentsMap);
            const descendants = getDescendants(selectedNode, relationMaps.childrenMap);
            const lineageIds = new Set([selectedNode, ...ancestors, ...descendants]);

            nodes.forEach((node, id) => {
                const isLineage = lineageIds.has(id);
                nodes.set(id, {
                    ...node,
                    opacity: isLineage ? DESIGN.FULL_OPACITY : DESIGN.FADED_OPACITY,
                    isDirectLineage: isLineage,
                });
            });
        }

        return { ...layout, nodes };
    }, [layout, relationMaps, selectedNode, viewMode, data]);

    // Get effective layout with visibility states applied
    const getEffectiveLayout = useCallback(() => {
        return computeVisibilityStates();
    }, [computeVisibilityStates]);

    /**
     * MAIN DRAW FUNCTION
     * Renders the entire tree to canvas
     */
    const draw = useCallback((overrideViewState?: ViewState) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const effectiveLayout = getEffectiveLayout();
        if (!canvas || !ctx || !effectiveLayout || !data) return;

        const { offsetX, offsetY, scale } = overrideViewState ?? viewState;
        const dpr = window.devicePixelRatio || 1;
        const design = responsiveDesign;

        // Clear
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background gradient for premium feel
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#f8fafc'); // slate-50
        gradient.addColorStop(1, '#f1f5f9'); // slate-100
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply transforms
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX * scale, dpr * offsetY * scale);



        // Build quick lookup for edges
        const spouseEdges: { from: PositionedNode; to: PositionedNode }[] = [];
        const parentEdges: { from: PositionedNode; to: PositionedNode }[] = [];

        data.edges.forEach((e) => {
            const fromNode = effectiveLayout.nodes.get(e.from);
            const toNode = effectiveLayout.nodes.get(e.to);
            if (fromNode && toNode && fromNode.visible && toNode.visible) {
                if (e.type === 'spouse') {
                    spouseEdges.push({ from: fromNode, to: toNode });
                } else {
                    parentEdges.push({ from: fromNode, to: toNode });
                }
            }
        });

        // Draw spouse connectors with opacity
        spouseEdges.forEach(({ from, to }) => {
            const opacity = Math.min(from.opacity, to.opacity);
            ctx.strokeStyle = DESIGN.SPOUSE_LINE_COLOR;
            ctx.globalAlpha = opacity;
            ctx.lineWidth = DESIGN.SPOUSE_LINE_WIDTH / scale; // Consistent line width
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(from.x + from.width, from.y + from.height / 2);
            ctx.lineTo(to.x, to.y + to.height / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        });

        // Draw parent-child connectors with improved routing
        ctx.strokeStyle = DESIGN.PARENT_LINE_COLOR;
        ctx.lineWidth = DESIGN.PARENT_LINE_WIDTH / scale;

        // Group children by their parents for proper routing
        const childParentPairs = new Map<string, PositionedNode[]>();
        parentEdges.forEach(({ from, to }) => {
            if (!childParentPairs.has(to.id)) childParentPairs.set(to.id, []);
            childParentPairs.get(to.id)!.push(from);
        });

        childParentPairs.forEach((parents, childId) => {
            const child = effectiveLayout.nodes.get(childId);
            if (!child || !child.visible) return;

            const visibleParents = parents.filter(p => p.visible);
            if (visibleParents.length === 0) return;

            const avgOpacity = visibleParents.reduce((sum, p) => sum + p.opacity, 0) / visibleParents.length;
            ctx.globalAlpha = Math.min(avgOpacity, child.opacity);

            // Find center of parents (for couples)
            const minParentX = Math.min(...visibleParents.map((p) => p.x));
            const maxParentX = Math.max(...visibleParents.map((p) => p.x + p.width));
            const parentCenterX = (minParentX + maxParentX) / 2;
            const parentBottomY = visibleParents[0].y + visibleParents[0].height;
            const childTopY = child.y;
            const childCenterX = child.x + child.width / 2;

            // Vertical routing with offset
            const verticalOffset = Math.min(30, design.GENERATION_GAP / 4);
            const midY = parentBottomY + verticalOffset;

            ctx.beginPath();
            ctx.moveTo(parentCenterX, parentBottomY);
            ctx.lineTo(parentCenterX, midY);
            ctx.lineTo(childCenterX, midY);
            ctx.lineTo(childCenterX, childTopY);
            ctx.stroke();

            ctx.globalAlpha = 1;
        });

        // Draw nodes
        effectiveLayout.nodes.forEach((node) => {
            if (!node.visible) return;

            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const isHighlighted = highlightedNode === node.id;
            const nodeScale = isHovered || isHighlighted ? DESIGN.HOVER_SCALE : 1;

            ctx.save();
            ctx.globalAlpha = node.opacity;

            // Apply node scale around center
            if (isHovered || isHighlighted) {
                const cx = node.x + node.width / 2;
                const cy = node.y + node.height / 2;
                ctx.translate(cx, cy);
                ctx.scale(nodeScale, nodeScale);
                ctx.translate(-cx, -cy);
            }

            // Shadow
            ctx.shadowColor = isHovered || isHighlighted ? 'rgba(0,0,0,0.15)' : DESIGN.SHADOW_COLOR;
            ctx.shadowOffsetY = DESIGN.SHADOW_OFFSET_Y;
            ctx.shadowBlur = DESIGN.SHADOW_BLUR;

            // Background
            ctx.fillStyle = node.gender === 'male' ? DESIGN.MALE_BG : DESIGN.FEMALE_BG;
            roundRect(ctx, node.x, node.y, node.width, node.height, design.NODE_RADIUS);
            ctx.fill();

            // Highlight glow effect with pulse
            if (isHighlighted) {
                const glowIntensity = 0.5 + 0.5 * Math.sin(pulsePhase);
                ctx.shadowColor = `rgba(251, 191, 36, ${glowIntensity})`; // amber-400
                ctx.shadowBlur = 20 + 10 * glowIntensity;
                ctx.strokeStyle = DESIGN.LINEAGE_HIGHLIGHT_COLOR;
                ctx.lineWidth = 4;
                ctx.stroke();
            }

            // Lineage highlight border
            if (node.isDirectLineage && viewMode.focusLineageMode && !isHighlighted) {
                ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
                ctx.shadowBlur = 8;
                ctx.strokeStyle = DESIGN.LINEAGE_HIGHLIGHT_COLOR;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Border
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = isSelected
                ? DESIGN.SELECTED_BORDER
                : isHighlighted
                    ? DESIGN.LINEAGE_HIGHLIGHT_COLOR
                    : node.gender === 'male'
                        ? DESIGN.MALE_BORDER
                        : DESIGN.FEMALE_BORDER;
            ctx.lineWidth = isSelected ? DESIGN.SELECTED_BORDER_WIDTH : isHighlighted ? 3 : 2;
            ctx.stroke();

            // Text
            ctx.fillStyle = DESIGN.TEXT_COLOR;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Name - responsive font size
            const nameFontSize = design.NAME_FONT_SIZE;
            ctx.font = `${DESIGN.NAME_FONT_WEIGHT} ${nameFontSize}px ${DESIGN.FONT_FAMILY}`;
            const maxChars = Math.floor(node.width / (nameFontSize * 0.55));
            const displayName = node.name.length > maxChars ? node.name.substring(0, maxChars - 1) + '…' : node.name;
            ctx.fillText(displayName, node.x + node.width / 2, node.y + node.height / 2 - 8);

            // Years (meta)
            const metaFontSize = design.META_FONT_SIZE;
            ctx.font = `${DESIGN.META_FONT_WEIGHT} ${metaFontSize}px ${DESIGN.FONT_FAMILY}`;
            let metaText = '';
            if (node.birthYear && node.deathYear) {
                metaText = `${node.birthYear} – ${node.deathYear}`;
            } else if (node.birthYear) {
                metaText = `b. ${node.birthYear}`;
            } else if (node.deathYear) {
                metaText = `d. ${node.deathYear}`;
            }
            if (metaText) {
                ctx.fillStyle = '#64748b';
                ctx.fillText(metaText, node.x + node.width / 2, node.y + node.height / 2 + 10);
            }

            ctx.restore();
        });

        // ------------------------------------------------------------
        // Draw Sticky Generation Labels (Overlay in Screen Space)
        // ------------------------------------------------------------
        if (viewMode.showGenerationLabels && effectiveLayout.generations) {
            // Reset transform to screen space (keeping DPR scaling)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.font = `bold ${DESIGN.GENERATION_LABEL_FONT_SIZE}px ${DESIGN.FONT_FAMILY}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            effectiveLayout.generations.forEach((gen) => {
                // Calculate world Y position of the generation center
                const worldY = design.INITIAL_PADDING + gen * (design.NODE_HEIGHT + design.GENERATION_GAP) + design.NODE_HEIGHT / 2;

                // Project to screen Y
                const screenY = (worldY + offsetY) * scale;
                const canvasHeightCSS = canvas.height / dpr;

                // Only draw if visible in viewport (with buffer)
                if (screenY > -50 && screenY < canvasHeightCSS + 50) {
                    const label = `Gen ${gen + 1}`;
                    const metrics = ctx.measureText(label);
                    const paddingX = 8;
                    const paddingY = 4;
                    const bgWidth = metrics.width + paddingX * 2;
                    const bgHeight = DESIGN.GENERATION_LABEL_FONT_SIZE + paddingY * 2 + 4;
                    const x = 12; // Left margin

                    // Draw pill background
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // High contrast background
                    ctx.shadowColor = 'rgba(0,0,0,0.1)';
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetY = 2;

                    // Use helper for rounded rect
                    ctx.beginPath();
                    roundRect(ctx, x, screenY - bgHeight / 2, bgWidth, bgHeight, 6);
                    ctx.fill();

                    // Reset shadow for text
                    ctx.shadowColor = 'transparent';

                    // Draw text
                    ctx.fillStyle = DESIGN.GENERATION_LABEL_COLOR;
                    ctx.fillText(label, x + paddingX, screenY + 1); // +1 for visual centering
                }
            });
        }
    }, [viewState, getEffectiveLayout, data, hoveredNode, selectedNode, highlightedNode, pulsePhase, viewMode, deviceType, responsiveDesign]);

    // Pulse animation for highlighted node
    useEffect(() => {
        if (highlightedNode) {
            const startTime = performance.now();
            const animate = (time: number) => {
                const elapsed = time - startTime;
                const phase = (elapsed / 200) * Math.PI;
                setPulsePhase(phase);
                if (elapsed < DESIGN.PULSE_DURATION) {
                    pulseRef.current = requestAnimationFrame(animate);
                }
            };
            pulseRef.current = requestAnimationFrame(animate);
            return () => {
                if (pulseRef.current) cancelAnimationFrame(pulseRef.current);
            };
        }
    }, [highlightedNode]);

    // Re-draw on state changes
    useEffect(() => {
        draw();
    }, [draw, resizeVersion]);

    // Hit test
    const getNodeAtPoint = useCallback(
        (clientX: number, clientY: number): PositionedNode | null => {
            const canvas = canvasRef.current;
            const effectiveLayout = getEffectiveLayout();
            if (!canvas || !effectiveLayout) return null;

            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left) / viewState.scale - viewState.offsetX;
            const y = (clientY - rect.top) / viewState.scale - viewState.offsetY;

            let found: PositionedNode | null = null;
            effectiveLayout.nodes.forEach((node) => {
                if (node.visible && x >= node.x && x <= node.x + node.width && y >= node.y && y <= node.y + node.height) {
                    found = node;
                }
            });
            return found;
        },
        [getEffectiveLayout, viewState]
    );

    // Mouse/touch handlers
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Cancel ongoing animation if user starts interacting
        if (animationRef.current && isAnimating.current) {
            cancelAnimationFrame(animationRef.current);
            isAnimating.current = false;
        }
        isDragging.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        dragStartPointer.current = { x: e.clientX, y: e.clientY };

        // Double-tap detection for mobile
        const now = Date.now();
        const timeDiff = now - lastTapTime.current;
        const posDiff = Math.hypot(e.clientX - lastTapPosition.current.x, e.clientY - lastTapPosition.current.y);

        if (timeDiff < 300 && posDiff < 30) {
            // Double-tap detected
            const node = getNodeAtPoint(e.clientX, e.clientY);
            if (node) {
                focusOnNode(node.id);
            }
            lastTapTime.current = 0;
        } else {
            lastTapTime.current = now;
            lastTapPosition.current = { x: e.clientX, y: e.clientY };
        }
    }, [getNodeAtPoint]);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (isDragging.current) {
                const dx = e.clientX - lastPointer.current.x;
                const dy = e.clientY - lastPointer.current.y;
                lastPointer.current = { x: e.clientX, y: e.clientY };
                setViewState((prev) => ({
                    ...prev,
                    offsetX: prev.offsetX + dx / prev.scale,
                    offsetY: prev.offsetY + dy / prev.scale,
                }));
            } else {
                const node = getNodeAtPoint(e.clientX, e.clientY);
                setHoveredNode(node?.id || null);
            }
        },
        [getNodeAtPoint]
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (isDragging.current) {
                const dx = Math.abs(e.clientX - dragStartPointer.current.x);
                const dy = Math.abs(e.clientY - dragStartPointer.current.y);
                // If minimal movement, treat as click
                if (dx < 5 && dy < 5) {
                    const node = getNodeAtPoint(e.clientX, e.clientY);
                    setSelectedNode(node?.id || null);
                    onNodeSelect?.(node || null);
                }
            }
            isDragging.current = false;
        },
        [getNodeAtPoint, onNodeSelect]
    );

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        // Cancel animation if user zooms
        if (animationRef.current && isAnimating.current) {
            cancelAnimationFrame(animationRef.current);
            isAnimating.current = false;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;

        setViewState((prev) => {
            const newScale = Math.min(Math.max(prev.scale * scaleFactor, responsiveDesign.MIN_ZOOM), responsiveDesign.MAX_ZOOM);

            // Zoom centered on mouse position
            const mouseWorldX = mouseX / prev.scale - prev.offsetX;
            const mouseWorldY = mouseY / prev.scale - prev.offsetY;
            const newOffsetX = mouseX / newScale - mouseWorldX;
            const newOffsetY = mouseY / newScale - mouseWorldY;

            return {
                scale: newScale,
                offsetX: newOffsetX,
                offsetY: newOffsetY,
            };
        });
    }, [responsiveDesign.MIN_ZOOM, responsiveDesign.MAX_ZOOM]);

    // Touch handlers for pinch zoom
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();

            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const centerX = (touch1.clientX + touch2.clientX) / 2;
            const centerY = (touch1.clientY + touch2.clientY) / 2;

            if (lastPinchDist.current !== null && lastPinchCenter.current) {
                const scaleFactor = dist / lastPinchDist.current;

                const canvas = canvasRef.current;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const pinchX = centerX - rect.left;
                    const pinchY = centerY - rect.top;

                    setViewState((prev) => {
                        const newScale = Math.min(Math.max(prev.scale * scaleFactor, responsiveDesign.MIN_ZOOM), responsiveDesign.MAX_ZOOM);

                        // Zoom centered on pinch center
                        const pinchWorldX = pinchX / prev.scale - prev.offsetX;
                        const pinchWorldY = pinchY / prev.scale - prev.offsetY;
                        const newOffsetX = pinchX / newScale - pinchWorldX;
                        const newOffsetY = pinchY / newScale - pinchWorldY;

                        return {
                            scale: newScale,
                            offsetX: newOffsetX,
                            offsetY: newOffsetY,
                        };
                    });
                }
            }
            lastPinchDist.current = dist;
            lastPinchCenter.current = { x: centerX, y: centerY };
        }
    }, [responsiveDesign.MIN_ZOOM, responsiveDesign.MAX_ZOOM]);

    const handleTouchEnd = useCallback(() => {
        lastPinchDist.current = null;
        lastPinchCenter.current = null;
    }, []);

    /**
     * RESET VIEW - Fit all nodes in viewport
     */
    const resetView = useCallback(() => {
        if (layout && canvasRef.current && containerRef.current) {
            const container = containerRef.current;
            const fitView = calculateFitView(
                layout.bounds,
                container.clientWidth,
                container.clientHeight,
                responsiveDesign.INITIAL_PADDING,
                responsiveDesign.MIN_ZOOM,
                responsiveDesign.MAX_ZOOM
            );

            // Animate to fit view
            const startState = { ...viewState };
            const duration = DESIGN.ANIMATION_DURATION;
            const startTime = performance.now();

            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            isAnimating.current = true;

            const animate = (currentTime: number) => {
                if (!isAnimating.current) return;

                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);

                setViewState({
                    offsetX: startState.offsetX + (fitView.offsetX - startState.offsetX) * eased,
                    offsetY: startState.offsetY + (fitView.offsetY - startState.offsetY) * eased,
                    scale: startState.scale + (fitView.scale - startState.scale) * eased,
                });

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    isAnimating.current = false;
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        }
    }, [layout, viewState, responsiveDesign]);

    /**
     * FOCUS ON NODE - Smooth animate and center a specific node
     */
    const focusOnNode = useCallback((nodeId: string) => {
        const effectiveLayout = getEffectiveLayout();
        if (!effectiveLayout || !canvasRef.current || !containerRef.current) return;

        const node = effectiveLayout.nodes.get(nodeId);
        if (!node) return;

        const container = containerRef.current;
        const canvasWidth = container.clientWidth;
        const canvasHeight = container.clientHeight;

        // Target position: center the node with comfortable zoom
        const targetScale = Math.max(1, responsiveDesign.MIN_ZOOM * 5);
        const targetOffsetX = canvasWidth / 2 / targetScale - (node.x + node.width / 2);
        const targetOffsetY = canvasHeight / 2 / targetScale - (node.y + node.height / 2);

        // Animate using cubic ease-out
        const startState = { ...viewState };
        const duration = DESIGN.ANIMATION_DURATION;
        const startTime = performance.now();

        // Cancel any existing animation
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        isAnimating.current = true;

        const animate = (currentTime: number) => {
            if (!isAnimating.current) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            const newState = {
                offsetX: startState.offsetX + (targetOffsetX - startState.offsetX) * eased,
                offsetY: startState.offsetY + (targetOffsetY - startState.offsetY) * eased,
                scale: startState.scale + (targetScale - startState.scale) * eased,
            };

            setViewState(newState);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                isAnimating.current = false;
                // Animation complete - highlight the node with pulse
                setHighlightedNode(nodeId);
                setSelectedNode(nodeId);

                // Find and notify
                const selectedNodeObj = effectiveLayout.nodes.get(nodeId);
                if (selectedNodeObj) {
                    onNodeSelect?.(selectedNodeObj);
                }

                // Remove highlight after animation
                setTimeout(() => {
                    setHighlightedNode(null);
                }, DESIGN.PULSE_DURATION);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [getEffectiveLayout, viewState, responsiveDesign, onNodeSelect]);

    // Export PNG
    const exportPNG = useCallback(() => {
        const effectiveLayout = getEffectiveLayout();
        if (!effectiveLayout || !data) return;

        const padding = 50;
        const { minX, maxX, minY, maxY } = effectiveLayout.bounds;
        const width = (maxX - minX) + padding * 2;
        const height = (maxY - minY) + padding * 2;

        const scale = 2;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width * scale;
        exportCanvas.height = height * scale;

        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        ctx.setTransform(scale, 0, 0, scale, (padding - minX) * scale, (padding - minY) * scale);

        // Draw edges
        const spouseEdges: { from: PositionedNode; to: PositionedNode }[] = [];
        const parentEdges: { from: PositionedNode; to: PositionedNode }[] = [];

        data.edges.forEach((e) => {
            const fromNode = effectiveLayout.nodes.get(e.from);
            const toNode = effectiveLayout.nodes.get(e.to);
            if (fromNode && toNode && fromNode.visible && toNode.visible) {
                if (e.type === 'spouse') {
                    spouseEdges.push({ from: fromNode, to: toNode });
                } else {
                    parentEdges.push({ from: fromNode, to: toNode });
                }
            }
        });

        ctx.strokeStyle = DESIGN.SPOUSE_LINE_COLOR;
        ctx.lineWidth = DESIGN.SPOUSE_LINE_WIDTH;
        ctx.setLineDash([6, 4]);
        spouseEdges.forEach(({ from, to }) => {
            ctx.beginPath();
            ctx.moveTo(from.x + from.width, from.y + from.height / 2);
            ctx.lineTo(to.x, to.y + to.height / 2);
            ctx.stroke();
        });
        ctx.setLineDash([]);

        ctx.strokeStyle = DESIGN.PARENT_LINE_COLOR;
        ctx.lineWidth = DESIGN.PARENT_LINE_WIDTH;

        const childParentPairs = new Map<string, PositionedNode[]>();
        parentEdges.forEach(({ from, to }) => {
            if (!childParentPairs.has(to.id)) childParentPairs.set(to.id, []);
            childParentPairs.get(to.id)!.push(from);
        });

        childParentPairs.forEach((parents, childId) => {
            const child = effectiveLayout.nodes.get(childId);
            if (!child || !child.visible) return;
            const visibleParents = parents.filter(p => p.visible);
            if (visibleParents.length === 0) return;

            const minParentX = Math.min(...visibleParents.map((p) => p.x));
            const maxParentX = Math.max(...visibleParents.map((p) => p.x + p.width));
            const parentCenterX = (minParentX + maxParentX) / 2;
            const parentBottomY = visibleParents[0].y + visibleParents[0].height;
            const childTopY = child.y;
            const childCenterX = child.x + child.width / 2;
            const midY = parentBottomY + 20;

            ctx.beginPath();
            ctx.moveTo(parentCenterX, parentBottomY);
            ctx.lineTo(parentCenterX, midY);
            ctx.lineTo(childCenterX, midY);
            ctx.lineTo(childCenterX, childTopY);
            ctx.stroke();
        });

        // Draw nodes
        effectiveLayout.nodes.forEach((node) => {
            if (!node.visible) return;

            ctx.save();
            ctx.shadowColor = DESIGN.SHADOW_COLOR;
            ctx.shadowOffsetY = DESIGN.SHADOW_OFFSET_Y;
            ctx.shadowBlur = DESIGN.SHADOW_BLUR;

            ctx.fillStyle = node.gender === 'male' ? DESIGN.MALE_BG : DESIGN.FEMALE_BG;
            roundRect(ctx, node.x, node.y, node.width, node.height, responsiveDesign.NODE_RADIUS);
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = node.gender === 'male' ? DESIGN.MALE_BORDER : DESIGN.FEMALE_BORDER;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = DESIGN.TEXT_COLOR;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${DESIGN.NAME_FONT_WEIGHT} ${responsiveDesign.NAME_FONT_SIZE}px ${DESIGN.FONT_FAMILY}`;
            const displayName = node.name.length > 18 ? node.name.substring(0, 16) + '...' : node.name;
            ctx.fillText(displayName, node.x + node.width / 2, node.y + node.height / 2 - 8);

            ctx.font = `${DESIGN.META_FONT_WEIGHT} ${responsiveDesign.META_FONT_SIZE}px ${DESIGN.FONT_FAMILY}`;
            let metaText = '';
            if (node.birthYear && node.deathYear) {
                metaText = `${node.birthYear} – ${node.deathYear}`;
            } else if (node.birthYear) {
                metaText = `b. ${node.birthYear}`;
            } else if (node.deathYear) {
                metaText = `d. ${node.deathYear}`;
            }
            if (metaText) {
                ctx.fillStyle = '#64748b';
                ctx.fillText(metaText, node.x + node.width / 2, node.y + node.height / 2 + 12);
            }

            ctx.restore();
        });

        const link = document.createElement('a');
        link.download = 'we-bhuiyans-family-tree.png';
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
    }, [getEffectiveLayout, data, responsiveDesign]);

    // Export PDF (as high-quality PNG for now)
    const exportPDF = useCallback(() => {
        exportPNG(); // Reuse PNG export for now
    }, [exportPNG]);

    return {
        canvasRef,
        containerRef,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerLeave: () => {
                isDragging.current = false;
                setHoveredNode(null);
            },
            onWheel: handleWheel,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
        resetView,
        focusOnNode,
        exportPNG,
        exportPDF,
        layout: getEffectiveLayout(),
        deviceType,
        selectedNode: selectedNode ? getEffectiveLayout()?.nodes.get(selectedNode) : null,
        clearSelection: () => {
            setSelectedNode(null);
            onNodeSelect?.(null);
        },
    };
}
