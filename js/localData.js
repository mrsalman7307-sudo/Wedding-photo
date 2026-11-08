/**
 * Our Nikah Memories - Universal Data & API Layer
 * Pure Vanilla JavaScript (ES6+)
 * Provides hybrid backend + client-side persistent storage (localStorage)
 * Ensures the website works seamlessly on full-stack Node.js servers AS WELL AS
 * static hosting platforms like Netlify, GitHub Pages, or Vercel.
 */

import { saveAdminSession, getAdminToken } from './auth.js';

// Normalization Helpers
export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

export function cleanNameTokens(str) {
  return (str || '')
    .toLowerCase()
    .replace(/\b(mohammad|mohammed|muhammad|md\.?|mohd\.?)\b/g, 'mohd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanText(str) {
  return cleanNameTokens(str);
}

/**
 * Case-insensitive, whitespace-forgiving, token-aware name matching.
 * Handles cases where admin writes in ALL CAPS (e.g. "AHMAD SALMAN")
 * and guest enters in small letters (e.g. "ahmad salman" or "salman" or "ahmad").
 */
export function isNameMatch(savedName, inputName) {
  if (!savedName || !inputName) return false;

  const s1 = cleanNameTokens(savedName);
  const s2 = cleanNameTokens(inputName);

  // 1. Direct match (case-insensitive)
  if (s1 === s2) return true;

  // 2. Ignore all punctuation/whitespace
  const compact1 = s1.replace(/\s+/g, '');
  const compact2 = s2.replace(/\s+/g, '');
  if (compact1 && compact1 === compact2) return true;

  // 3. Word token matching
  const words1 = s1.split(' ').filter((w) => w.length > 0);
  const words2 = s2.split(' ').filter((w) => w.length > 0);

  if (words1.length > 0 && words2.length > 0) {
    // If all words entered by user are in saved name
    if (words2.every((w) => words1.includes(w))) return true;

    // If all words in saved name are in user input
    if (words1.every((w) => words2.includes(w))) return true;

    // If first name or last name matches with length >= 3
    const commonSignificantWord = words2.some((w) => w.length >= 3 && words1.includes(w));
    if (commonSignificantWord) return true;
  }

  // 4. Substring containment
  if ((s1.length >= 3 && s2.includes(s1)) || (s2.length >= 3 && s1.includes(s2))) {
    return true;
  }

  return false;
}

// Initial Seed Members
const SEED_MEMBERS = [
  {
    id: 'mem_admin_salman',
    name: 'Ahmad Salman',
    email: 'ahmadsalman9939@gmail.com',
    phone: '9939000000',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'mem_salman_ahmad',
    name: 'Salman Ahmad',
    email: 'salman.ahmad@guest.local',
    phone: '7307141956',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_ilman',
    name: 'Ilman',
    email: 'ilman@guest.local',
    phone: '9691202065',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_farhan_ahmad',
    name: 'Farhan Ahmad',
    email: 'farhan.ahmad@guest.local',
    phone: '7398508983',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_ilma',
    name: 'Ilma',
    email: 'ilma@guest.local',
    phone: '9621331827',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_anjum_shaikh',
    name: 'Anjum Shaikh',
    email: 'anjum.shaikh@guest.local',
    phone: '8446198135',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_abul_faiz',
    name: 'Abul Faiz',
    email: 'abul.faiz@guest.local',
    phone: '7617016790',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_mohd_azim',
    name: 'Mohd Azim',
    email: 'mohd.azim@guest.local',
    phone: '7860552576',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_sadaf',
    name: 'Sadaf',
    email: 'sadaf@guest.local',
    phone: '6390127806',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_saloni',
    name: 'Saloni',
    email: 'saloni@guest.local',
    phone: '9889505896',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_azhan_ahmad',
    name: 'Azhan Ahmad',
    email: 'azhan.ahmad@guest.local',
    phone: '7379656174',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_saba_parveen',
    name: 'Saba Parveen',
    email: 'saba.parveen@guest.local',
    phone: '7218482388',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_saba',
    name: 'Saba',
    email: 'saba@guest.local',
    phone: '8174841423',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_saheba',
    name: 'Saheba',
    email: 'saheba@guest.local',
    phone: '8574225570',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_mohd_saif',
    name: 'Mohd Saif',
    email: 'mohd.saif@guest.local',
    phone: '8726446174',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_sana_parveen',
    name: 'Sana parveen',
    email: 'sana.parveen@guest.local',
    phone: '8626016790',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_wasim',
    name: 'Wasim',
    email: 'wasim@guest.local',
    phone: '8115177070',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_tabassum',
    name: 'Tabassum',
    email: 'tabassum@guest.local',
    phone: '9208552576',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_arshiya_begum',
    name: 'Arshiya begum',
    email: 'arshiya.begum@guest.local',
    phone: '8828145780',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_asfaq_ahmad',
    name: 'Asfaq Ahmad',
    email: 'asfaq.ahmad@guest.local',
    phone: '9410391755',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_yasmeen_khatoon',
    name: 'Yasmeen khatoon',
    email: 'yasmeen.khatoon@guest.local',
    phone: '6391010951',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_sadaf_anjum',
    name: 'Sadaf Anjum',
    email: 'sadaf.anjum@guest.local',
    phone: '8171239984',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_sagufa',
    name: 'Sagufa',
    email: 'sagufa@guest.local',
    phone: '8400739211',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_zafar_azmi',
    name: 'Zafar Azmi',
    email: 'zafar.azmi@guest.local',
    phone: '9118306117',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-11-08T00:00:00Z',
  },
  {
    id: 'mem_1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9876543210',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: '2026-10-15T10:00:00Z',
  },
  {
    id: 'mem_2',
    name: 'Amit Khan',
    email: 'amit@example.com',
    phone: '9876543211',
    permissions: ['shaadi', 'walima', 'ghar', 'vlog'],
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
];

// Initial Media Database
const SEED_MEDIA = [
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

const LOCAL_STORAGE_KEYS = {
  MEMBERS: 'onm_local_members',
  LOGS: 'onm_local_access_logs',
  MEDIA: 'onm_local_media',
  SETTINGS: 'onm_local_settings',
};

// Storage Helpers
export function getLocalMembers() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.MEMBERS);
  let list = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
  }

  // Ensure all SEED_MEMBERS exist in list by phone match
  let updated = false;
  for (const seed of SEED_MEMBERS) {
    const seedPhone = normalizePhone(seed.phone);
    const exists = list.some((m) => normalizePhone(m.phone) === seedPhone);
    if (!exists) {
      list.push(seed);
      updated = true;
    }
  }

  if (updated || !raw) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(list));
  }

  return list;
}

