// Family Tree Types for Canvas Rendering

export interface TreeMeta {
    familyName: string;
    exportedAt: string;
    version: number;
}

export interface TreeNode {
    id: string;
    name: string;
    gender: 'male' | 'female';
    birthYear?: number;
    deathYear?: number;
    status?: 'living' | 'deceased'; // Explicit status
    photo?: string;
    // ... other metadata
}

export interface TreeEdge {
    from: string;
    to: string;
    type: 'spouse' | 'parent';
}

export interface FamilyTreeData {
    meta: TreeMeta;
    nodes: TreeNode[];
    edges: TreeEdge[];
}

// Layout types for positioned nodes
export interface PositionedNode extends TreeNode {
    x: number;
    y: number;
    width: number;
    height: number;
    generation: number;
    spouseId?: string;
    // UX Deluxe: Visibility and highlight states
    visible: boolean;           // For generation collapse
    opacity: number;            // For focus lineage (0.15 to 1.0)
    isDirectLineage: boolean;   // Ancestor or descendant of selected
    isImmediate: boolean;       // Parent, child, or spouse of selected
}

export interface LayoutResult {
    nodes: Map<string, PositionedNode>;
    bounds: { minX: number; maxX: number; minY: number; maxY: number };
    generations: number[]; // List of unique generation numbers for labels
}

// View mode options for UX Deluxe features
export interface ViewModeOptions {
    showAllGenerations: boolean;    // A1: Generation collapse toggle
    focusLineageMode: boolean;      // A2: Focus lineage mode toggle
    showGenerationLabels: boolean;  // A4: Generation labels toggle
}

// ============================================================
// RESPONSIVE DESIGN SYSTEM
// ============================================================

// Breakpoint definitions (width in pixels)
export const BREAKPOINTS = {
    MOBILE: 640,    // < 640px
    TABLET: 1024,   // 640px - 1024px
    DESKTOP: 1025,  // > 1024px
} as const;

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Get device type from width
export function getDeviceType(width: number): DeviceType {
    if (width < BREAKPOINTS.MOBILE) return 'mobile';
    if (width < BREAKPOINTS.DESKTOP) return 'tablet';
    return 'desktop';
}

// Responsive design tokens per device
export interface ResponsiveDesign {
    NODE_WIDTH: number;
    NODE_HEIGHT: number;
    NODE_RADIUS: number;
    NAME_FONT_SIZE: number;
    META_FONT_SIZE: number;
    SIBLING_GAP: number;
    GENERATION_GAP: number;
    SPOUSE_GAP: number;
    MIN_ZOOM: number;
    MAX_ZOOM: number;
    INITIAL_PADDING: number;
}

// Desktop design (base)
const DESKTOP_DESIGN: ResponsiveDesign = {
    NODE_WIDTH: 180,
    NODE_HEIGHT: 70,
    NODE_RADIUS: 14,
    NAME_FONT_SIZE: 15,
    META_FONT_SIZE: 12,
    SIBLING_GAP: 60,
    GENERATION_GAP: 140,
    SPOUSE_GAP: 24,
    MIN_ZOOM: 0.2,
    MAX_ZOOM: 3,
    INITIAL_PADDING: 60,
};

// Tablet design (slightly smaller nodes, more spacing)
const TABLET_DESIGN: ResponsiveDesign = {
    NODE_WIDTH: 160,
    NODE_HEIGHT: 65,
    NODE_RADIUS: 12,
    NAME_FONT_SIZE: 14,
    META_FONT_SIZE: 11,
    SIBLING_GAP: 50,
    GENERATION_GAP: 130,
    SPOUSE_GAP: 20,
    MIN_ZOOM: 0.15,
    MAX_ZOOM: 3,
    INITIAL_PADDING: 50,
};

// Mobile design (compact nodes, vertical-friendly)
const MOBILE_DESIGN: ResponsiveDesign = {
    NODE_WIDTH: 130,
    NODE_HEIGHT: 55,
    NODE_RADIUS: 10,
    NAME_FONT_SIZE: 12,
    META_FONT_SIZE: 10,
    SIBLING_GAP: 30,
    GENERATION_GAP: 100,
    SPOUSE_GAP: 12,
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 4,
    INITIAL_PADDING: 30,
};

// Get responsive design tokens
export function getResponsiveDesign(deviceType: DeviceType): ResponsiveDesign {
    switch (deviceType) {
        case 'mobile': return MOBILE_DESIGN;
        case 'tablet': return TABLET_DESIGN;
        default: return DESKTOP_DESIGN;
    }
}

// Visual constants (shared across devices)
export const DESIGN = {
    // Node dimensions (defaults, will be overridden by responsive)
    NODE_WIDTH: 180,
    NODE_HEIGHT: 70,
    NODE_RADIUS: 14,
    NODE_PADDING: 12,

    // Typography
    FONT_FAMILY: 'Inter, system-ui, sans-serif',
    NAME_FONT_SIZE: 15,
    NAME_FONT_WEIGHT: 600,
    META_FONT_SIZE: 12,
    META_FONT_WEIGHT: 400,
    TEXT_COLOR: '#0f172a', // slate-900

    // Male colors (accessible contrast)
    MALE_BG: '#DBEAFE',     // blue-100
    MALE_BORDER: '#2563EB', // blue-600

    // Female colors (accessible contrast)
    FEMALE_BG: '#FCE7F3',     // pink-100
    FEMALE_BORDER: '#DB2777', // pink-600

    // Connectors
    SPOUSE_LINE_COLOR: '#64748B',  // slate-500
    SPOUSE_LINE_WIDTH: 2,
    PARENT_LINE_COLOR: '#94A3B8',  // slate-400
    PARENT_LINE_WIDTH: 1.5,

    // Shadow
    SHADOW_COLOR: 'rgba(0,0,0,0.08)',
    SHADOW_OFFSET_Y: 2,
    SHADOW_BLUR: 6,

    // Interaction
    SELECTED_BORDER: '#16A34A', // green-600
    SELECTED_BORDER_WIDTH: 3,
    HOVER_SCALE: 1.02,

    // Spacing (defaults)
    SIBLING_GAP: 60,
    GENERATION_GAP: 120,
    SPOUSE_GAP: 24,

    // UX Deluxe: Focus Lineage
    FADED_OPACITY: 0.15,
    FULL_OPACITY: 1.0,
    LINEAGE_HIGHLIGHT_COLOR: '#f59e0b', // amber-500

    // UX Deluxe: Generation Labels
    GENERATION_LABEL_WIDTH: 80,
    GENERATION_LABEL_FONT_SIZE: 14,
    GENERATION_LABEL_COLOR: '#1e293b', // slate-800 for high contrast

    // Animation
    ANIMATION_DURATION: 500, // ms
    PULSE_DURATION: 1500, // ms

    // Zoom limits
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 4,

    // Fit view padding
    FIT_VIEW_PADDING: 40,
} as const;
