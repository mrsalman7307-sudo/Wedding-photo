/**
 * Our Nikah Memories - Authentication & Session Engine
 * Pure Vanilla JavaScript (ES6+)
 * Manages guest verification state, gallery security tokens, and admin credentials
 */

const STORAGE_KEYS = {
  VERIFICATION: 'onm_verification_temp',
  GUEST_TOKEN: 'onm_guest_access_token',
  GUEST_DATA: 'onm_guest_access_data',
  ADMIN_TOKEN: 'onm_admin_token',
  ADMIN_USER: 'onm_admin_user',
  SELECTED_FOLDER: 'selectedFolderId',
};

// 1. Guest Verification Step 1 Data
export function saveGuestVerification(data) {
  sessionStorage.setItem(STORAGE_KEYS.VERIFICATION, JSON.stringify(data));
}

export function getGuestVerification() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.VERIFICATION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 2. Guest Gallery Access Session (Granted after Selfie)
export function saveGuestAccessSession(accessToken, guestData) {
  sessionStorage.setItem(STORAGE_KEYS.GUEST_TOKEN, accessToken);
  sessionStorage.setItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(guestData));
}

export function getGuestAccessToken() {
  return sessionStorage.getItem(STORAGE_KEYS.GUEST_TOKEN);
}

export function getGuestAccessData() {
  const raw = sessionStorage.getItem(STORAGE_KEYS.GUEST_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearGuestSession() {
  sessionStorage.removeItem(STORAGE_KEYS.VERIFICATION);
  sessionStorage.removeItem(STORAGE_KEYS.GUEST_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.GUEST_DATA);
}

// 3. Admin Session Management
export function saveAdminSession(token, user, remember = false) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
  storage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
}

export function getAdminToken() {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
}

export function getAdminUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_USER) || sessionStorage.getItem(STORAGE_KEYS.ADMIN_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
}

// 4. Protection Guard Helpers
export function requireGuestAccess(folderId) {
  const token = getGuestAccessToken();
  const guest = getGuestAccessData();
  const adminToken = getAdminToken();

  // If Admin is browsing, they have super access to all galleries
  if (adminToken) {
    return true;
  }

  if (!token || !guest) {
    window.location.href = `/pages/verify.html${folderId ? '?folder=' + folderId : ''}`;
    return false;
  }

  if (folderId && guest.folderId !== folderId) {
    window.location.href = `/pages/verify.html?folder=${folderId}`;
    return false;
  }

  return true;
}

export function requireAdminAccess() {
  const token = getAdminToken();
  if (!token) {
    window.location.href = '/pages/admin-login.html';
    return false;
  }
  return true;
}

window.auth = {
  saveGuestVerification,
  getGuestVerification,
  saveGuestAccessSession,
  getGuestAccessToken,
  getGuestAccessData,
  clearGuestSession,
  saveAdminSession,
  getAdminToken,
  getAdminUser,
  clearAdminSession,
  requireGuestAccess,
  requireAdminAccess,
};