export function saveLocalMembers(members) {
  localStorage.setItem(LOCAL_STORAGE_KEYS.MEMBERS, JSON.stringify(members));
}

export function getLocalLogs() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.LOGS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalLog(log) {
  const logs = getLocalLogs();
  logs.unshift(log);
  localStorage.setItem(LOCAL_STORAGE_KEYS.LOGS, JSON.stringify(logs));
}

export function getLocalMedia(folderId) {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.MEDIA);
  let allMedia = SEED_MEDIA;
  if (raw) {
    try {
      allMedia = JSON.parse(raw);
    } catch {
      allMedia = SEED_MEDIA;
    }
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MEDIA, JSON.stringify(SEED_MEDIA));
  }
  return folderId ? allMedia.filter((m) => m.folderId === folderId) : allMedia;
}

// -------------------------------------------------------------
// HYBRID CLIENT-SIDE API METHODS
// (First attempts network request to Express server; if server is
// not present e.g. on Netlify or offline, executes client-side fallback)
// -------------------------------------------------------------

// 1. Admin Login
export async function apiAdminLogin(email, password, remember = false) {
  const cleanEmail = cleanText(email);
  const cleanPassword = (password || '').trim();

  // Try server first
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        saveAdminSession(data.adminToken, data.user, remember);
        return { success: true, data };
      }
    }
  } catch {
    // Server unreachable (e.g. static hosting on Netlify)
  }

  // Client-Side Fallback for Netlify / Static hosting
  const isEmailMatch =
    cleanEmail === 'ahmadsalman9939@gmail.com' ||
    cleanEmail === 'ahmadsalman9939' ||
    cleanEmail === 'admin';

  const isPasswordMatch = cleanPassword === 'admin@123';

  if (isEmailMatch && isPasswordMatch) {
    const adminToken = 'adm_local_' + Date.now();
    const user = {
      email: 'ahmadsalman9939@gmail.com',
      role: 'admin',
      name: 'Ahmad Salman',
    };
    saveAdminSession(adminToken, user, remember);
    return { success: true, data: { adminToken, user } };
  }

  return {
    success: false,
    error: 'Invalid credentials. Please enter email: ahmadsalman9939@gmail.com and password: admin@123',
  };
}

