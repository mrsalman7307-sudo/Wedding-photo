# Our Nikah Memories – Private Wedding Photo & Video Sharing Website

A luxurious, privacy-first Muslim Wedding Memories platform crafted with **HTML5, CSS3, and Vanilla JavaScript (ES6+)** with a full-stack **Node.js/Express** backend architecture.

Designed with an authentic Islamic royal aesthetic featuring **Emerald Green (`#064E3B`)**, **Deep Green (`#022C22`)**, **Royal Gold (`#D4AF37`)**, **Ivory (`#FFF9ED`)**, and **Deep Teal (`#0F766E`)**, accompanied by slowly swinging golden lanterns, crescent moon motifs, mosque archways, and Islamic geometric lattice patterns.

---

## 🌟 Key Features

### 1. Public Experience & 3D Animated Folders
- **Luxury Landing Page**: Hero banner with authentic Nikah wedding portrait, slowly swinging golden lanterns, floating golden dust particles, and Bismillah calligraphy.
- **Four Dedicated Wedding Collections**:
  1. **Shaadi – Nikah Ceremony**: Auspicious Nikah contract signing, vows, and ring exchange.
  2. **Walima – Wedding Reception**: Grand ballroom banquet, royal emerald drapery, and dinner.
  3. **Ghar – Family Moments**: Intimate home gathering, bridal mehndi/henna, and traditional laughter.
  4. **Vlog – Wedding Videos**: 4K cinematic teasers, speeches, and drone recap films.

### 2. Multi-Step Guest Verification
- **Step 1: Contact Details Match**:
  - Full Name, Email, and 10-Digit Mobile Number (+91 format).
  - Normalization: strips spaces, leading `+91` / `0`, case-insensitive email matching.
  - Matches against the host's pre-approved contacts database.
  - Verifies folder-specific permissions (e.g. guest permitted only for Shaadi cannot access Ghar).
- **Step 2: Instant Selfie Security Snapshot**:
  - Accesses front-facing camera via `navigator.mediaDevices.getUserMedia()`.
  - Animated gold viewfinder with live laser scanning line.
  - Instant snapshot capture with camera shutter sound effect.
  - Fallback file upload mechanism for devices with blocked cameras.
- **Step 3: Instant Access Granted**:
  - Automated access record creation with selfie, device info, and timestamp.
  - Golden celebration badge and automatic redirect to the authorized gallery.
  - No waiting for manual admin approval.

### 3. Private Photo & Video Gallery
- Responsive Masonry Media Grid with high-definition photography and videos.
- Dynamic filtering by **All Media**, **Photos Only**, **Videos Only**.
- Real-time search by caption, tag, or moment.
- Fullscreen Lightbox viewer with keyboard arrow navigation (`←`, `→`, `ESC`).
- Single file download and **"Download All as ZIP"** packaging.

### 4. Comprehensive Admin Control Center
- **Host Authentication**: Secure admin login (`ahmadsalman9939@gmail.com`).
- **Real-Time Dashboard**:
  - Animated stat cards: Total Approved Members, Total Access Records, Total Photos, Total Videos, Storage Used.
  - Folder-level permission breakdown.
  - Live stream of recent guest access with selfie preview modal.
- **Approved Members Management**:
  - Add members with multi-folder permission checkboxes.
  - Duplicate email and phone prevention.
  - Enable / disable guest access.
  - Delete members.
- **Selfie Audit Trail**:
  - Complete log of guest names, emails, phone numbers, timestamps, and device signatures.
  - Clickable selfie preview modal to inspect guests.
  - Export audit trail as CSV.
- **Media Vault Manager**:
  - Drag-and-drop file upload with animated progress bar.
  - Assign photos or videos to specific wedding folders.
  - Delete media items.
- **Settings**:
  - Update website name, bride & groom names, wedding date.
  - Modify admin password and session timeouts.

---

## 🏗️ Production Database Schema (PostgreSQL / Supabase)

For production deployment with PostgreSQL or Supabase, execute the following SQL schema:

```sql
-- 1. Admins Table
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Folders Table
CREATE TABLE folders (
    id VARCHAR(50) PRIMARY KEY, -- 'shaadi', 'walima', 'ghar', 'vlog'
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(200),
    description TEXT,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Approved Contacts Database (Managed by Admin)
CREATE TABLE approved_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL, -- 10 digits normalized
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_phone UNIQUE (phone),
    CONSTRAINT unique_email UNIQUE (email)
);

-- 4. Folder Permissions (Many-to-Many)
CREATE TABLE folder_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES approved_contacts(id) ON DELETE CASCADE,
    folder_id VARCHAR(50) REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_contact_folder UNIQUE (contact_id, folder_id)
);

-- 5. Media Vault
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id VARCHAR(50) REFERENCES folders(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('photo', 'video')),
    title VARCHAR(200) NOT NULL,
    caption TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size VARCHAR(50),
    dimensions VARCHAR(50),
    duration VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Access Logs (Audit Trail with Selfies)
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID REFERENCES approved_contacts(id) ON DELETE SET NULL,
    guest_name VARCHAR(150) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    folder_id VARCHAR(50) REFERENCES folders(id) ON DELETE SET NULL,
    folder_name VARCHAR(150) NOT NULL,
    selfie_image_url TEXT NOT NULL,
    device_info TEXT,
    status VARCHAR(20) DEFAULT 'Granted',
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE approved_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY admin_all_approved_contacts ON approved_contacts
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_media ON media
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_logs ON access_logs
    FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Public cannot view media directly; media is fetched through verified session endpoints
```

---

## 🚀 Pre-Approved Guest Testing Credentials

You can test both valid and invalid scenarios instantly using the demo helper buttons on the landing page or on the verification screen:

| Guest Name | Email | Mobile Number | Permitted Galleries |
| :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `rahul@example.com` | `9876543210` | Shaadi, Walima |
| **Amit Khan** | `amit@example.com` | `9876543211` | Ghar, Vlog |
| **Fatima Zahra** | `fatima.zahra@example.com` | `9876543212` | All (Shaadi, Walima, Ghar, Vlog) |
| **Zeeshan Ali** | `zeeshan.ali@example.com` | `9876543213` | Shaadi, Ghar |
| **Maryam Siddiqui** | `maryam.s@example.com` | `9876543214` | Walima, Vlog |

**Administrator Credentials:**
- Email: `ahmadsalman9939@gmail.com`
- Password: `admin@123`

---

## 🛠️ Local Development & Running the App

```bash
# 1. Install dependencies
npm install

# 2. Run the Express development server (Port 3000)
npm run dev

# 3. Build for production
npm run build
```

---

## 🕌 Aesthetics & Anti-Slop Discipline

- **Typography**: Google Fonts `Cinzel` (Royal Display Serif) paired with `Plus Jakarta Sans` (Refined Body).
- **Islamic Geometry**: Subtle SVG 8-pointed star & khatam lattice background with `< 6%` opacity.
- **Physical Motifs**: Golden swinging lanterns with warm candle flicker; Moorish mosque pointed arches.
- **Strict Anti-Slop Compliance**: Zero purple gradients, no fake terminal code comments, zero pill capsules for metadata, WCAG AA legibility, and compositor-only smooth 60fps animations.
