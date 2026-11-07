/**
 * Our Nikah Memories - Express Backend Server
 * Complete with REST APIs for pre-approved guest verification, selfie security capture,
 * private gallery access, and admin dashboard operations.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsing middleware (support large base64 selfie images)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-Memory Database Models & Pre-seeded Data
export interface ApprovedMember {
  id: string;
  name: string;
  email: string;
  phone: string; // 10 digits normalized
  permissions: string[]; // ['shaadi', 'walima', 'ghar', 'vlog']
  status: 'active' | 'disabled';
  createdAt: string;
}

export interface AccessLog {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  folderId: string;
  folderName: string;
  selfieImage: string; // base64 or image url
  timestamp: string;
  deviceInfo: string;
  status: 'Granted' | 'Denied';
}

export interface MediaItem {
  id: string;
  folderId: 'shaadi' | 'walima' | 'ghar' | 'vlog';
  type: 'photo' | 'video';
  title: string;
  caption: string;
  url: string;
  thumbnail: string;
  date: string;
  fileSize: string;
  dimensions?: string;
  duration?: string;
}

// 1. Initial Folders
const FOLDERS = [
  {
    id: 'shaadi',
    title: 'Shaadi – Nikah Ceremony',
    subtitle: 'The Sacred Vows & Qubool Hai',
    description: 'The auspicious Nikah solemnization, legal signature, Quranic blessings, and exchange of rings.',
    coverImage: '/src/assets/images/folder_shaadi_nikah_1794069445495.jpg',
    driveUrl: 'https://drive.google.com/drive/folders/1Bqv-OgFD2C95ta6dIZQ1bezzojP05f_c',
    badge: 'Ceremony',
  },
  {
    id: 'walima',
    title: 'Walima – Wedding Reception',
    subtitle: 'Royal Banquet & Celebration',
    description: 'Grand evening banquet, royal stage decor in emerald and gold, family greetings, and celebrations.',
    coverImage: '/src/assets/images/folder_walima_reception_1794069446459.jpg',
    driveUrl: 'https://drive.google.com/drive/folders/1EWuMrnv-yChWEqjnYRvqGMkODioYXoNq',
    badge: 'Reception',
  },
  {
    id: 'ghar',
    title: 'Ghar – Family Moments',
    subtitle: 'Intimate Henna & Celebrations',
    description: 'Heartwarming home moments, bridal mehndi, laughter of elders, tea gatherings, and pre-wedding excitement.',
    coverImage: '/src/assets/images/folder_ghar_family_1794069447445.jpg',
    driveUrl: 'https://drive.google.com/drive/folders/1USSkmlp613tl2o5L-j7ueDnEe5Ak3Q3T',
    badge: 'Family & Haldi',
  },
  {
    id: 'vlog',
    title: 'Vlog – Wedding Videos',
    subtitle: 'Cinematic Highlights & Speeches',
    description: '4K wedding cinematography teasers, emotional speeches, bride & groom entrance, and cinematic recap.',
    coverImage: '/src/assets/images/folder_vlog_cinema_1794069447312.jpg',
    driveUrl: 'https://drive.google.com/drive/folders/1Sgs9rd39gio0DJsgLYhHbgdN-PgvelLE',
    badge: 'Cinematography',
  },
];

// 2. Pre-Approved Contacts Database
const APPROVED_MEMBERS: ApprovedMember[] = [
  {
    id: 'mem_0',
    name: 'Ahmad Salman',
    email: 'ahmadsalman9939@gmail.com',
    phone: '9939000000',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'mem_1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9876543210',
    permissions: ['shaadi', 'walima'],
    status: 'active',
    createdAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'mem_2',
    name: 'Amit Khan',
    email: 'amit@example.com',
    phone: '9876543211',
    permissions: ['ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-10-16T11:30:00Z',
  },
  {
    id: 'mem_3',
    name: 'Fatima Zahra',
    email: 'fatima.zahra@example.com',
    phone: '9876543212',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-10-17T09:15:00Z',
  },
  {
    id: 'mem_4',
    name: 'Zeeshan Ali',
    email: 'zeeshan.ali@example.com',
    phone: '9876543213',
    permissions: ['shaadi', 'ghar'],
    status: 'active',
    createdAt: '2026-10-18T14:20:00Z',
  },
  {
    id: 'mem_5',
    name: 'Maryam Siddiqui',
    email: 'maryam.s@example.com',
    phone: '9876543214',
    permissions: ['walima', 'vlog'],
    status: 'active',
    createdAt: '2026-10-19T16:45:00Z',
  },
];

// 3. Pre-seeded Gallery Media Items
const MEDIA_DATABASE: MediaItem[] = [
  // Shaadi
  {
    id: 'med_shaadi_1',
    folderId: 'shaadi',
    type: 'photo',
    title: 'The Sacred Nikahnama Signature',
    caption: 'Signing the blessed marriage contract in presence of family and witnesses.',
    url: '/src/assets/images/folder_shaadi_nikah_1794069445495.jpg',
    thumbnail: '/src/assets/images/folder_shaadi_nikah_1794069445495.jpg',
    date: '2026-11-01',
    fileSize: '4.8 MB',
    dimensions: '3840 × 2880',
  },
  {
    id: 'med_shaadi_2',
    folderId: 'shaadi',
    type: 'photo',
    title: 'Blessing of the Golden Rings',
    caption: 'Bespoke hammered gold wedding rings set on emerald velvet cushion with jasmine.',
    url: '/src/assets/images/gallery_nikah_rings_1794069503110.jpg',
    thumbnail: '/src/assets/images/gallery_nikah_rings_1794069503110.jpg',
    date: '2026-11-01',
    fileSize: '3.9 MB',
    dimensions: '3840 × 2880',
  },
  {
    id: 'med_shaadi_3',
    folderId: 'shaadi',
    type: 'photo',
    title: 'Royal Couple in Emerald & Gold',
    caption: 'Official Nikah portrait under illuminated mosque archway.',
    url: '/src/assets/images/hero_nikah_couple_1794069445348.jpg',
    thumbnail: '/src/assets/images/hero_nikah_couple_1794069445348.jpg',
    date: '2026-11-01',
    fileSize: '6.2 MB',
    dimensions: '3840 × 2160',
  },
  {
    id: 'med_shaadi_4',
    folderId: 'shaadi',
    type: 'video',
    title: 'Qubool Hai – The Sacred Moment',
    caption: 'Emotional 4K audio recording of the Nikah ceremony solemnization.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: '/src/assets/images/folder_shaadi_nikah_1794069445495.jpg',
    date: '2026-11-01',
    fileSize: '42.5 MB',
    duration: '03:45',
  },
  // Walima
  {
    id: 'med_walima_1',
    folderId: 'walima',
    type: 'photo',
    title: 'Grand Banquet Ballroom Setting',
    caption: 'Emerald drapery, crystal chandeliers, and opulent gold candelabras for the reception.',
    url: '/src/assets/images/folder_walima_reception_1794069446459.jpg',
    thumbnail: '/src/assets/images/folder_walima_reception_1794069446459.jpg',
    date: '2026-11-03',
    fileSize: '5.4 MB',
    dimensions: '3840 × 2880',
  },
  {
    id: 'med_walima_2',
    folderId: 'walima',
    type: 'photo',
    title: 'Walima Royal Reception Portrait',
    caption: 'Bride in champagne gold embellished gown and groom under the chandelier.',
    url: '/src/assets/images/gallery_walima_couple_1794069505029.jpg',
    thumbnail: '/src/assets/images/gallery_walima_couple_1794069505029.jpg',
    date: '2026-11-03',
    fileSize: '5.1 MB',
    dimensions: '3840 × 2880',
  },
  {
    id: 'med_walima_3',
    folderId: 'walima',
    type: 'video',
    title: 'Grand Entrance & Cake Cutting',
    caption: 'Grand ballroom entrance of Zayd and Aaliya with fireworks and traditional music.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: '/src/assets/images/folder_walima_reception_1794069446459.jpg',
    date: '2026-11-03',
    fileSize: '68.0 MB',
    duration: '05:12',
  },
  // Ghar
  {
    id: 'med_ghar_1',
    folderId: 'ghar',
    type: 'photo',
    title: 'Warm Family Celebrations & Laughter',
    caption: 'Elders, aunts, and cousins gathered together with marigold garlands and tea.',
    url: '/src/assets/images/folder_ghar_family_1794069447445.jpg',
    thumbnail: '/src/assets/images/folder_ghar_family_1794069447445.jpg',
    date: '2026-10-29',
    fileSize: '4.6 MB',
    dimensions: '3840 × 2880',
  },
  {
    id: 'med_ghar_2',
    folderId: 'ghar',
    type: 'photo',
    title: 'Intricate Bridal Mehndi & Emerald Bangles',
    caption: 'Delicate floral henna patterns adorned with traditional emerald glass bangles.',
    url: '/src/assets/images/gallery_mehendi_details_1794069504906.jpg',
    thumbnail: '/src/assets/images/gallery_mehendi_details_1794069504906.jpg',
    date: '2026-10-30',
    fileSize: '3.8 MB',
    dimensions: '3840 × 2880',
  },
  {
    id: 'med_ghar_3',
    folderId: 'ghar',
    type: 'video',
    title: 'Haldi & Sangeet Family Fun',
    caption: 'Intimate candid video of cousins and aunts singing traditional wedding geet.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    thumbnail: '/src/assets/images/folder_ghar_family_1794069447445.jpg',
    date: '2026-10-30',
    fileSize: '34.2 MB',
    duration: '02:40',
  },
  // Vlog
  {
    id: 'med_vlog_1',
    folderId: 'vlog',
    type: 'video',
    title: 'Cinematic Nikah Highlights (Official Teaser)',
    caption: 'Official 4K documentary teaser capturing the essence of our wedding week.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: '/src/assets/images/folder_vlog_cinema_1794069447312.jpg',
    date: '2026-11-04',
    fileSize: '124.0 MB',
    duration: '08:20',
  },
  {
    id: 'med_vlog_2',
    folderId: 'vlog',
    type: 'photo',
    title: 'Behind the Scenes Cinema Rig',
    caption: 'Professional cinema crew capturing golden hour shots during the reception.',
    url: '/src/assets/images/folder_vlog_cinema_1794069447312.jpg',
    thumbnail: '/src/assets/images/folder_vlog_cinema_1794069447312.jpg',
    date: '2026-11-04',
    fileSize: '4.2 MB',
    dimensions: '3840 × 2160',
  },
];

// 4. Access Logs Record Store
const ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log_seed_1',
    memberId: 'mem_1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9876543210',
    folderId: 'shaadi',
    folderName: 'Shaadi – Nikah Ceremony',
    selfieImage: '/src/assets/images/hero_nikah_couple_1794069445348.jpg',
    timestamp: '2026-11-06T18:42:10Z',
    deviceInfo: 'Chrome 122.0 / macOS (1920x1080)',
    status: 'Granted',
  },
  {
    id: 'log_seed_2',
    memberId: 'mem_3',
    name: 'Fatima Zahra',
    email: 'fatima.zahra@example.com',
    phone: '9876543212',
    folderId: 'walima',
    folderName: 'Walima – Wedding Reception',
    selfieImage: '/src/assets/images/gallery_walima_couple_1794069505029.jpg',
    timestamp: '2026-11-07T07:15:30Z',
    deviceInfo: 'Safari 17.2 / iOS (iPhone 15 Pro)',
    status: 'Granted',
  },
];

// 5. Active Sessions Map (Token -> Authorized Session info)
const ACTIVE_GUEST_SESSIONS = new Map<string, {
  token: string;
  memberId: string;
  name: string;
  email: string;
  folderId: string;
  expiresAt: number;
}>();

// 6. Admin State
let ADMIN_SETTINGS = {
  websiteName: 'Our Nikah Memories',
  coupleNames: 'Zayd & Aaliya',
  weddingDate: 'November 1, 2026',
  adminEmail: 'ahmadsalman9939@gmail.com',
  adminPassword: 'admin@123',
  sessionTimeoutMinutes: 60,
  maxDailySelfieAttempts: 10,
};

let ACTIVE_ADMIN_TOKENS = new Set<string>();

// Normalization Helpers
function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove spaces, hyphens, plus, parenthesis
  let clean = phone.replace(/[\s\-\+\(\)]/g, '');
  // If starts with 91 and length is 12, take last 10
  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.substring(2);
  }
  // If starts with 0 and length is 11, take last 10
  if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean;
}

function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

function normalizeName(name: string): string {
  return (name || '').trim().toLowerCase();
}

// REST API ROUTES

// 1. Folders Listing
app.get('/api/folders', (req: Request, res: Response) => {
  res.json({
    success: true,
    folders: FOLDERS,
  });
});

// 2. Step 1: User Verification
app.post('/api/verify', (req: Request, res: Response) => {
  const { name, email, phone, folderId } = req.body;

  if (!name || !phone || !folderId) {
    return res.status(400).json({
      success: false,
      error: 'Please enter your Full Name and Mobile Number.',
    });
  }

  const cleanPhone = normalizePhone(phone);
  const cleanEmail = normalizeEmail(email || '');
  const cleanName = normalizeName(name);

  // Validate 10-digit Indian number format
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 10-digit mobile number.',
    });
  }

  // Look for match in approved members by phone and name
  const member = APPROVED_MEMBERS.find((m) => {
    const mPhone = normalizePhone(m.phone);
    const mName = normalizeName(m.name);
    const mEmail = normalizeEmail(m.email || '');

    const phoneMatches = mPhone === cleanPhone;
    const nameMatches = mName === cleanName;

    if (!phoneMatches || !nameMatches) {
      return false;
    }

    // If both member and guest provided email, verify match
    if (cleanEmail && mEmail) {
      return cleanEmail === mEmail;
    }

    return true;
  });

  if (!member) {
    return res.status(401).json({
      success: false,
      error: 'Sorry! Your details could not be verified against the pre-approved guest list. Please check your information or contact the wedding family.',
    });
  }

  if (member.status === 'disabled') {
    return res.status(403).json({
      success: false,
      error: 'Access has been suspended for this contact. Please contact the wedding admin.',
    });
  }

  // Check folder permission
  const hasPermission = member.permissions.includes(folderId.toLowerCase());
  if (!hasPermission) {
    const folderObj = FOLDERS.find((f) => f.id === folderId);
    const folderName = folderObj ? folderObj.title : folderId;
    return res.status(403).json({
      success: false,
      error: `Sorry, you do not have permission to view the "${folderName}" folder. Your permitted galleries are: ${member.permissions.map((p) => p.toUpperCase()).join(', ')}.`,
      permittedFolders: member.permissions,
    });
  }

  // Verification passed: create temporary verification token valid for 15 minutes
  const verificationToken = 'vtok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

  res.json({
    success: true,
    verificationToken,
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      permissions: member.permissions,
    },
    folderId,
  });
});

// 3. Step 2: Selfie Capture & Access Grant
app.post('/api/selfie', (req: Request, res: Response) => {
  const { verificationToken, folderId, memberId, selfieImage, deviceInfo } = req.body;

  if (!selfieImage) {
    return res.status(400).json({
      success: false,
      error: 'A verified selfie photograph is required to grant private gallery access.',
    });
  }

  // Find member
  const member = APPROVED_MEMBERS.find((m) => m.id === memberId);
  if (!member) {
    return res.status(401).json({
      success: false,
      error: 'Guest session expired or not found. Please verify details again.',
    });
  }

  const folderObj = FOLDERS.find((f) => f.id === folderId);
  const folderTitle = folderObj ? folderObj.title : folderId;

  // Create access log record
  const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newLog: AccessLog = {
    id: logId,
    memberId: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    folderId,
    folderName: folderTitle,
    selfieImage, // stored securely
    timestamp: new Date().toISOString(),
    deviceInfo: deviceInfo || 'Web Browser',
    status: 'Granted',
  };

  ACCESS_LOGS.unshift(newLog);

  // Generate 24-hour access token for the gallery
  const accessToken = 'gtok_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  ACTIVE_GUEST_SESSIONS.set(accessToken, {
    token: accessToken,
    memberId: member.id,
    name: member.name,
    email: member.email,
    folderId,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Welcome to Our Wedding Memories!',
    accessToken,
    guest: {
      name: member.name,
      email: member.email,
      folderId,
      folderTitle,
      selfieTimestamp: newLog.timestamp,
    },
  });
});

// 4. Private Gallery Media (Protected by Session Token)
app.get('/api/gallery/:folderId', (req: Request, res: Response) => {
  const { folderId } = req.params;
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || (req.query.token as string);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Please verify your guest credentials first.',
    });
  }

  const session = ACTIVE_GUEST_SESSIONS.get(token);
  // Also allow admin token access to any gallery
  const isAdmin = ACTIVE_ADMIN_TOKENS.has(token);

  if (!isAdmin) {
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        error: 'Your access session has expired. Please verify your details and selfie again.',
      });
    }

    // Verify folder match
    if (session.folderId !== folderId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have active security clearance for this specific folder.',
      });
    }
  }

  const items = MEDIA_DATABASE.filter((m) => m.folderId === folderId);
  const folderMeta = FOLDERS.find((f) => f.id === folderId);

  res.json({
    success: true,
    folder: folderMeta,
    media: items,
    total: items.length,
    guestName: session?.name || 'Administrator',
  });
});

// 5. Admin Authentication
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (
    normalizeEmail(email) === normalizeEmail(ADMIN_SETTINGS.adminEmail) &&
    password === ADMIN_SETTINGS.adminPassword
  ) {
    const adminToken = 'adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    ACTIVE_ADMIN_TOKENS.add(adminToken);

    return res.json({
      success: true,
      adminToken,
      user: {
        email: ADMIN_SETTINGS.adminEmail,
        role: 'admin',
        name: 'Wedding Host',
      },
    });
  }

  res.status(401).json({
    success: false,
    error: 'Invalid admin credentials. Please check your email and password.',
  });
});

// Admin Auth Middleware helper
function checkAdminAuth(req: Request, res: Response, next: () => void) {
  const token = req.headers.authorization?.replace('Bearer ', '') || (req.query.adminToken as string);
  if (!token || !ACTIVE_ADMIN_TOKENS.has(token)) {
    return res.status(401).json({
      success: false,
      error: 'Admin authentication required.',
    });
  }
  next();
}

// 6. Admin Dashboard Statistics
app.get('/api/admin/stats', checkAdminAuth, (req: Request, res: Response) => {
  const totalPhotos = MEDIA_DATABASE.filter((m) => m.type === 'photo').length;
  const totalVideos = MEDIA_DATABASE.filter((m) => m.type === 'video').length;

  res.json({
    success: true,
    stats: {
      totalMembers: APPROVED_MEMBERS.length,
      activeMembers: APPROVED_MEMBERS.filter((m) => m.status === 'active').length,
      totalAccessRecords: ACCESS_LOGS.length,
      totalPhotos,
      totalVideos,
      totalStorageUsed: '1.42 GB / 50 GB',
      storagePercentage: 2.84,
    },
    folderStats: FOLDERS.map((f) => ({
      id: f.id,
      title: f.title,
      accessCount: ACCESS_LOGS.filter((l) => l.folderId === f.id).length,
    })),
    recentLogs: ACCESS_LOGS.slice(0, 5),
  });
});

// 7. Admin Manage Members: List
app.get('/api/admin/members', checkAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    members: APPROVED_MEMBERS,
  });
});

// 8. Admin Add Member (Email is optional; Name, Phone, and Permissions required)
app.post('/api/admin/members', checkAdminAuth, (req: Request, res: Response) => {
  const { name, email, phone, permissions } = req.body;

  if (!name || !phone || !Array.isArray(permissions) || permissions.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Member name, 10-digit mobile number, and at least one folder permission are required.',
    });
  }

  const cleanPhone = normalizePhone(phone);
  const cleanEmail = email ? normalizeEmail(email) : '';

  // Validate 10-digit Indian number format
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 10-digit mobile number.',
    });
  }

  // Check duplicates
  const existing = APPROVED_MEMBERS.find(
    (m) => normalizePhone(m.phone) === cleanPhone || (cleanEmail && normalizeEmail(m.email) === cleanEmail)
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'A member with this mobile number already exists in the approved guestbook.',
    });
  }

  const newMember: ApprovedMember = {
    id: 'mem_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    permissions,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  APPROVED_MEMBERS.unshift(newMember);

  res.json({
    success: true,
    member: newMember,
  });
});

// 9. Admin Update Member
app.put('/api/admin/members/:id', checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, permissions, status } = req.body;

  const idx = APPROVED_MEMBERS.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }

  const cleanPhone = normalizePhone(phone);
  const cleanEmail = email ? normalizeEmail(email) : '';

  // Duplicate check on other members
  const duplicate = APPROVED_MEMBERS.find(
    (m) =>
      m.id !== id &&
      (normalizePhone(m.phone) === cleanPhone || (cleanEmail && normalizeEmail(m.email) === cleanEmail))
  );

  if (duplicate) {
    return res.status(409).json({
      success: false,
      error: 'Another member already uses this mobile number or email address.',
    });
  }

  APPROVED_MEMBERS[idx] = {
    ...APPROVED_MEMBERS[idx],
    name: name ? name.trim() : APPROVED_MEMBERS[idx].name,
    email: cleanEmail || APPROVED_MEMBERS[idx].email,
    phone: cleanPhone || APPROVED_MEMBERS[idx].phone,
    permissions: Array.isArray(permissions) ? permissions : APPROVED_MEMBERS[idx].permissions,
    status: status || APPROVED_MEMBERS[idx].status,
  };

  res.json({
    success: true,
    member: APPROVED_MEMBERS[idx],
  });
});

// 10. Admin Delete Member
app.delete('/api/admin/members/:id', checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = APPROVED_MEMBERS.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }

  const removed = APPROVED_MEMBERS.splice(idx, 1)[0];
  res.json({
    success: true,
    message: `Member ${removed.name} successfully removed.`,
  });
});

// 11. Admin Toggle Member Status
app.patch('/api/admin/members/:id/toggle', checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const member = APPROVED_MEMBERS.find((m) => m.id === id);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }

  member.status = member.status === 'active' ? 'disabled' : 'active';
  res.json({
    success: true,
    member,
  });
});

// 12. Admin Access Logs
app.get('/api/admin/logs', checkAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    logs: ACCESS_LOGS,
  });
});

// 13. Admin Media: List & Upload
app.get('/api/admin/media', checkAdminAuth, (req: Request, res: Response) => {
  const folder = req.query.folder as string;
  const filtered = folder ? MEDIA_DATABASE.filter((m) => m.folderId === folder) : MEDIA_DATABASE;
  res.json({
    success: true,
    media: filtered,
  });
});

app.post('/api/admin/media', checkAdminAuth, (req: Request, res: Response) => {
  const { folderId, type, title, caption, url, thumbnail, fileSize, duration, dimensions } = req.body;

  if (!folderId || !type || !title || !url) {
    return res.status(400).json({
      success: false,
      error: 'Folder, media type, title, and file URL are required.',
    });
  }

  const newMedia: MediaItem = {
    id: 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    folderId,
    type,
    title,
    caption: caption || '',
    url,
    thumbnail: thumbnail || url,
    date: new Date().toISOString().split('T')[0],
    fileSize: fileSize || '5.2 MB',
    dimensions: dimensions || '3840 × 2160',
    duration: duration,
  };

  MEDIA_DATABASE.unshift(newMedia);

  res.json({
    success: true,
    media: newMedia,
  });
});

app.delete('/api/admin/media/:id', checkAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = MEDIA_DATABASE.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Media not found.' });
  }

  MEDIA_DATABASE.splice(idx, 1);

  res.json({
    success: true,
    message: 'Media deleted successfully.',
  });
});

// 14. Admin Settings
app.get('/api/admin/settings', checkAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: {
      websiteName: ADMIN_SETTINGS.websiteName,
      coupleNames: ADMIN_SETTINGS.coupleNames,
      weddingDate: ADMIN_SETTINGS.weddingDate,
      adminEmail: ADMIN_SETTINGS.adminEmail,
      sessionTimeoutMinutes: ADMIN_SETTINGS.sessionTimeoutMinutes,
      maxDailySelfieAttempts: ADMIN_SETTINGS.maxDailySelfieAttempts,
      folders: FOLDERS,
    },
  });
});

app.post('/api/admin/settings', checkAdminAuth, (req: Request, res: Response) => {
  const { websiteName, coupleNames, weddingDate, adminPassword, sessionTimeoutMinutes } = req.body;

  if (websiteName) ADMIN_SETTINGS.websiteName = websiteName;
  if (coupleNames) ADMIN_SETTINGS.coupleNames = coupleNames;
  if (weddingDate) ADMIN_SETTINGS.weddingDate = weddingDate;
  if (sessionTimeoutMinutes) ADMIN_SETTINGS.sessionTimeoutMinutes = Number(sessionTimeoutMinutes);
  if (adminPassword && adminPassword.length >= 6) {
    ADMIN_SETTINGS.adminPassword = adminPassword;
  }

  res.json({
    success: true,
    message: 'Settings updated successfully.',
    settings: {
      websiteName: ADMIN_SETTINGS.websiteName,
      coupleNames: ADMIN_SETTINGS.coupleNames,
      weddingDate: ADMIN_SETTINGS.weddingDate,
      adminEmail: ADMIN_SETTINGS.adminEmail,
    },
  });
});

// Vite Integration & Static File Serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Our Nikah Memories Server running on port ${PORT}`);
  });
}

startServer();
