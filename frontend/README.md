# We Bhuiyans Frontend

Next.js 16 frontend for the We Bhuiyans family archive platform.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Architecture Overview

This frontend serves two distinct purposes:

### 1. Public Family Tree (Read-Only)
- **Route**: `/family-tree`
- **Data Source**: `/public/family-tree.json` (static)
- **Rendering**: Pure HTML5 Canvas
- **No backend dependency**

### 2. Admin Dashboard (Authenticated)
- **Route**: `/admin/*`
- **Data Source**: Backend API at `http://localhost:4000/api`
- **Auth**: Supabase OAuth (Google)

---

## Tree UX Deluxe Features

The family tree visualization includes advanced UX features for improved usability.

### 1. Generation Collapse / Expand

**Purpose**: Reduce visual complexity by focusing on immediate family.

**How it works**:
- Toggle "Show All Generations" in the top-right control panel
- When OFF: Only shows selected person, parents, children, and spouse(s)
- Hidden branches are preserved (not destroyed)
- Reversible without re-layout

**Implementation**:
- `visible` flag on `PositionedNode` controls rendering
- Nodes with `visible: false` are skipped in draw loop
- Edges involving hidden nodes are skipped

### 2. Focus Lineage Mode

**Purpose**: Highlight direct ancestors and descendants of a selected person.

**How it works**:
- Toggle "Focus Lineage" in the control panel (requires selection)
- Direct lineage (ancestors + descendants): Full opacity + amber border
- All other nodes: 15% opacity (faded but visible)
- Does NOT modify the data structure

**Implementation**:
- `getAncestors()` and `getDescendants()` traverse relationship maps
- `opacity` and `isDirectLineage` flags on each node
- Canvas `globalAlpha` applies opacity during rendering

### 3. Auto-Center on Select (Enhanced)

**Purpose**: Smoothly focus the viewport on a selected node.

**Features**:
- Cubic ease-out animation (600ms)
- Zooms to 1.2x for optimal visibility
- Amber pulse highlight on arrival
- **Interruptible**: User pan/zoom cancels animation

**Implementation**:
- `focusOnNode()` uses `requestAnimationFrame` loop
- `isAnimating` ref tracks animation state
- User input cancels via `cancelAnimationFrame()`

### 4. Visual Refinements

**Generation Labels**:
- Left margin displays "Gen 1", "Gen 2", etc.
- Toggle visibility via control panel

**Edge Routing Improvements**:
- **Spouse connectors**: Dotted horizontal lines
- **Parent-child connectors**: Solid lines with offset routing
- **Reduce visual overlap** for complex trees

**Performance**:
- Targets <16ms frame render
- No re-layout on viewport changes
- Efficient visibility filtering

---

## Media Gallery

A responsive, optimized media gallery for family photos.

### Public Routes
- `/media` - Main gallery, list of albums and recent photos
- `/media/albums/[id]` - Album details

### Features
- **Responsive Grid**: Adapts to mobile/desktop screens
- **Cloudinary Optimization**:
  - `f_auto` / `q_auto` used via `cloudinaryLoader.ts`
  - Responsive source sets via `next/image`
  - Lazy loading for performance (LCP optimized)
- **Lightbox**:
  - Full-screen photo viewer
  - Keyboard navigation (Arrow keys, Esc)
  - Touch-friendly
  - Captions overlay

### Admin Management
- `/admin/media` - Manage albums and photos
- `/admin/media/upload` - Upload new photos
- **Features**:
  - **Inline Album Creation**: Create albums during upload
  - **Drag & Drop**: Easy file selection
  - **Progress Indicator**: Real-time upload feedback
  - **Clean Metadata**: Auto-sanitized filenames

---

## Family Tree Features

### Node Interaction (Click/Tap)

When a user clicks or taps a node on the canvas:
- **Desktop**: Centered modal with full details
- **Mobile**: Bottom sheet with swipe-to-dismiss

**Modal displays:**
- Full name with gender badge (blue/pink)
- Birth year and death year (if available)
- Living/Deceased status
- Generation level
- Relationships: Spouse, Children, Parents

### Search & Focus

A search bar at the top of the page allows users to find family members:
- **Autocomplete**: Case-insensitive name matching
- **Keyboard navigation**: Arrow keys + Enter + Escape
- **Auto-pan & zoom**: When a name is selected, the canvas smoothly:
  1. Pans to center the node
  2. Zooms to 1.2x for visibility
  3. Shows a brief amber pulse highlight

### Export (PNG & PDF)

Floating action button (bottom-right) provides export options:

**PNG Export:**
- Exports entire tree (not just viewport)
- 2x resolution for high quality
- White background
- Filename: `we-bhuiyans-family-tree.png`

