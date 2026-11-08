/**
 * Our Nikah Memories - Guest Details Verification (Step 1)
 * Pure Vanilla JavaScript (ES6+)
 * Handles input normalization, 10-digit mobile validation, pre-approved contact matching,
 * and folder permission validation via hybrid localData layer.
 */

import { saveGuestVerification } from './auth.js';
import { showToast } from './app.js';
import { apiVerifyGuest } from './localData.js';

const FOLDERS_MAP = {
  shaadi: {
    id: 'shaadi',
    title: 'Shaadi – Nikah Ceremony',
    description: 'The Sacred Vows & Qubool Hai',
    badge: 'Ceremony',
    driveUrl: 'https://drive.google.com/drive/folders/1Bqv-OgFD2C95ta6dIZQ1bezzojP05f_c',
  },
  walima: {
    id: 'walima',
    title: 'Walima – Wedding Reception',
    description: 'Royal Banquet & Celebration',
    badge: 'Reception',
    driveUrl: 'https://drive.google.com/drive/folders/1EWuMrnv-yChWEqjnYRvqGMkODioYXoNq',
  },
  ghar: {
    id: 'ghar',
    title: 'Ghar – Family Moments',
    description: 'Intimate Henna & Celebrations',
    badge: 'Family & Haldi',
    driveUrl: 'https://drive.google.com/drive/folders/1USSkmlp613tl2o5L-j7ueDnEe5Ak3Q3T',
  },
  vlog: {
    id: 'vlog',
    title: 'Vlog – Wedding Videos',
    description: 'Cinematic Highlights & Speeches',
    badge: 'Cinematography',
    driveUrl: 'https://drive.google.com/drive/folders/1Sgs9rd39gio0DJsgLYhHbgdN-PgvelLE',
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verificationForm');
  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const folderHeader = document.getElementById('selectedFolderHeader');
  const alertContainer = document.getElementById('verificationAlert');
  const verifyBtn = document.getElementById('verifySubmitBtn');

  // 1. Identify Target Folder
  const urlParams = new URLSearchParams(window.location.search);
  let folderId = urlParams.get('folder') || sessionStorage.getItem('selectedFolderId') || 'shaadi';
  if (!FOLDERS_MAP[folderId]) {
    folderId = 'shaadi';
  }
  sessionStorage.setItem('selectedFolderId', folderId);

  // Render Folder Header
  if (folderHeader) {
    const folder = FOLDERS_MAP[folderId];
    folderHeader.innerHTML = `
      <div style="margin-bottom: 0.35rem;">
        <span class="section-kicker" style="color:var(--color-gold); font-size:0.8rem; letter-spacing:0.12em;">${folder.badge}</span>
      </div>
      <h2 style="font-size:clamp(1.5rem, 4vw, 1.85rem); margin-bottom:0.35rem; color:var(--color-primary);">${folder.title}</h2>
      <p style="color:var(--color-gold-script); font-size:0.9rem; margin-bottom:0.85rem;">${folder.description}</p>
      <div>
        <a href="${folder.driveUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline-gold" style="font-size:0.8rem; padding:0.4rem 0.85rem; display:inline-flex; align-items:center; gap:0.4rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
          <span>Open Folder in Google Drive</span>
        </a>
      </div>
    `;
  }

  function showAlert(message, isError = true) {
    if (!alertContainer) return;
    alertContainer.className = `alert-box ${isError ? 'alert-danger' : 'alert-info'}`;
    alertContainer.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink:0; margin-top:2px;">
        <circle cx="12" cy="12" r="10" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
        <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
      </svg>
      <div>${message}</div>
    `;
    alertContainer.style.display = 'flex';
  }

  function clearAlert() {
    if (alertContainer) {
      alertContainer.style.display = 'none';
      alertContainer.innerHTML = '';
    }
  }

  // 2. Form Submission & Validation
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert();

      const rawName = nameInput.value.trim();
      const rawEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
      let rawPhone = phoneInput.value.replace(/\D/g, '');
      if (rawPhone.length >= 10) {
        rawPhone = rawPhone.slice(-10);
      }

      // Validations
      if (!rawName || rawName.length < 2) {
        showAlert('Please enter your full name as registered on the wedding invitation.');
        nameInput.focus();
        return;
      }

      if (rawEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(rawEmail)) {
          showAlert('Please enter a valid email address or leave it blank.');
          emailInput.focus();
          return;
        }
      }

      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(rawPhone)) {
        showAlert('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        phoneInput.focus();
        return;
      }

      // Show loading state
      const originalBtnText = verifyBtn.innerHTML;
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="3" stroke-dasharray="31.4 31.4" />
        </svg>
        Verifying Security Credentials...
      `;

      try {
        const result = await apiVerifyGuest(rawName, rawEmail, rawPhone, folderId);

        if (result.success) {
          saveGuestVerification({
            verificationToken: result.data.verificationToken,
            member: result.data.member,
            folderId,
          });

          showToast('Guest identity confirmed! Proceeding to selfie capture...', 'success');

          setTimeout(() => {
            window.location.href = `/pages/selfie.html?folder=${folderId}`;
          }, 500);
        } else {
          showAlert(result.error || 'Sorry! Your details could not be verified. Please check your information.');
          verifyBtn.disabled = false;
          verifyBtn.innerHTML = originalBtnText;
        }
      } catch {
        showAlert('Verification could not be completed. Please check your name and mobile number.');
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = originalBtnText;
      }
    });
  }
});
