# We Bhuiyans

**We Bhuiyans** is a private, long-term family archive and social platform designed to preserve the lineage, relationships, and memories of the Bhuiyan family across multiple generations.

Built to last **10+ years**, tolerate incomplete historical data, and remain maintainable by future generations.

---

## 1. System Overview

The project uses a **dual-architecture** pattern to balance security, performance, and longevity.

### Tech Stack

| Component | Technology | Hosting | Purpose |
|-----------|------------|---------|---------|
| **Frontend** | Next.js 16 (App Router) | Vercel | User interface, Admin Dashboard, Gallery |
| **Backend** | Fastify (Node.js) | Render/Railway | API, Auth Logic, Image Processing |
| **Database** | Supabase (PostgreSQL) | Supabase | Relational data (members, albums, metadata) |
| **Media** | Cloudinary | Cloudinary | Image storage, optimization, CDN |
| **Auth** | Supabase Auth | Supabase | Identity management (Google OAuth) |

### Architecture Diagram

```mermaid
graph TD
    User[Visitor] -->|Reads| Frontend[Next.js Frontend]
    Admin[Administrator] -->|Manages| Frontend
    
    Frontend -->|Public API| Backend[Fastify Backend]
    Frontend -->|Admin API| Backend
    
    Backend -->|Auth/Data| DB[(Supabase Postgres)]
    Backend -->|Uploads| Cloud[Cloudinary]
    
    subgraph "Capabilities"
        Frontend -->|Canvas| StaticTree[Static JSON Tree]
        Frontend -->|Next/Image| OptimizedMedia[Optimized Photos]
    end
```

---

## 2. Core Features

### 🌳 Family Tree (UX Deluxe)
A high-performance, canvas-based visualization of the family lineage.
- **Visuals**: Smooth pan/zoom, generation labels, gender-coded nodes.
- **Focus Mode**: Highlights direct ancestors/descendants only.
- **Privacy**: Static JSON based, no real-time DB connection for public view.
- **Robustness**: Handles missing dates, multiple spouses, and complex lineages.

### 🖼️ Media Gallery
A modern, optimized photo archive.
- **Albums**: Organize photos into collections.
- **Smart Grid**: Responsive masonry layout for all devices.
- **Lightbox**: Immersive viewer with keyboard/touch navigation.
- **Optimization**: Automatic format selection (`f_auto`), quality (`q_auto`), and responsive sizing.

---

## 3. Media Architecture

We use a **hybrid storage model**:
- **Metadata** (Captions, Tags, Width/Height, Album association) is stored in **PostgreSQL**.
- **Binary Data** (The actual images) is stored in **Cloudinary**.

### Why this approach?
1. **Performance**: Cloudinary creates optimized variants on the fly.
2. **Cost**: Offloads bandwidth and storage optimization.
3. **Control**: PostgreSQL maintains the "source of truth" and relationships.

### Upload Workflow (Step-by-Step)

1. **Admin Selects File**: Drag & drop in Admin UI (`/admin/media/upload`).
2. **Frontend Preview**: Instant local preview + validation (<5MB).
3. **Multipart Request**: File sent to Backend (`POST /api/admin/uploads/image`).
4. **Cloudinary Upload**: Backend streams file to Cloudinary.
   - Cleans filename.
   - Assigns unique `public_id`.
   - Tags as `we-bhuiyans`.
5. **Metadata Return**: Cloudinary returns URL, dimensions, format.
6. **DB Insert**: Backend saves metadata to `photos` table in Supabase.
7. **Complete**: UI updates with success message.

---

## 4. Security Model

Security is paramount for family data.

### Roles
| Role | Permissions |
|------|-------------|
| **Public** | Read-only access to Tree and Gallery. No login required. |
| **Admin** | Full CRUD access. Can edit tree, upload photos, delete content. |

### Row Level Security (RLS)
Supabase RLS policies enforce access at the database level:
- `photos`, `photo_albums`: Public `SELECT`, Admin `ALL`.
- `family_members`: Admin `ALL` (Public reads via static JSON export).

### Admin Ownership
- **Content ownership**: Admins own all uploads.
- **No user uploads**: Regular family members cannot upload directly (must submit to admin).
- **Hard Deletes**: "Delete" means permanent removal from DB and Cloudinary.

---

## 5. Development & Deployment

### Environment Variables

Create a `.env` file in `backend/`:

```env
# Database & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/db

# Media
CLOUDINARY_URL=cloudinary://key:secret@cloud_name

# Server
PORT=4000
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

### Deploying Frontend (Vercel)
1. Push code to GitHub.
2. Import repository in Vercel.
3. Set Environment Variables in Vercel Dashboard.
4. Deploy.

### Deploying Backend (Render / Railway)
1. Create new Web Service.
2. Link GitHub repo.
3. Command: `npm start`.
4. Set Environment Variables.
5. **Important**: Ensure `CLOUDINARY_URL` is set strictly on backend.

---

## 6. Future Extensibility

The system is built to evolve.

### 🤖 AI Integration
- **Face Recognition**: Cloudinary supports auto-tagging faces. Can be enabled to suggest members in photos.
- **OCR**: Scan old documents/letters and index text in Postgres.

### 🛡️ Moderation
- **Content Moderation**: Connect Cloudinary's moderation add-on if "User Uploads" are ever enabled.
- **Audit Logs**: `created_by` fields track who changed what.

---

## 7. Non-Negotiable Rules

These rules preserve the integrity of the archive:

1.  **Simplicity over Magic**: Don't auto-infer relationships. If data is missing, let it be missing.
2.  **Admin is Authority**: The codebase does not decide what is "correct". The Admin does.
3.  **Static Stability**: The public tree must work even if the backend is down (via `family-tree.json`).
4.  **No Vendor Lock-in**: Images have metadata in Postgres. Tree has JSON export. We can migrate if needed.

---

**We Bhuiyans**  
*Preserving history, one commit at a time.*
# we-bhuiyans