**PDF Export:**
- A4 landscape format
- Title: "We Bhuiyans Family Tree"
- Footer: "Generated on [date]"
- Centered and scaled to fit

---

## Publishing Workflow

The admin can publish tree updates from the dashboard.

### How to Publish

1. Navigate to `/admin` (Admin Dashboard)
2. Click "Publish Family Tree" button
3. Confirm in the dialog
4. Wait for success toast

### What Happens on Publish

1. Backend fetches all members and marriages from database
2. Converts to JSON with deterministic ordering
3. Validates against schema
4. Increments `meta.version`
5. Creates versioned snapshot (`family-tree-v{N}.json`)
6. Overwrites main `family-tree.json`

### Publish Response

On success:
```json
{
  "success": true,
  "message": "Family tree published successfully",
  "data": {
    "version": 3,
    "exportedAt": "2025-12-16T12:00:00Z",
    "nodeCount": 45,
    "edgeCount": 67
  }
}
```

---

## Versioned Tree Snapshots

Every publish creates a backup for historical reference.

### Files

| File | Purpose |
|------|---------|
| `family-tree.json` | Current/latest version |
| `family-tree-v1.json` | Version 1 snapshot |
| `family-tree-v2.json` | Version 2 snapshot |
| ... | ... |

### Rollback

To restore a previous version:
1. Copy `family-tree-v{N}.json` to `family-tree.json`
2. Update `meta.exportedAt` to current timestamp
3. Push to Git or redeploy

---

## Why the Family Tree is Static

The public family tree intentionally loads from a **static JSON file** rather than fetching from the backend API.

### Benefits:
1. **Speed**: No network latency for visitors
2. **Reliability**: Works even if backend is down
3. **Offline Support**: Can be cached by service workers
4. **Scalability**: No server load for read-only views
5. **Simplicity**: No auth complexity for public access

### Trade-off:
- Tree updates require re-publishing and redeploying
- This is acceptable since family tree changes are infrequent

---

## Canvas Rendering Strategy

The family tree uses **pure HTML5 Canvas** instead of DOM or SVG.

### Why Canvas?
| Approach | Nodes Supported | Performance | Flexibility |
|----------|-----------------|-------------|-------------|
| DOM/React | ~100 | Slow | High |
| SVG | ~500 | Medium | High |
| **Canvas** | **5000+** | **Fast** | Medium |

### Implementation:
- **Layout Engine**: Computes node positions based on generations
- **Renderer**: Draws nodes, edges, and text each frame
- **Interaction Controller**: Handles pan, zoom, tap, hover

### Performance Considerations:
- Uses `requestAnimationFrame` for smooth animations
- High-DPI support via `devicePixelRatio`
- Efficient hit-testing for node selection
- No re-layout on viewport changes (only redraws)

### Key Files:
| File | Purpose |
|------|---------|
| `types.ts` | Types, design constants, view mode options |
| `useTreeRenderer.ts` | Layout, rendering, visibility, and export logic |
| `TreeCanvas.tsx` | Canvas wrapper with ref forwarding |
| `TreeControlPanel.tsx` | View mode toggle controls |
| `NodeDetailModal.tsx` | Accessible modal with relationships |
| `SearchBar.tsx` | Autocomplete with keyboard navigation |
| `ExportButtons.tsx` | FAB for PNG/PDF export |
| `page.tsx` | Main page orchestrating all components |

---

## User Guide

### Navigating the Tree

**Desktop:**
- **Pan**: Click and drag anywhere on the canvas
- **Zoom**: Use mouse scroll wheel
- **Select node**: Click on a person's card
- **Reset**: Click "Reset View" button (bottom-right)

**Mobile:**
- **Pan**: Touch and drag
- **Zoom**: Pinch gesture
- **Select node**: Tap on a person's card
- **Close modal**: Swipe down or tap backdrop

### Using the Control Panel

Located in the top-right corner:

| Toggle | Effect |
|--------|--------|
| Show All Generations | ON: Full tree visible / OFF: Only immediate family |
| Focus Lineage | ON: Highlight ancestors+descendants / OFF: Normal view |
| Generation Labels | ON: Show "Gen 1", etc. / OFF: Hide labels |

### Searching for a Family Member

1. Click/tap the search bar at the top
2. Start typing a name (case-insensitive)
3. Use arrow keys to navigate suggestions
4. Press Enter or tap to select
5. The canvas will animate to focus on that person

### Exporting the Tree

1. Tap the download button (bottom-right corner, above Reset View)
2. Choose **Export PNG** for a high-resolution image
3. Choose **Export PDF** for a printable document
4. File downloads automatically

---

## How to Update the Family Tree

### Option A: Via Admin Dashboard
1. Add/edit members in Admin UI
2. Click "Publish Family Tree" on Dashboard
3. Changes go live immediately