// 2. Guest Verification
export async function apiVerifyGuest(name, email, phone, folderId) {
  const cleanPhone = normalizePhone(phone);
  const cleanEmail = cleanText(email || '');
  const targetFolder = (folderId || 'shaadi').toLowerCase();

  // Try server first
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: cleanEmail, phone: cleanPhone, folderId: targetFolder }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, data };
      }
    } else {
      const errData = await res.json().catch(() => null);
      if (errData?.error) {
        return { success: false, error: errData.error };
      }
    }
  } catch {
    // Server unreachable (e.g. Netlify static hosting)
  }

  // Client-Side Fallback for Netlify / Static hosting
  const members = getLocalMembers();
  const member = members.find((m) => {
    const mPhone = normalizePhone(m.phone);
    const phoneMatches = mPhone === cleanPhone || mPhone.endsWith(cleanPhone) || cleanPhone.endsWith(mPhone);
    const nameMatches = isNameMatch(m.name, name);
    return phoneMatches && nameMatches;
  });

  if (!member) {
    return {
      success: false,
      error: 'Sorry! Your details could not be verified against the pre-approved guest list. Please check your name and 10-digit mobile number.',
    };
  }

  if (member.status === 'disabled') {
    return {
      success: false,
      error: 'Access has been suspended for this contact. Please contact the wedding admin.',
    };
  }

  const allowedPerms = Array.isArray(member.permissions) && member.permissions.length > 0
    ? member.permissions.map((p) => p.toLowerCase())
    : ['shaadi', 'walima', 'ghar', 'vlog'];

  const hasPerm = allowedPerms.includes(targetFolder) || allowedPerms.includes('all');
  if (!hasPerm) {
    return {
      success: false,
      error: `Sorry, you do not have permission for this album. Permitted: ${allowedPerms.map((p) => p.toUpperCase()).join(', ')}`,
    };
  }

  const verificationToken = 'vtok_local_' + Date.now();
  return {
    success: true,
    data: {
      verificationToken,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        permissions: allowedPerms,
      },
      folderId: targetFolder,
    },
  };
}

// 3. Selfie Submission
export async function apiSubmitSelfie(verificationToken, folderId, memberId, selfieImage, deviceInfo) {
  // Try server first
  try {
    const res = await fetch('/api/selfie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationToken, folderId, memberId, selfieImage, deviceInfo }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, data };
      }
    }
  } catch {
    // Server unreachable (e.g. Netlify)
  }

  // Client-Side Fallback
  const members = getLocalMembers();
  const member = members.find((m) => m.id === memberId) || { name: 'Guest', phone: '', email: '' };

  const log = {
    id: 'log_' + Date.now(),
    memberId: member.id || memberId,
    name: member.name,
    email: member.email,
    phone: member.phone,
    folderId,
    folderName: folderId.toUpperCase(),
    selfieImage,
    timestamp: new Date().toISOString(),
    deviceInfo: deviceInfo || 'Web Browser',
    status: 'Granted',
  };

  saveLocalLog(log);

  const accessToken = 'gtok_local_' + Date.now();
  const allowedPerms = member.permissions || ['shaadi', 'walima', 'ghar', 'vlog'];

  return {
    success: true,
    data: {
      accessToken,
      guest: {
        name: member.name,
        email: member.email,
        folderId,
        folderTitle: folderId.toUpperCase(),
        permissions: allowedPerms,
        selfieTimestamp: log.timestamp,
      },
    },
  };
}

// 4. Fetch Gallery Media
export async function apiGetGalleryMedia(folderId, token) {
  try {
    const res = await fetch(`/api/gallery/${folderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, data };
    }
  } catch {
    // Fallback
  }

  const items = getLocalMedia(folderId);
  return {
    success: true,
    data: {
      folder: { id: folderId, title: folderId.toUpperCase() },
      media: items,
      total: items.length,
    },
  };
}

// 5. Member Management for Admin
export async function apiGetMembers() {
  const token = getAdminToken();
  try {
    const res = await fetch('/api/admin/members', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        saveLocalMembers(data.members);
        return { success: true, members: data.members };
      }
    }
  } catch {
    // Fallback
  }
  return { success: true, members: getLocalMembers() };
}

export async function apiAddMember(memberData) {
  const token = getAdminToken();
  const cleanPhone = normalizePhone(memberData.phone);
  const cleanEmail = cleanText(memberData.email);

  try {
    const res = await fetch('/api/admin/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...memberData, phone: cleanPhone, email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, member: data.member };
    }
  } catch {
    // Fallback
  }

  const members = getLocalMembers();
  const newMember = {
    id: 'mem_' + Date.now(),
    name: memberData.name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    permissions: memberData.permissions?.length ? memberData.permissions : ['shaadi', 'walima', 'ghar', 'vlog'],
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  members.unshift(newMember);
  saveLocalMembers(members);
  return { success: true, member: newMember };
}

export async function apiDeleteMember(memberId) {
  const token = getAdminToken();
  try {
    const res = await fetch(`/api/admin/members/${memberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { success: true };
  } catch {
    // Fallback
  }

  const members = getLocalMembers().filter((m) => m.id !== memberId);
  saveLocalMembers(members);
  return { success: true };
}

export async function apiToggleMember(memberId) {
  const token = getAdminToken();
  try {
    const res = await fetch(`/api/admin/members/${memberId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, member: data.member };
    }
  } catch {
    // Fallback
  }

  const members = getLocalMembers();
  const m = members.find((mem) => mem.id === memberId);
  if (m) {
    m.status = m.status === 'active' ? 'disabled' : 'active';
    saveLocalMembers(members);
    return { success: true, member: m };
  }
  return { success: false, error: 'Member not found' };
}

export async function apiGetLogs() {
  const token = getAdminToken();
  try {
    const res = await fetch('/api/admin/logs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, logs: data.logs };
    }
  } catch {
    // Fallback
  }

  return { success: true, logs: getLocalLogs() };
}

export async function apiGetStats() {
  const token = getAdminToken();
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { success: true, stats: data.stats, recentLogs: data.recentLogs };
    }
  } catch {
    // Fallback
  }

  const members = getLocalMembers();
  const logs = getLocalLogs();
  const media = getLocalMedia();

  return {
    success: true,
    stats: {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === 'active').length,
      totalAccessRecords: logs.length,
      totalPhotos: media.filter((m) => m.type === 'photo').length,
      totalVideos: media.filter((m) => m.type === 'video').length,
      totalStorageUsed: '1.42 GB / 50 GB',
    },
    recentLogs: logs.slice(0, 5),
  };
}