### Option B: Manual Edit
1. Open `/public/family-tree.json`
2. Add/modify nodes and edges
3. Push to Git → Vercel auto-deploys

### JSON Schema:
```json
{
  "meta": {
    "familyName": "Bhuiyans",
    "exportedAt": "2025-12-16T11:00:00Z",
    "version": 1
  },
  "nodes": [
    { "id": "uuid", "name": "Full Name", "gender": "male", "birthYear": 1950 }
  ],
  "edges": [
    { "from": "parent-id", "to": "child-id", "type": "parent" },
    { "from": "husband-id", "to": "wife-id", "type": "spouse" }
  ]
}
```

---

## Project Structure

```
app/
├── admin/                  # Admin dashboard (authenticated)
│   ├── layout.tsx          # Admin layout with sidebar
│   ├── page.tsx            # Dashboard with Publish button
│   ├── members/            # Member management
│   │   ├── page.tsx        # Members list
│   │   ├── add/            # Add member form
│   │   └── [id]/edit/      # Edit member form
│   ├── family-tree/        # Admin tree view
│   └── settings/           # Admin settings
├── family-tree/            # Public tree (canvas)
│   ├── page.tsx            # Main page with search & export
│   ├── TreeCanvas.tsx      # Canvas component with ref
│   ├── TreeControlPanel.tsx # View mode controls (UX Deluxe)
│   ├── useTreeRenderer.ts  # Rendering & visibility logic
│   ├── NodeDetailModal.tsx # Accessible modal component
│   ├── SearchBar.tsx       # Autocomplete search
│   ├── ExportButtons.tsx   # PNG/PDF export FAB
│   └── types.ts            # TypeScript types & constants
├── lib/
│   ├── api.ts              # Admin API helper
│   └── supabaseClient.ts   # Supabase client
├── login/                  # OAuth login page
└── globals.css             # Global styles & animations
```

---

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

Configure in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Design System

### Typography
- **Font**: Inter (auto-loaded via `next/font`)
- **Heading**: 600 weight
- **Body**: 400 weight

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Male BG | `#DBEAFE` | Male node background |
| Male Border | `#2563EB` | Male node border |
| Female BG | `#FCE7F3` | Female node background |
| Female Border | `#DB2777` | Female node border |
| Text | `#0f172a` | Primary text |
| Highlight | `#f59e0b` | Search focus pulse |
| Faded | `0.15 opacity` | Non-lineage nodes |

### Spacing
- Node width: 180px
- Node height: 70px
- Generation gap: 120px
- Sibling gap: 60px
- Spouse gap: 24px
- Generation label width: 100px

---

## Technical Architecture

### Component Hierarchy
```
FamilyTreePage
├── SearchBar (autocomplete)
├── TreeControlPanel (view modes)
├── TreeCanvas (forwardRef)
│   └── useTreeRenderer (hook)
│       ├── computeLayout()
│       ├── computeVisibilityStates()
│       ├── draw()
│       ├── focusOnNode()
│       ├── exportPNG()
│       └── exportPDF()
├── ExportButtons (FAB)
└── NodeDetailModal (conditional)
```

### Data Flow
1. Page fetches `/family-tree.json` on mount
2. Data passed to TreeCanvas with viewMode
3. useTreeRenderer computes layout once
4. Visibility states computed on viewMode/selection changes
5. Canvas redraws on state changes
6. User interactions update state → trigger redraws

### Animation System
- `focusOnNode`: 600ms cubic ease-out, interruptible
- `pulseHighlight`: 1500ms amber glow with sine wave
- Modal: CSS `slide-up` + `fade-in` animations

---

## Long-Term Maintenance Strategy

### For Future Maintainers

This codebase is designed to be maintainable by someone who:
- Has basic JavaScript/TypeScript knowledge
- Can run `npm` commands
- Understands Git basics

### Key Principles

1. **No hidden magic**: All logic is explicit and documented
2. **Canvas-only rendering**: No external visualization libraries
3. **Static data for public**: Reduces complexity and improves reliability
4. **Versioned snapshots**: Enable safe rollbacks
5. **Clear separation**: Admin vs Public, Backend vs Frontend

### Common Tasks

| Task | How To |
|------|--------|
| Add a member | Admin UI → Members → Add |
| Publish changes | Admin UI → Dashboard → Publish button |
| Rollback tree | Copy versioned JSON to main file |
| Update styling | Modify `DESIGN` constants in `types.ts` |
| Add new feature | Follow existing patterns in `useTreeRenderer.ts` |

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

**We Bhuiyans Frontend**  
*Built with Next.js 16, Tailwind CSS, and pure Canvas rendering.*
